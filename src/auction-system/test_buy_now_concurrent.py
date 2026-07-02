"""
Script kiểm thử Race Condition - Tính năng "Mua ngay" đồng thời
Hệ thống: Đấu giá sản phẩm điện tử (Spring Boot + JWT)
API: POST /api/auctions/{auctionId}/buy-now

Dữ liệu DB (DbReset_full.sql):
  Người mua (id 5-8):
    buyer1 / buyer1@gmail.com  (id=5)
    buyer2 / buyer2@gmail.com  (id=6)
    buyer3 / buyer3@gmail.com  (id=7)
    buyer4 / buyer4@gmail.com  (id=8)
  Mật khẩu tất cả: 123456

  Phiên đấu giá ACTIVE có buy_now_price:
    #1  — iPhone 15 Pro Max    — buy_now = 30,000,000 VNĐ  (seller_id=2)
    #2  — Samsung S24 Ultra    — buy_now = 33,000,000 VNĐ  (seller_id=2)
    #6  — Dell XPS 15 9530     — buy_now = 35,000,000 VNĐ  (seller_id=4)
    #10 — iPad Pro M4          — buy_now = 31,000,000 VNĐ  (seller_id=2)
    #11 — Samsung Tab S9 Ultra — buy_now = 28,000,000 VNĐ  (seller_id=2)

Cách dùng:
  pip install aiohttp
  python test_buy_now_concurrent.py

  Script tự động đăng nhập 4 tài khoản buyer, lấy JWT, gọi đồng thời.
  Không cần copy token thủ công.
"""

import asyncio
import aiohttp
import time
from dataclasses import dataclass
from typing import Optional


# ============================================================
# CẤU HÌNH
# ============================================================

BASE_URL = "http://localhost:8080"

# Phiên đấu giá muốn kiểm thử mua ngay đồng thời.
# Đổi sang auction_id khác nếu phiên này đã bị mua.
# Phiên ACTIVE có buy_now_price trong DB:
#   1  = iPhone 15 Pro Max    (buy_now 30 triệu)
#   2  = Samsung S24 Ultra    (buy_now 33 triệu)
#   6  = Dell XPS 15 9530     (buy_now 35 triệu)
#   10 = iPad Pro M4          (buy_now 31 triệu)
#   11 = Samsung Tab S9 Ultra (buy_now 28 triệu)
AUCTION_ID = 1

# Tài khoản người mua từ DB — mật khẩu đều là 123456
# Tất cả đều có thể mua phiên #1, 2, 6, 10, 11 (không ai là người bán)
BUYER_ACCOUNTS = [
    {"email": "buyer1@gmail.com", "password": "123456", "label": "buyer1 - Phạm Thị Dung   (id=5)"},
    {"email": "buyer2@gmail.com", "password": "123456", "label": "buyer2 - Hoàng Văn Em    (id=6)"},
    {"email": "buyer3@gmail.com", "password": "123456", "label": "buyer3 - Võ Thị Phương   (id=7)"},
    {"email": "buyer4@gmail.com", "password": "123456", "label": "buyer4 - Đặng Văn Giang  (id=8)"},
]

@dataclass
class TestResult:
    label: str
    status_code: int
    response_body: dict
    elapsed_ms: float
    error: Optional[str] = None

    @property
    def is_success(self) -> bool:
        return self.status_code == 200

    @property
    def is_rejected(self) -> bool:
        return self.status_code in (400, 409, 410)

# Bước 1: Đăng nhập lấy JWT

async def login(session: aiohttp.ClientSession, account: dict) -> Optional[str]:
    """Đăng nhập và trả về JWT token, hoặc None nếu thất bại."""
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": account["email"], "password": account["password"]}
    try:
        async with session.post(url, json=payload) as resp:
            if resp.status == 200:
                text = await resp.text()
                try:
                    import json as _json
                    data = _json.loads(text)
                    if isinstance(data, str):
                        return data
                    return (
                        data.get("token")
                        or data.get("accessToken")
                        or data.get("jwt")
                        or text.strip().strip('"')
                    )
                except Exception:
                    return text.strip().strip('"')
            else:
                body = await resp.text()
                print(f"  [THẤT BẠI] Đăng nhập [{account['email']}]: HTTP {resp.status} — {body[:80]}")
                return None
    except Exception as e:
        print(f"  [LỖI] Đăng nhập [{account['email']}]: {e}")
        return None

# Bước 2: Gọi mua ngay

async def buy_now(
    session: aiohttp.ClientSession,
    label: str,
    token: str,
    auction_id: int,
    start_event: asyncio.Event,
) -> TestResult:
    """Một người dùng thực hiện yêu cầu Mua ngay, chờ tín hiệu đồng thời."""
    url = f"{BASE_URL}/api/auctions/{auction_id}/buy-now"
    headers = {"Authorization": f"Bearer {token}"}

    await start_event.wait()  # Tất cả chờ đây, rồi bắn cùng lúc

    start = time.perf_counter()
    try:
        async with session.post(url, headers=headers) as resp:
            elapsed = (time.perf_counter() - start) * 1000
            try:
                body = await resp.json(content_type=None)
            except Exception:
                body = {"raw": await resp.text()}

            return TestResult(
                label=label,
                status_code=resp.status,
                response_body=body,
                elapsed_ms=elapsed,
            )
    except aiohttp.ClientConnectorError as e:
        elapsed = (time.perf_counter() - start) * 1000
        return TestResult(label=label, status_code=-1, response_body={},
                          elapsed_ms=elapsed, error=f"Không kết nối được server: {e}")
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return TestResult(label=label, status_code=-1, response_body={},
                          elapsed_ms=elapsed, error=str(e))

# In kết quả

def sep(char="=", width=65):
    print(char * width)


def print_result(r: TestResult):
    if r.is_success:
        status = "[THÀNH CÔNG]"
    elif r.is_rejected:
        status = "[BỊ TỪ CHỐI]"
    elif r.status_code == -1:
        status = "[LỖI KẾT NỐI]"
    else:
        status = "[KHÔNG XÁC ĐỊNH]"

    print(f"  {status} {r.label}")
    print(f"     HTTP {r.status_code} | {r.elapsed_ms:>7.1f} ms")
    if r.error:
        print(f"     Lỗi: {r.error}")
    else:
        msg = (
            r.response_body.get("message")
            or r.response_body.get("error")
            or r.response_body.get("raw", "")
        )
        if msg:
            print(f"     Phản hồi: {str(msg)[:110]}")


def analyze(results: list):
    sep()
    print("PHÂN TÍCH KẾT QUẢ")
    sep()

    successes  = [r for r in results if r.is_success]
    rejected   = [r for r in results if r.is_rejected]
    conn_errs  = [r for r in results if r.status_code == -1]
    others     = [r for r in results if not r.is_success and not r.is_rejected and r.status_code != -1]

    print(f"  Tổng số yêu cầu : {len(results)}")
    print(f"  Mua thành công  : {len(successes)}")
    print(f"  Bị từ chối      : {len(rejected)}")
    print(f"  Phản hồi khác   : {len(others)}")
    print(f"  Lỗi kết nối     : {len(conn_errs)}")
    print()

    sep("-")
    print("ĐÁNH GIÁ OPTIMISTIC LOCKING (trường @Version trong bảng auctions)")
    sep("-")

    if len(successes) == 1:
        winner = successes[0]
        print("  KẾT QUẢ: ĐẠT — Đúng 1 người mua thành công!")
        print(f"  Người thắng : {winner.label}")
        print(f"  Thời gian   : {winner.elapsed_ms:.1f} ms")
        print()
        print("  Kỳ vọng: các yêu cầu còn lại nhận HTTP 400/409.")
        print("  Spring Boot thử lại tối đa 3 lần, sau đó trả lỗi nếu trường version đã bị thay đổi.")
    elif len(successes) == 0:
        print("  KẾT QUẢ: KHÔNG ĐẠT — Không ai mua được!")
        print("  Kiểm tra lại:")
        print(f"    - Phiên #{AUCTION_ID} có đang ACTIVE không?")
        print(f"    - Trường buy_now_price có khác NULL không?")
        print(f"    - Người mua có phải người bán của phiên này không?")
    else:
        print(f"  KẾT QUẢ: KHÔNG ĐẠT — {len(successes)} người cùng mua thành công!")
        print("  Optimistic Locking CHƯA hoạt động đúng!")
        for r in successes:
            print(f"    - {r.label}")

    valid = [r for r in results if r.status_code != -1]
    if valid:
        times = [r.elapsed_ms for r in valid]
        print()
        sep("-")
        print("THỐNG KÊ THỜI GIAN PHẢN HỒI")
        sep("-")
        print(f"  Nhanh nhất : {min(times):.1f} ms")
        print(f"  Chậm nhất  : {max(times):.1f} ms")
        print(f"  Trung bình : {sum(times) / len(times):.1f} ms")

    if others:
        print()
        print("Phản hồi ngoài dự kiến:")
        for r in others:
            print(f"   {r.label}: HTTP {r.status_code} — {r.response_body}")

# Hàm chính

async def run_test():
    sep()
    print("KIỂM THỬ MUA NGAY ĐỒNG THỜI")
    sep()

    auction_info = {
        1:  "iPhone 15 Pro Max    | buy_now = 30,000,000 VNĐ | người bán: shopabc (id=2)",
        2:  "Samsung S24 Ultra    | buy_now = 33,000,000 VNĐ | người bán: shopabc (id=2)",
        6:  "Dell XPS 15 9530     | buy_now = 35,000,000 VNĐ | người bán: gadgethub (id=4)",
        10: "iPad Pro M4          | buy_now = 31,000,000 VNĐ | người bán: shopabc (id=2)",
        11: "Samsung Tab S9 Ultra | buy_now = 28,000,000 VNĐ | người bán: shopabc (id=2)",
    }
    print(f"  Máy chủ        : {BASE_URL}")
    print(f"  Phiên kiểm thử : #{AUCTION_ID} — {auction_info.get(AUCTION_ID, '(tự cấu hình)')}")
    print(f"  Số người mua   : {len(BUYER_ACCOUNTS)}")
    print(f"  Thời điểm      : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    sep()

    connector = aiohttp.TCPConnector(limit=20)
    timeout   = aiohttp.ClientTimeout(total=30)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:

        # Bước 1: Đăng nhập đồng thời lấy JWT
        print("Bước 1: Đăng nhập lấy JWT token...")
        sep("-")
        login_tasks = [login(session, acc) for acc in BUYER_ACCOUNTS]
        tokens = await asyncio.gather(*login_tasks)

        valid_pairs = [
            (acc, tok)
            for acc, tok in zip(BUYER_ACCOUNTS, tokens)
            if tok
        ]

        for acc, tok in zip(BUYER_ACCOUNTS, tokens):
            status = f"Thành công — {tok[:30]}..." if tok else "Thất bại"
            print(f"  {acc['label']}: {status}")

        if not valid_pairs:
            print("\nKhông có tài khoản nào đăng nhập được. Dừng kiểm thử.")
            return []

        if len(valid_pairs) < len(BUYER_ACCOUNTS):
            print(f"\nChỉ {len(valid_pairs)}/{len(BUYER_ACCOUNTS)} tài khoản đăng nhập thành công.")

        print()

        # Bước 2: Gọi mua ngay đồng thời
        start_event = asyncio.Event()

        tasks = [
            asyncio.create_task(
                buy_now(session, acc["label"], tok, AUCTION_ID, start_event)
            )
            for acc, tok in valid_pairs
        ]

        print(f"Bước 2: Chuẩn bị {len(tasks)} yêu cầu mua ngay đồng thời...")
        await asyncio.sleep(0.15)

        print("Bắt đầu!\n")
        t0 = time.perf_counter()
        start_event.set()

        results: list[TestResult] = await asyncio.gather(*tasks)
        total_elapsed = (time.perf_counter() - t0) * 1000

    print("KẾT QUẢ TỪNG YÊU CẦU (sắp xếp theo thời gian):")
    sep("-")
    for r in sorted(results, key=lambda x: x.elapsed_ms):
        print_result(r)
    print(f"\n  Tổng thời gian thực hiện: {total_elapsed:.1f} ms")
    print()

    analyze(results)

    sep()
    print("Hoàn tất kiểm thử")
    sep()

    return results

# Kiểm thử nhiều vòng (cần reset DB giữa các vòng)

async def run_stress(rounds: int = 3, delay_between: float = 2.0):
    """
    Chạy nhiều vòng kiểm thử liên tiếp.
    Lưu ý: Sau vòng 1, phiên đã SOLD nên các vòng tiếp theo
    sẽ không ai mua được nữa (đây là hành vi đúng).
    Để kiểm thử nhiều vòng độc lập, cần reset DB giữa các vòng:
      mysql -u root auction_db < DbReset_full.sql
    """
    sep()
    print(f"NHIỀU VÒNG: {rounds} vòng | nghỉ {delay_between}s giữa các vòng")
    print("Lưu ý: cần reset DB trước mỗi vòng để kết quả độc lập")
    sep()

    all_successes = []
    for i in range(1, rounds + 1):
        print(f"\n--- VÒNG {i}/{rounds} ---")
        results = await run_test()
        s = len([r for r in results if r.is_success])
        all_successes.append(s)
        if i < rounds:
            await asyncio.sleep(delay_between)

    sep()
    print("TỔNG KẾT NHIỀU VÒNG")
    sep()
    for i, s in enumerate(all_successes, 1):
        if s == 1:
            verdict = "Đạt (1 người thắng)"
        elif s == 0:
            verdict = "Không ai thắng (phiên đã SOLD từ vòng trước?)"
        else:
            verdict = f"Không đạt ({s} người cùng thắng — race condition!)"
        print(f"  Vòng {i}: {verdict}")


if __name__ == "__main__":
    # Chạy 1 vòng kiểm thử
    asyncio.run(run_test())

    # Kiểm thử nhiều vòng:
    # asyncio.run(run_stress(rounds=3, delay_between=2.0))