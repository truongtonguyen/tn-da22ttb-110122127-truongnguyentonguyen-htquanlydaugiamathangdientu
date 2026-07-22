import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";
import { useToastContext } from "../context/ToastContext";
import { Wallet, Zap, ChevronDown, ChevronUp, ArrowDownToLine} from "lucide-react";

const MIN_WITHDRAWAL = 100000;

const WalletTopup = () => {
  const toast = useToastContext();
  const [balance, setBalance]     = useState(0);
  const [mainTab, setMainTab]     = useState("deposit");
  const [amount, setAmount]       = useState("");
  const [history, setHistory]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Rút tiền
  const [withdrawAmount, setWithdrawAmount]         = useState("");
  const [bankName, setBankName]                     = useState("");
  const [bankAccountNumber, setBankAccountNumber]   = useState("");
  const [bankAccountName, setBankAccountName]       = useState("");
  const [withdrawals, setWithdrawals]               = useState([]);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [withdrawLoading, setWithdrawLoading]       = useState(false);

  useEffect(() => {
    loadBalance();
    loadHistory();
    loadWithdrawals();

    // ✅ Xử lý callback VNPay sau khi thanh toán
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("paymentStatus");
    if (paymentStatus === "success") {
      toast.success("Nạp tiền qua VNPay thành công! Số dư đã được cập nhật.");
      loadBalance();
      window.history.replaceState({}, "", "/wallet");
    } else if (paymentStatus === "failed") {
      toast.error("Thanh toán VNPay thất bại hoặc bị hủy.");
      window.history.replaceState({}, "", "/wallet");
    }
  }, []);

  const loadBalance    = async () => { try { const r = await axiosClient.get("/wallet/balance");          setBalance(r.data.balance); } catch (e) { console.log(e); } };
  const loadHistory    = async () => { try { const r = await axiosClient.get("/wallet/my-topups");        setHistory(r.data);         } catch (e) { console.log(e); } };
  const loadWithdrawals = async () => { try { const r = await axiosClient.get("/withdrawals/my-withdrawals"); setWithdrawals(r.data);  } catch (e) { console.log(e); } };

  const handleAmountChange         = (e) => setAmount(e.target.value.replace(/\D/g, ""));
  const handleWithdrawAmountChange = (e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""));
  const formatPrice = (val) => val ? Number(val).toLocaleString("vi-VN") : "";

  // ✅ Chỉ còn VNPay — bỏ nạp thủ công
  const handleVNPayTopup = async () => {
    if (!amount || Number(amount) <= 0) { toast.warning("Vui lòng nhập số tiền hợp lệ"); return; }
    setLoading(true);
    try {
      const res = await axiosClient.post("/payment/wallet-topup-url", { amount: Number(amount) });
      window.location.href = res.data.paymentUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || "Không tạo được liên kết thanh toán");
    } finally { setLoading(false); }
  };

  // ✅ Rút tiền giả lập — COMPLETED ngay lập tức
  const handleWithdrawSubmit = async () => {
    if (!withdrawAmount || Number(withdrawAmount) < MIN_WITHDRAWAL) {
      toast.warning(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString("vi-VN")} VNĐ`);
      return;
    }
    if (Number(withdrawAmount) > balance) { toast.warning("Số dư không đủ"); return; }
    if (!bankName || !bankAccountNumber || !bankAccountName) {
      toast.warning("Vui lòng nhập đầy đủ thông tin ngân hàng");
      return;
    }
    setWithdrawLoading(true);
    try {
      await axiosClient.post("/withdrawals", {
        amount: Number(withdrawAmount),
        bankName,
        bankAccountNumber,
        bankAccountName,
      });
      toast.success(`✅ Rút tiền thành công (giả lập)! ${formatPrice(withdrawAmount)} VNĐ đã được chuyển đến ${bankName} - ${bankAccountNumber}`);
      setWithdrawAmount(""); setBankName(""); setBankAccountNumber(""); setBankAccountName("");
      loadBalance();
      loadWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally { setWithdrawLoading(false); }
  };

  const renderTopupStatus = (status) => {
    const map = {
      PENDING:  { text: "Chờ xác nhận", color: "#f57c00" },
      APPROVED: { text: "Đã cộng tiền", color: "#2e7d32" },
      REJECTED: { text: "Bị từ chối",   color: "#c62828" },
    };
    return map[status] || { text: status, color: "#666" };
  };

  const renderWithdrawStatus = (status) => {
    const map = {
      PENDING:   { text: "Đang xử lý",      color: "#f57c00" },
      COMPLETED: { text: "Đã chuyển khoản", color: "#2e7d32" },
      REJECTED:  { text: "Bị từ chối",      color: "#c62828" },
    };
    return map[status] || { text: status, color: "#666" };
  };

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.title}>
          <Wallet size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Ví của tôi
        </h2>

        {/* Số dư */}
        <div style={styles.balanceBox}>
          <span style={styles.balanceLabel}>Số dư hiện tại</span>
          <span style={styles.balanceValue}>{balance?.toLocaleString("vi-VN")} VNĐ</span>
        </div>

        {/* Tab Nạp / Rút */}
        <div style={styles.mainTabs}>
          <button style={{ ...styles.mainTab, ...(mainTab === "deposit"  ? styles.mainTabActive : {}) }} onClick={() => setMainTab("deposit")}>
            <Zap size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Nạp tiền
          </button>
          <button style={{ ...styles.mainTab, ...(mainTab === "withdraw" ? styles.mainTabActive : {}) }} onClick={() => setMainTab("withdraw")}>
            <ArrowDownToLine size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Rút tiền
          </button>
        </div>

        {/* ══ NẠP TIỀN ══ */}
        {mainTab === "deposit" && (
          <>
            <div style={styles.methodPanel}>
              <p style={styles.methodDesc}>
                <Zap size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "#003a8c" }} />
                Nạp tiền qua cổng <strong>VNPay</strong> — số dư được cộng ngay lập tức sau khi giao dịch thành công.
              </p>
              <div style={styles.field}>
                <label style={styles.label}>Số tiền muốn nạp (VNĐ)</label>
                <input type="text" value={formatPrice(amount)} onChange={handleAmountChange}
                  placeholder="Nhập số tiền..." style={styles.input} />
              </div>

              {/* Gợi ý số tiền nhanh */}
              <div style={styles.quickAmounts}>
                {[500000, 1000000, 2000000, 5000000, 10000000].map(v => (
                  <button key={v} style={styles.quickBtn} onClick={() => setAmount(String(v))}>
                    {v.toLocaleString("vi-VN")}
                  </button>
                ))}
              </div>

              <button onClick={handleVNPayTopup} disabled={loading || !amount}
                style={{ ...styles.vnpayBtn, opacity: (loading || !amount) ? 0.7 : 1 }}>
                {loading ? "Đang tạo liên kết..." : `Nạp ${amount ? formatPrice(amount) + " VNĐ" : ""} qua VNPay`}
              </button>
            </div>

            {/* Lịch sử nạp */}
            <div style={styles.historyBox}>
              <div style={styles.historyHeader} onClick={() => setShowHistory(!showHistory)}>
                <span style={styles.boxTitle}>Lịch sử nạp tiền ({history.length})</span>
                {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showHistory && (
                history.length === 0
                  ? <p style={{ color: "#999", fontSize: 14 }}>Chưa có giao dịch nào</p>
                  : history.map(item => {
                      const s = renderTopupStatus(item.status);
                      return (
                        <div key={item.id} style={styles.historyItem}>
                          <div>
                            <div style={styles.historyAmount}>{item.amount?.toLocaleString("vi-VN")} VNĐ</div>
                            <div style={styles.historyTime}>{new Date(item.createdAt).toLocaleString("vi-VN")}</div>
                            {item.vnpTxnRef && <div style={{ ...styles.historyTime, fontFamily: "monospace" }}>Mã GD: {item.vnpTxnRef}</div>}
                          </div>
                          <span style={{ color: s.color, fontWeight: 600, fontSize: 13 }}>{s.text}</span>
                        </div>
                      );
                    })
              )}
            </div>
          </>
        )}

        {/* ══ RÚT TIỀN ══ */}
        {mainTab === "withdraw" && (
          <>
            <p style={styles.methodDesc}>
              Rút số dư trong ví về tài khoản ngân hàng. Tối thiểu: <strong>{MIN_WITHDRAWAL.toLocaleString("vi-VN")} VNĐ</strong>.
            </p>

            <div style={styles.field}>
              <label style={styles.label}>Số tiền muốn rút (VNĐ)</label>
              <input type="text" value={formatPrice(withdrawAmount)} onChange={handleWithdrawAmountChange}
                placeholder="0" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ngân hàng nhận tiền</label>
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder="VD: Vietcombank, Sacombank..." style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Số tài khoản</label>
              <input type="text" value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Nhập số tài khoản" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tên chủ tài khoản</label>
              <input type="text" value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN VAN A" style={styles.input} />
            </div>

            <button onClick={handleWithdrawSubmit} disabled={withdrawLoading}
              style={{ ...styles.withdrawBtn, opacity: withdrawLoading ? 0.7 : 1 }}>
              {withdrawLoading ? "Đang xử lý..." : "Rút tiền"}
            </button>

            {/* Lịch sử rút */}
            <div style={styles.historyBox}>
              <div style={styles.historyHeader} onClick={() => setShowWithdrawHistory(!showWithdrawHistory)}>
                <span style={styles.boxTitle}>Lịch sử rút tiền ({withdrawals.length})</span>
                {showWithdrawHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showWithdrawHistory && (
                withdrawals.length === 0
                  ? <p style={{ color: "#999", fontSize: 14 }}>Chưa có giao dịch nào</p>
                  : withdrawals.map(item => {
                      const s = renderWithdrawStatus(item.status);
                      return (
                        <div key={item.id} style={styles.historyItem}>
                          <div>
                            <div style={styles.historyAmount}>{item.amount?.toLocaleString("vi-VN")} VNĐ</div>
                            <div style={styles.historyTime}>{item.bankName} - {item.bankAccountNumber}</div>
                            <div style={styles.historyTime}>{new Date(item.createdAt).toLocaleString("vi-VN")}</div>
                          </div>
                          <span style={{ color: s.color, fontWeight: 600, fontSize: 13 }}>{s.text}</span>
                        </div>
                      );
                    })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletTopup;

const styles = {
  page:         { backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },
  container:    { width: "460px", margin: "40px auto", backgroundColor: "white", padding: "28px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "16px" },
  title:        { textAlign: "center", marginBottom: 0, fontSize: 21, fontWeight: 700 },
  balanceBox:   { background: "#fff3f0", border: "1px solid #ffccbc", borderRadius: 10, padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  balanceLabel: { fontSize: 12, color: "#888" },
  balanceValue: { fontSize: 24, fontWeight: 700, color: "#ff5722" },
  mainTabs:     { display: "flex", gap: 8, borderBottom: "2px solid #eee" },
  mainTab:      { flex: 1, padding: "10px 12px", border: "none", background: "transparent", color: "#777", fontSize: 14, fontWeight: 700, cursor: "pointer", borderBottom: "3px solid transparent" },
  mainTabActive:{ color: "#ff5722", borderBottom: "3px solid #ff5722" },
  methodPanel:  { display: "flex", flexDirection: "column", gap: 14 },
  methodDesc:   { fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 },
  field:        { display: "flex", flexDirection: "column", gap: 6 },
  label:        { fontSize: 13, fontWeight: 600, color: "#444" },
  input:        { padding: "11px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none" },
  quickAmounts: { display: "flex", gap: 8, flexWrap: "wrap" },
  quickBtn:     { padding: "6px 14px", border: "1px solid #ffccbc", borderRadius: 20, background: "#fff3f0", color: "#ff5722", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  vnpayBtn:     { padding: "14px", border: "none", borderRadius: 8, backgroundColor: "#003a8c", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 15 },
  withdrawBtn:  { padding: "14px", border: "none", borderRadius: 8, backgroundColor: "#2e7d32", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 15 },
  historyBox:   { borderTop: "1px solid #eee", paddingTop: 12 },
  historyHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 },
  boxTitle:     { fontSize: 14, fontWeight: 700 },
  historyItem:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  historyAmount:{ fontWeight: 600, fontSize: 14 },
  historyTime:  { fontSize: 12, color: "#999" },
};