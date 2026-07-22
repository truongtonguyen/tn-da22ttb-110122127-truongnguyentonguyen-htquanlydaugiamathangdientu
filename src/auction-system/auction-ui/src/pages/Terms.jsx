import React, { useState } from "react";
import Header from "../components/Header";
import {
  FileText, BookOpen, ShieldCheck, Wallet, Gavel,
  Truck, AlertTriangle, Lock, Mail, ArrowDownToLine,
} from "lucide-react";

const Terms = () => {
  const [tab, setTab] = useState("terms");

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Điều khoản & Hướng dẫn sử dụng</h1>

        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tabBtn, ...(tab === "terms" ? styles.tabBtnActive : {}) }}
            onClick={() => setTab("terms")}
          >
            <FileText size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Điều khoản sử dụng
          </button>
          <button
            style={{ ...styles.tabBtn, ...(tab === "guide" ? styles.tabBtnActive : {}) }}
            onClick={() => setTab("guide")}
          >
            <BookOpen size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Hướng dẫn sử dụng
          </button>
        </div>

        {tab === "terms" && (
          <div style={styles.content}>
            <Section icon={ShieldCheck} title="1. Điều khoản chung">
              <p style={styles.p}>Bằng việc đăng ký và sử dụng nền tảng đấu giá trực tuyến này, người dùng đồng ý tuân thủ các điều khoản được nêu dưới đây. Nền tảng có quyền cập nhật điều khoản theo thời gian; các thay đổi sẽ được thông báo qua email hoặc thông báo trong hệ thống.</p>
              <p style={styles.p}>Người dùng phải từ đủ 18 tuổi và có đầy đủ năng lực hành vi dân sự để tham gia mua bán, đấu giá trên nền tảng.</p>
            </Section>

            <Section icon={Gavel} title="2. Quy định về đấu giá">
              <ul style={styles.list}>
                <li style={styles.li}>Mỗi lượt đặt giá phải cao hơn giá hiện tại tối thiểu bằng bước giá quy định của phiên đấu giá.</li>
                <li style={styles.li}>Người bán không được tự đặt giá cho sản phẩm của chính mình dưới bất kỳ hình thức nào (kể cả dùng tài khoản khác).</li>
                <li style={styles.li}>Hệ thống áp dụng cơ chế chống đặt giá vào giờ chót (anti-sniping): nếu có người đặt giá trong vòng 1 phút cuối, thời gian kết thúc phiên sẽ tự động gia hạn thêm 1 phút, tối đa 5 lần.</li>
                <li style={styles.li}>Mỗi người dùng chỉ được đặt giá tối đa 10 lượt trong cùng một phiên đấu giá để đảm bảo công bằng.</li>
                <li style={styles.li}>Người thắng đấu giá có nghĩa vụ hoàn tất thanh toán trong thời hạn quy định (48 giờ kể từ khi phiên kết thúc). Quá thời hạn, đơn hàng sẽ tự động bị hủy và ảnh hưởng đến điểm tín nhiệm của người dùng.</li>
              </ul>
            </Section>

            <Section icon={Wallet} title="3. Phí tham gia và Ví điện tử">
              <p style={styles.p}>Để đảm bảo tính nghiêm túc khi tham gia đấu giá, người dùng cần thanh toán một khoản phí tham gia cố định ở lần đặt giá đầu tiên trong mỗi phiên. Khoản phí này sẽ được:</p>
              <ul style={styles.list}>
                <li style={styles.li}><strong>Hoàn lại</strong> nếu người dùng không thắng phiên đấu giá đó.</li>
                <li style={styles.li}><strong>Hoàn lại</strong> nếu người thắng hoàn tất giao dịch mua hàng thành công.</li>
                <li style={styles.li}><strong>Không hoàn lại</strong> (chuyển cho người bán như khoản bồi thường) nếu người thắng hủy đơn hàng hoặc không thanh toán đúng hạn.</li>
              </ul>
              <p style={styles.p}>Ví điện tử trên nền tảng là công cụ ghi nhận số dư nội bộ, không phải tài khoản ngân hàng. Người dùng có thể nạp tiền vào ví qua cổng thanh toán VNPay và rút tiền về tài khoản ngân hàng cá nhân.</p>
            </Section>

            <Section icon={ShieldCheck} title="4. Cơ chế bảo vệ giao dịch (Escrow)">
              <p style={styles.p}>Toàn bộ khoản thanh toán của người mua sẽ được nền tảng tạm giữ cho đến khi người mua xác nhận đã nhận hàng và hài lòng với sản phẩm. Sau khi xác nhận, nền tảng sẽ giải phóng tiền cho người bán (đã trừ phí hoa hồng 5%). Cơ chế này bảo vệ người mua khỏi rủi ro mất tiền khi người bán không giao hàng hoặc giao hàng không đúng mô tả.</p>
              <p style={styles.p}>Nếu người mua không xác nhận trong vòng 7 ngày kể từ khi người bán xác nhận đã giao hàng, hệ thống sẽ tự động xác nhận thay và giải phóng tiền cho người bán.</p>
            </Section>

            <Section icon={Truck} title="5. Trách nhiệm của người bán">
              <ul style={styles.list}>
                <li style={styles.li}>Mô tả sản phẩm trung thực, chính xác, kèm hình ảnh thật.</li>
                <li style={styles.li}>Xác nhận và tiến hành giao hàng trong vòng 24 giờ kể từ khi người mua thanh toán. Vi phạm nhiều lần có thể dẫn đến giảm điểm tín nhiệm hoặc khóa tài khoản.</li>
                <li style={styles.li}>Không đăng bán các mặt hàng bị cấm hoặc hạn chế theo quy định pháp luật.</li>
              </ul>
            </Section>

            <Section icon={AlertTriangle} title="6. Xử lý vi phạm">
              <p style={styles.p}>Nền tảng có quyền tạm khóa hoặc chấm dứt tài khoản người dùng vi phạm nghiêm trọng các điều khoản, bao gồm nhưng không giới hạn: gian lận, dàn xếp giá, không thanh toán/giao hàng đúng hạn nhiều lần, đăng thông tin sai sự thật.</p>
              <p style={styles.p}>Người dùng có thể báo cáo hành vi vi phạm của người khác thông qua chức năng "Báo cáo" trên trang hồ sơ, áp dụng cho các bên đã từng có giao dịch thực tế với nhau.</p>
            </Section>

            <Section icon={Lock} title="7. Bảo mật thông tin">
              <p style={styles.p}>Thông tin cá nhân (email, số điện thoại, địa chỉ) chỉ được sử dụng cho mục đích xử lý giao dịch và không hiển thị công khai trên hồ sơ người dùng khác. Hệ thống bảo vệ tài khoản bằng xác thực 2 bước (2FA) qua mã OTP gửi đến số điện thoại đã đăng ký mỗi khi đăng nhập.</p>
            </Section>
          </div>
        )}

        {tab === "guide" && (
          <div style={styles.content}>
            <Section icon={FileText} title="1. Đăng ký và xác thực tài khoản">
              <ol style={styles.list}>
                <li style={styles.li}>Truy cập trang Đăng ký, điền đầy đủ thông tin (tên đăng nhập, email, họ tên, mật khẩu, số điện thoại — bắt buộc để nhận mã OTP đăng nhập).</li>
                <li style={styles.li}>Kiểm tra email để xác thực tài khoản qua đường link được gửi tới (hiệu lực 24 giờ).</li>
                <li style={styles.li}>Đăng nhập bằng email + mật khẩu, sau đó nhập mã OTP 6 số được gửi qua SMS để hoàn tất đăng nhập (xác thực 2 bước).</li>
              </ol>
            </Section>

            <Section icon={Gavel} title="2. Tham gia đấu giá">
              <ol style={styles.list}>
                <li style={styles.li}>Tìm sản phẩm muốn đấu giá qua thanh tìm kiếm hoặc duyệt theo danh mục.</li>
                <li style={styles.li}>Vào trang chi tiết sản phẩm, xem giá hiện tại, bước giá tối thiểu và thời gian còn lại.</li>
                <li style={styles.li}>Nhập số tiền muốn đặt (phải lớn hơn giá hiện tại ít nhất bằng bước giá) và bấm "Đặt giá ngay".</li>
                <li style={styles.li}><strong>Lưu ý:</strong> lần đặt giá đầu tiên trong mỗi phiên sẽ trừ một khoản phí tham gia từ số dư ví — đảm bảo ví có đủ số dư trước khi đặt giá.</li>
                <li style={styles.li}>Nếu muốn mua ngay không qua đấu giá, sử dụng nút "Mua ngay" (nếu sản phẩm có thiết lập giá mua ngay).</li>
              </ol>
            </Section>

            <Section icon={Wallet} title="3. Nạp tiền vào ví">
              <ol style={styles.list}>
                <li style={styles.li}>Vào mục "Ví" trên thanh điều hướng, chọn tab "Nạp tiền".</li>
                <li style={styles.li}>Nhập số tiền muốn nạp, bấm "Nạp qua VNPay" và hoàn tất thanh toán trên trang VNPay (hỗ trợ ATM nội địa, Internet Banking). Số dư được cập nhật ngay sau khi giao dịch thành công.</li>
              </ol>
            </Section>

            <Section icon={ArrowDownToLine} title="4. Rút tiền về ngân hàng">
              <ol style={styles.list}>
                <li style={styles.li}>Vào mục "Ví" trên thanh điều hướng, chọn tab "Rút tiền".</li>
                <li style={styles.li}>Nhập số tiền muốn rút (tối thiểu 100.000 VNĐ) và thông tin tài khoản ngân hàng nhận tiền (tên ngân hàng, số tài khoản, tên chủ tài khoản).</li>
                <li style={styles.li}>Bấm "Rút tiền" — số dư trong ví sẽ được trừ ngay và tiền được chuyển về tài khoản ngân hàng.</li>
              </ol>
            </Section>

            <Section icon={Truck} title="5. Sau khi thắng đấu giá">
              <ol style={styles.list}>
                <li style={styles.li}>Vào mục "Hồ sơ cá nhân → Đơn hàng của tôi" để xem đơn hàng cần thanh toán.</li>
                <li style={styles.li}>Chọn phương thức thanh toán: <strong>Ví hệ thống</strong> (trừ số dư ngay lập tức), <strong>VNPay</strong> (thanh toán qua cổng trực tuyến) hoặc <strong>COD</strong> (thanh toán khi nhận hàng).</li>
                <li style={styles.li}>Sau khi người bán xác nhận giao hàng, theo dõi trạng thái đơn hàng trên ứng dụng.</li>
                <li style={styles.li}>Khi nhận được sản phẩm và kiểm tra hài lòng, bấm "Đã nhận hàng" để hoàn tất giao dịch và giải phóng tiền cho người bán.</li>
              </ol>
            </Section>

            <Section icon={FileText} title="6. Đăng bán sản phẩm (dành cho người bán)">
              <ol style={styles.list}>
                <li style={styles.li}>Vào mục "Đăng bán", điền thông tin sản phẩm: tên, mô tả, danh mục, giá khởi điểm, bước giá, thời gian đấu giá. Có thể thiết lập thêm giá mong muốn (giá sàn) và giá mua ngay.</li>
                <li style={styles.li}>Tải lên hình ảnh sản phẩm thật, rõ nét.</li>
                <li style={styles.li}>Gửi yêu cầu, chờ admin duyệt. Nếu bị từ chối, kiểm tra lý do trong mục "Phiên đấu giá của tôi" để chỉnh sửa và đăng lại.</li>
                <li style={styles.li}>Sau khi được duyệt, phiên đấu giá sẽ bắt đầu ngay lập tức.</li>
              </ol>
            </Section>

            <Section icon={AlertTriangle} title="7. Báo cáo vi phạm">
              <p style={styles.p}>Nếu gặp vấn đề với người mua/người bán đã từng giao dịch với bạn (gian lận, không phản hồi, hàng không đúng mô tả...), vào trang hồ sơ của người đó và bấm nút "Báo cáo" để gửi khiếu nại tới admin. Mỗi cặp người dùng chỉ được gửi một báo cáo để tránh lạm dụng.</p>
            </Section>

            <div style={styles.contactBox}>
              <Mail size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Cần hỗ trợ thêm? Liên hệ: <strong>auctionsystemdatn@gmail.com</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <Icon size={18} style={{ verticalAlign: "middle", marginRight: 8, color: "#ff5722" }} />
      {title}
    </h2>
    {children}
  </div>
);

export default Terms;

const styles = {
  page:        { backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },
  container:   { maxWidth: 820, margin: "30px auto", padding: "0 20px" },
  pageTitle:   { fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 20, color: "#222" },
  tabRow:      { display: "flex", gap: 10, marginBottom: 24, borderBottom: "2px solid #e0e0e0" },
  tabBtn:      { padding: "11px 22px", border: "none", borderRadius: "8px 8px 0 0", fontSize: 14, fontWeight: 700, cursor: "pointer", backgroundColor: "#e0e0e0", color: "#555" },
  tabBtnActive:{ backgroundColor: "#ff5722", color: "#fff" },
  content:     { backgroundColor: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  section:     { marginBottom: 26 },
  sectionTitle:{ fontSize: 17, fontWeight: 700, color: "#333", marginBottom: 10 },
  p:           { fontSize: 14, color: "#444", lineHeight: 1.8, textAlign: "justify", margin: "0 0 10px" },
  list:        { fontSize: 14, color: "#444", lineHeight: 1.8, paddingLeft: 20, margin: 0 },
  li:          { textAlign: "justify", marginBottom: 6 },
  contactBox:  { marginTop: 10, padding: "12px 16px", backgroundColor: "#fff3f0", border: "1px solid #ffccbc", borderRadius: 8, fontSize: 14, color: "#444" },
};