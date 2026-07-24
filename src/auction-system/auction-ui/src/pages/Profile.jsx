import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import axiosClient from "../api/axiosClient";
import { useNavigate, useLocation } from "react-router-dom";
import { useToastContext } from "../context/ToastContext";
import {
  CreditCard, X, AlertTriangle,
  CheckCircle2, User, Package, Pencil, MapPin, Check,
  MessageSquare, Truck, Search, ShieldCheck, PiggyBank, Zap, Banknote,
} from "lucide-react";

const roleLabel = { ADMIN: "Quản trị viên", USER: "Người dùng" };

const statusConfig = {
  PENDING:              { label: "Chờ thanh toán",  color: "#ff9800", bg: "#fff8e1", step: 1 },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận",    color: "#2196f3", bg: "#e3f2fd", step: 2 },
  SHIPPING:             { label: "Đang giao hàng",   color: "#9c27b0", bg: "#f3e5f5", step: 3 },
  PAID:                 { label: "Hoàn thành",       color: "#43a047", bg: "#e8f5e9", step: 4 },
  CANCELLED:            { label: "Đã hủy",           color: "#9e9e9e", bg: "#f5f5f5", step: 0 },
};

const paymentMethods = [
  { id: "WALLET", label: "Ví hệ thống",              icon: PiggyBank, desc: "Thanh toán ngay bằng số dư trong ví, xử lý tự động" },
  { id: "VNPAY",  label: "Thanh toán qua VNPay",     icon: Zap,       desc: "Chuyển đến cổng VNPay, hỗ trợ ATM/Internet Banking/QR" },
  { id: "COD",    label: "Thanh toán khi nhận hàng", icon: Banknote,  desc: "Thanh toán tiền mặt khi nhận hàng" },
];

const validateForm = (form) => {
  const errors = {};
  if (form.fullName !== undefined && form.fullName.trim().length > 0 && form.fullName.trim().length < 2)
    errors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
  if (form.fullName && form.fullName.trim().length > 100)
    errors.fullName = "Họ và tên không được vượt quá 100 ký tự";
  if (form.phone && !/^(0[35789][0-9]{8})$/.test(form.phone))
    errors.phone = "Số điện thoại không hợp lệ";
  if (form.address && form.address.length > 255)
    errors.address = "Địa chỉ không được vượt quá 255 ký tự";
  return errors;
};

const creditLevelColor = (level) => {
  switch (level) {
    case "Xuất sắc":   return { color: "#2e7d32", backgroundColor: "#e8f5e9" };
    case "Tốt":        return { color: "#1565c0", backgroundColor: "#e3f2fd" };
    case "Khá":        return { color: "#ef6c00", backgroundColor: "#fff3e0" };
    case "Trung bình": return { color: "#c62828", backgroundColor: "#fce4ec" };
    default:           return { color: "#616161", backgroundColor: "#f5f5f5" };
  }
};

// ── Nominatim Address Autocomplete ──
const AddressAutocomplete = ({ value, onChange, error }) => {
  const [query, setQuery]             = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const timerRef                      = useRef(null);
  const wrapRef                       = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val); onChange(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&countrycodes=vn&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "vi" } }
        );
        const data = await res.json();
        setSuggestions(data); setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleSelect = (item) => {
    const a = item.address || {};
    const parts = [a.house_number, a.road, a.suburb || a.neighbourhood || a.quarter, a.city_district || a.district || a.county, a.city || a.town || a.state].filter(Boolean);
    const display = parts.length > 0 ? parts.join(", ") : item.display_name;
    setQuery(display); onChange(display); setSuggestions([]); setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={acStyles.inputWrap}>
        <input style={{ ...acStyles.input, borderColor: error ? "#e53935" : "#ddd" }}
          placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
          value={query} onChange={handleChange} onFocus={() => suggestions.length > 0 && setOpen(true)} />
        <span style={acStyles.icon}>{loading ? <span style={acStyles.spinner} /> : <Search size={15} color="#aaa" />}</span>
      </div>
      <div style={acStyles.hint}>Gõ địa chỉ để tìm kiếm tự động, hoặc nhập tay tùy ý</div>
      {open && suggestions.length > 0 && (
        <div style={acStyles.dropdown}>
          {suggestions.map(item => (
            <div key={item.place_id} style={acStyles.suggestion} onMouseDown={() => handleSelect(item)}>
              <MapPin size={13} style={{ flexShrink: 0, color: "#ff5722", marginTop: 2 }} />
              <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{item.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const [user, setUser]           = useState(null);
  const [orders, setOrders]       = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ fullName: "", phone: "", address: "" });
  const [formErrors, setFormErrors] = useState({});
  const toast = useToastContext();
  const [saving, setSaving]       = useState(false);

  const [payingOrder, setPayingOrder]       = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentNote, setPaymentNote]       = useState("");
  const [processing, setProcessing]         = useState(false);

  const [buyerCredit, setBuyerCredit]   = useState(null);
  const [sellerCredit, setSellerCredit] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const loadProfile = async () => {
    try {
      const res = await axiosClient.get("/users/profile");
      setUser(res.data);
      setForm({ fullName: res.data.fullName || "", phone: res.data.phone || "", address: res.data.address || "" });
      if (res.data.role === "USER") loadCreditScores(res.data.id);
    } catch (err) { console.log(err); }
  };

  const loadOrders = async () => {
    try {
      const res = await axiosClient.get("/orders/my-orders");
      setOrders(res.data);
    } catch (err) { console.log(err); }
  };

  const loadCreditScores = async (userId) => {
    try { const r = await axiosClient.get(`/buyers/${userId}`);  if (r.data.totalOrders    > 0) setBuyerCredit(r.data);  } catch {}
    try { const r = await axiosClient.get(`/sellers/${userId}`); if (r.data.totalAuctions  > 0) setSellerCredit(r.data); } catch {}
  };

  useEffect(() => {
    loadProfile(); loadOrders();
    if (location.state?.tab === "orders") setActiveTab("orders");

    // ✅ Xử lý callback VNPay thanh toán đơn hàng
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("paymentStatus");
    if (paymentStatus === "success") {
      toast.success("Thanh toán VNPay thành công! Người bán sẽ sớm xác nhận giao hàng.");
      loadOrders();
      window.history.replaceState({}, "", "/profile");
    } else if (paymentStatus === "failed") {
      toast.error("Thanh toán VNPay thất bại hoặc bị hủy.");
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  const handleSave = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({}); setSaving(true);
    try {
      await axiosClient.put("/users/profile", form);
      await loadProfile(); setEditing(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data || "Cập nhật thất bại");
    } finally { setSaving(false); }
  };

  const openPayment = (order) => { setPayingOrder(order); setSelectedMethod(null); setPaymentNote(""); };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) { toast.warning("Vui lòng chọn phương thức thanh toán"); return; }

    // ✅ VNPAY: tạo URL rồi redirect luôn
    if (selectedMethod === "VNPAY") {
      setProcessing(true);
      try {
        const res = await axiosClient.post(`/payment/order-payment-url/${payingOrder.id}`);
        window.location.href = res.data.paymentUrl;
      } catch (err) {
        toast.error(err?.response?.data?.message || "Không tạo được liên kết thanh toán VNPay");
        setProcessing(false);
      }
      return;
    }

    // WALLET: kiểm tra số dư
    if (selectedMethod === "WALLET" && user.balance < payingOrder.finalPrice) {
      toast.warning("Số dư trong ví không đủ để thanh toán. Vui lòng nạp thêm tiền.");
      return;
    }

    setProcessing(true);
    try {
      await axiosClient.post(`/orders/${payingOrder.id}/confirm-payment`, { paymentMethod: selectedMethod, paymentNote });
      setPayingOrder(null);
      await loadOrders(); await loadProfile();
      toast.success(
        selectedMethod === "WALLET"
          ? "Thanh toán qua ví thành công! Người bán sẽ sớm giao hàng."
          : "Đã gửi xác nhận! Người bán sẽ kiểm tra và giao hàng sớm nhất."
      );
    } catch (err) {
          const raw = err?.response?.data?.message || "";
          toast.error(
            raw === "INSUFFICIENT_BALANCE_FOR_PAYMENT"
              ? "Số dư trong ví không đủ. Vui lòng nạp thêm tiền."
              : raw === "PROFILE_INCOMPLETE"
              ? "Vui lòng bổ sung đầy đủ thông tin giao hàng trước khi thanh toán."
              : (raw || "Có lỗi xảy ra")
          );
        } finally { setProcessing(false); }
  };

  const handleConfirmReceived = async (orderId) => {
    if (!window.confirm("Bạn xác nhận đã nhận được hàng và hàng đúng như mô tả?\n\nSau khi xác nhận, chúng tôi sẽ chuyển tiền cho người bán và không thể hoàn tác.")) return;
    try {
      await axiosClient.post(`/orders/${orderId}/complete`);
      await loadOrders();
      toast.success("Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn thành.");
    } catch (err) { toast.error(err?.response?.data?.message || "Có lỗi xảy ra"); }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try { await axiosClient.post(`/orders/${orderId}/cancel`); loadOrders(); toast.info("Đã hủy đơn hàng"); }
    catch (err) { toast.error(err?.response?.data?.message || "Hủy đơn thất bại"); }
  };

  if (!user) return <div style={styles.page}><Header /><p style={{ padding: 20, textAlign: "center" }}>Đang tải...</p></div>;

  const profileComplete = user.fullName && user.phone && user.address;
  const pendingCount    = orders.filter(o => o.status === "PENDING").length;
  const shippingCount   = orders.filter(o => o.status === "SHIPPING").length;

  // Label hiển thị phương thức trong header đơn hàng
  const methodLabel = {
    WALLET: <><PiggyBank size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Ví hệ thống</>,
    VNPAY:  <><Zap      size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />VNPay</>,
    COD:    <><Banknote size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />COD</>,
  };

  return (
    <div style={styles.page}>
      <Header />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* PAYMENT MODAL */}
      {payingOrder && (
        <div style={styles.modalOverlay} onClick={() => !processing && setPayingOrder(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18 }}>
                <CreditCard size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />Thanh toán đơn hàng
              </h3>
              <span style={{ cursor: "pointer", color: "#aaa" }} onClick={() => !processing && setPayingOrder(null)}><X size={18} /></span>
            </div>

            <div style={styles.modalOrderInfo}>
              <div style={styles.modalOrderTitle}>{payingOrder.auction?.title}</div>
              <div style={styles.modalOrderPrice}>{Number(payingOrder.finalPrice).toLocaleString("vi-VN")} VNĐ</div>
              <div style={styles.escrowNote}>
                <ShieldCheck size={14} style={{ verticalAlign: "middle", marginRight: 6, color: "#2e7d32" }} />
                <span>Tiền của bạn được <strong>nền tảng tạm giữ</strong>. Chỉ được gửi cho người bán sau khi bạn xác nhận hài lòng với sản phẩm.</span>
              </div>
            </div>

            {!selectedMethod ? (
              <div>
                <p style={styles.modalLabel}>Chọn phương thức thanh toán:</p>
                <div style={styles.methodList}>
                  {paymentMethods.map(m => (
                    <div key={m.id} style={styles.methodCard} onClick={() => setSelectedMethod(m.id)}>
                      <span style={{ color: "#ff5722" }}><m.icon size={22} /></span>
                      <div><div style={styles.methodName}>{m.label}</div><div style={styles.methodDesc}>{m.desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button style={styles.backBtn} onClick={() => setSelectedMethod(null)}>← Chọn lại</button>

                {!profileComplete && (
                  <div style={styles.profileWarningBox}>
                    <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Bạn cần bổ sung đầy đủ <strong>họ tên, số điện thoại, địa chỉ</strong> trước khi thanh toán.{" "}
                    <span style={{ textDecoration: "underline", cursor: "pointer", color: "#1565c0" }}
                      onClick={() => { setPayingOrder(null); setActiveTab("info"); }}>
                      Cập nhật ngay
                    </span>
                  </div>
                )}

                {/* ✅ WALLET */}
                {selectedMethod === "WALLET" && (
                  <div style={styles.payInfoBox}>
                    <p style={styles.payInfoTitle}>
                      <PiggyBank size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Thanh toán bằng ví hệ thống
                    </p>
                    <div style={styles.payInfoRow}>
                      <span>Số dư hiện tại</span>
                      <strong style={{ color: user.balance >= payingOrder.finalPrice ? "#43a047" : "#e53935" }}>
                        {Number(user.balance || 0).toLocaleString("vi-VN")} VNĐ
                      </strong>
                    </div>
                    <div style={styles.payInfoRow}>
                      <span>Cần thanh toán</span>
                      <strong>{Number(payingOrder.finalPrice).toLocaleString("vi-VN")} VNĐ</strong>
                    </div>
                    {user.balance < payingOrder.finalPrice ? (
                      <p style={styles.payInfoNote}>
                        <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        Số dư không đủ.{" "}
                        <span style={{ textDecoration: "underline", cursor: "pointer", color: "#1565c0" }} onClick={() => navigate("/wallet")}>
                          Nạp thêm tiền ngay
                        </span>
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: "#43a047", marginTop: 10 }}>
                        <CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        Đủ số dư — tiền sẽ được trừ ngay khi xác nhận.
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ VNPAY */}
                {selectedMethod === "VNPAY" && (
                  <div style={styles.payInfoBox}>
                    <p style={styles.payInfoTitle}>
                      <Zap size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Thanh toán qua cổng VNPay
                    </p>
                    <div style={styles.payInfoRow}><span>Số tiền</span><strong style={{ color: "#e53935" }}>{Number(payingOrder.finalPrice).toLocaleString("vi-VN")} VNĐ</strong></div>
                    <p style={{ fontSize: 13, color: "#555", marginTop: 10, lineHeight: 1.6 }}>
                      Bạn sẽ được chuyển đến cổng thanh toán VNPay. Hỗ trợ ATM nội địa, Internet Banking và quét QR.
                    </p>
                    <p style={{ fontSize: 12, color: "#43a047", marginTop: 6 }}>
                      <CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      Đơn hàng được xác nhận tự động sau khi thanh toán thành công.
                    </p>
                  </div>
                )}

                {/* COD */}
                {selectedMethod === "COD" && (
                  <div style={styles.payInfoBox}>
                    <p style={styles.payInfoTitle}><Banknote size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Thanh toán khi nhận hàng</p>
                    <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                      Bạn sẽ thanh toán <strong style={{ color: "#e53935" }}>{Number(payingOrder.finalPrice).toLocaleString("vi-VN")} VNĐ</strong> khi nhận hàng.
                    </p>
                  </div>
                )}

                {/* Ghi chú — chỉ hiển thị với COD */}
                {selectedMethod === "COD" && (
                  <div style={{ margin: "12px 20px 0" }}>
                    <label style={styles.modalLabel}>Ghi chú (tuỳ chọn):</label>
                    <textarea style={styles.noteInput} placeholder="VD: Giao giờ hành chính, gọi trước 30 phút..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} rows={3} />
                  </div>
                )}

                <button
                  style={{
                    ...styles.confirmPayBtn,
                    backgroundColor: selectedMethod === "VNPAY" ? "#003a8c" : "#43a047",
                    opacity: (processing || !profileComplete || (selectedMethod === "WALLET" && user.balance < payingOrder.finalPrice)) ? 0.6 : 1,
                  }}
                  onClick={handleConfirmPayment}
                  disabled={processing || !profileComplete || (selectedMethod === "WALLET" && user.balance < payingOrder.finalPrice)}
                >
                  {processing
                    ? "Đang xử lý..."
                    : selectedMethod === "VNPAY"
                      ? <><Zap size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Tiếp tục thanh toán VNPay</>
                      : <><CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Xác nhận</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* LEFT CARD */}
        <aside style={styles.leftCard}>
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>{user.username?.charAt(0).toUpperCase()}</div>
            <div style={styles.username}>{user.username}</div>
            <div style={styles.roleTag}>{roleLabel[user.role] || user.role}</div>
            <div style={styles.emailVerified}>
              {user.emailVerified
                ? <><CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Email đã xác thực</>
                : <><AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Email chưa xác thực</>}
            </div>
            {buyerCredit && (
              <div style={{ ...styles.creditBadge, ...creditLevelColor(buyerCredit.creditLevel) }}>
                <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Tín nhiệm người mua: {buyerCredit.creditScore}/100 — {buyerCredit.creditLevel}
              </div>
            )}
            {sellerCredit && (
              <div style={{ ...styles.creditBadge, ...creditLevelColor(sellerCredit.creditLevel) }}>
                <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Tín nhiệm người bán: {sellerCredit.creditScore}/100 — {sellerCredit.creditLevel}
              </div>
            )}
          </div>
          <div style={styles.leftDivider} />
          <nav style={styles.nav}>
            <div style={{ ...styles.navItem, ...(activeTab === "info"   ? styles.navActive : {}) }} onClick={() => setActiveTab("info")}>
              <User size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />Thông tin cá nhân
            </div>
            <div style={{ ...styles.navItem, ...(activeTab === "orders" ? styles.navActive : {}) }} onClick={() => setActiveTab("orders")}>
              <Package size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />Đơn hàng của tôi
              {(pendingCount + shippingCount) > 0 && <span style={styles.navBadge}>{pendingCount + shippingCount}</span>}
            </div>
          </nav>
        </aside>

        {/* RIGHT PANEL */}
        <main style={styles.rightPanel}>

          {/* TAB THÔNG TIN */}
          {activeTab === "info" && (
            <div>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Thông tin cá nhân</h3>
                {!editing && <button style={styles.editBtn} onClick={() => setEditing(true)}><Pencil size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Chỉnh sửa</button>}
              </div>
              {!profileComplete && (
                <div style={styles.warningBox}>
                  <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Vui lòng bổ sung <strong>họ tên, số điện thoại, địa chỉ</strong> để sử dụng đầy đủ tính năng.
                </div>
              )}
              {editing ? (
                <div style={styles.editForm}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Họ và tên</label>
                    <input style={{ ...styles.input, borderColor: formErrors.fullName ? "#e53935" : "#ddd" }} placeholder="Nhập họ và tên đầy đủ" value={form.fullName}
                      onChange={e => { setForm({ ...form, fullName: e.target.value }); if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: "" }); }} />
                    {formErrors.fullName && <span style={styles.fieldError}>{formErrors.fullName}</span>}
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Số điện thoại</label>
                    <input style={{ ...styles.input, borderColor: formErrors.phone ? "#e53935" : "#ddd" }} placeholder="VD: 0901234567" value={form.phone} maxLength={10}
                      onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ""); setForm({ ...form, phone: val }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" }); }} />
                    {formErrors.phone ? <span style={styles.fieldError}>{formErrors.phone}</span> : <span style={styles.fieldHint}>Nhập 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09</span>}
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Địa chỉ giao hàng</label>
                    <AddressAutocomplete value={form.address}
                      onChange={val => { setForm({ ...form, address: val }); if (formErrors.address) setFormErrors({ ...formErrors, address: "" }); }}
                      error={formErrors.address} />
                    {formErrors.address && <span style={styles.fieldError}>{formErrors.address}</span>}
                  </div>
                  <div style={styles.editActions}>
                    <button style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
                    <button style={styles.cancelEditBtn} onClick={() => { setEditing(false); setFormErrors({}); setForm({ fullName: user.fullName || "", phone: user.phone || "", address: user.address || "" }); }}>Hủy</button>
                  </div>
                </div>
              ) : (
                <div style={styles.infoList}>
                  {[
                    { label: "Tên tài khoản", value: user.username },
                    { label: "Email",          value: user.email },
                    { label: "Họ và tên",      value: user.fullName || <span style={styles.empty}>Chưa cập nhật</span> },
                    { label: "Số điện thoại",  value: user.phone    || <span style={styles.empty}>Chưa cập nhật</span> },
                    { label: "Địa chỉ",        value: user.address  || <span style={styles.empty}>Chưa cập nhật</span> },
                    { label: "Vai trò",        value: roleLabel[user.role] || user.role },
                  ].map(({ label, value }) => (
                    <div key={label} style={styles.infoRow}>
                      <span style={styles.infoLabel}>{label}</span>
                      <span style={styles.infoValue}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB ĐƠN HÀNG */}
          {activeTab === "orders" && (
            <div>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Đơn hàng của tôi</h3>
              </div>
              {profileComplete && (
                <div style={styles.shippingBox}>
                  <MapPin size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  <strong>Địa chỉ nhận hàng:</strong> {user.fullName} — {user.phone} — {user.address}
                </div>
              )}
              {orders.length === 0 ? (
                <p style={{ color: "#999", textAlign: "center", padding: "40px 0" }}>Bạn chưa có đơn hàng nào</p>
              ) : orders.map(order => {
                const s = statusConfig[order.status] || statusConfig.PENDING;
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <span style={styles.orderId}>Đơn #{order.id}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {order.paymentMethod && methodLabel[order.paymentMethod] && (
                          <span style={styles.methodTag}>{methodLabel[order.paymentMethod]}</span>
                        )}
                        <span style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </div>
                    </div>

                    {order.status !== "CANCELLED" && (
                      <div style={styles.progressBar}>
                        {["PENDING","PENDING_CONFIRMATION","SHIPPING","PAID"].map((st, idx) => {
                          const sc = statusConfig[st]; const done = s.step > idx; const active = s.step === idx + 1;
                          return (
                            <React.Fragment key={st}>
                              <div style={styles.progressStep}>
                                <div style={{ ...styles.progressDot, backgroundColor: done || active ? "#ff5722" : "#ddd" }}>
                                  {done ? <Check size={14} /> : idx + 1}
                                </div>
                                <div style={{ ...styles.progressLabel, color: done || active ? "#ff5722" : "#bbb" }}>{sc.label}</div>
                              </div>
                              {idx < 3 && <div style={{ ...styles.progressLine, backgroundColor: done ? "#ff5722" : "#ddd" }} />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    <div style={styles.orderBody}>
                      <img src={order.auction?.images?.length > 0 ? `http://localhost:8080/api/auctions/uploads/${order.auction.images[0].imageUrl}` : "https://via.placeholder.com/72x72?text=No+img"} alt="" style={styles.orderThumb} />
                      <div style={styles.orderInfo}>
                        <div style={styles.orderTitle} onClick={() => navigate(`/auction/${order.auction?.id}`)}>{order.auction?.title}</div>
                        <div style={styles.orderMeta}>Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}</div>
                        {order.paymentNote && <div style={styles.orderNote}><MessageSquare size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{order.paymentNote}</div>}
                        {order.status === "SHIPPING" && profileComplete && (
                          <div style={styles.orderAddress}><Package size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Giao đến: {user.address}</div>
                        )}
                      </div>
                      <div style={styles.orderPrice}>{Number(order.finalPrice).toLocaleString("vi-VN")} VNĐ</div>
                    </div>

                    {order.status === "PENDING" && (
                      <div style={styles.orderActions}>
                        <button style={styles.payBtn} onClick={() => openPayment(order)}>
                          <CreditCard size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Thanh toán ngay
                        </button>
                        <button style={styles.cancelOrderBtn} onClick={() => handleCancel(order.id)}>Hủy đơn</button>
                      </div>
                    )}
                    {order.status === "PENDING_CONFIRMATION" && (
                      <div style={styles.infoActions}>
                        ⏳ Đã xác nhận — Người bán đang kiểm tra và chuẩn bị giao hàng.
                        <button style={{ ...styles.cancelOrderBtn, marginLeft: 12 }} onClick={() => handleCancel(order.id)}>Hủy đơn</button>
                      </div>
                    )}
                    {order.status === "SHIPPING" && (
                      <div style={styles.orderActions}>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...styles.infoActions, color: "#9c27b0", borderTop: "none", padding: 0 }}>
                            <Truck size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Đơn hàng đang trên đường giao đến bạn!
                          </div>
                          <div style={styles.confirmReceivedBox}>
                            <ShieldCheck size={14} style={{ color: "#2e7d32", marginRight: 6, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#555", flex: 1 }}>Sau khi nhận và kiểm tra hàng, vui lòng xác nhận để giải phóng tiền cho người bán.</span>
                          </div>
                        </div>
                        <button style={styles.confirmReceivedBtn} onClick={() => handleConfirmReceived(order.id)}>
                          <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Đã nhận hàng
                        </button>
                      </div>
                    )}
                    {order.status === "PAID" && (
                      <div style={{ ...styles.infoActions, color: "#43a047" }}>
                        <CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        Hoàn thành lúc {order.completedAt ? new Date(order.completedAt).toLocaleString("vi-VN") : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;

const acStyles = {
  inputWrap:  { position: "relative" },
  input:      { width: "100%", padding: "10px 36px 10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box" },
  icon:       { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" },
  spinner:    { width: 14, height: 14, border: "2px solid #ddd", borderTop: "2px solid #ff5722", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
  hint:       { fontSize: 11, color: "#aaa", marginTop: 4 },
  dropdown:   { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 999, maxHeight: 220, overflowY: "auto" },
  suggestion: { display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f5f5f5" },
};

const styles = {
  page:      { backgroundColor: "#f5f5f5", minHeight: "100vh" },
  container: { maxWidth: 1100, margin: "30px auto", padding: "0 20px", display: "flex", gap: 24, alignItems: "flex-start" },
  leftCard:      { width: 230, flexShrink: 0, backgroundColor: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", overflow: "hidden" },
  avatarSection: { padding: "28px 20px 20px", textAlign: "center" },
  avatar:        { width: 72, height: 72, borderRadius: "50%", backgroundColor: "#ff5722", color: "#fff", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
  username:      { fontWeight: 700, fontSize: 16, color: "#222", marginBottom: 4 },
  roleTag:       { display: "inline-block", fontSize: 12, color: "#888", backgroundColor: "#f0f0f0", borderRadius: 12, padding: "2px 10px", marginBottom: 8 },
  emailVerified: { fontSize: 12, color: "#43a047" },
  creditBadge:   { display: "block", fontSize: 12, fontWeight: 600, borderRadius: 12, padding: "3px 10px", marginTop: 6, textAlign: "center" },
  leftDivider:   { height: 1, backgroundColor: "#f0f0f0" },
  nav:           { padding: "10px 10px 14px" },
  navItem:       { padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#555", display: "flex", alignItems: "center", marginBottom: 2 },
  navActive:     { backgroundColor: "#fff3e0", color: "#ff5722", fontWeight: 700 },
  navBadge:      { marginLeft: "auto", backgroundColor: "#e53935", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 },
  rightPanel:    { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  panelHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  panelTitle:    { fontSize: 18, fontWeight: 700, color: "#222", margin: 0 },
  editBtn:       { padding: "7px 14px", backgroundColor: "#ff5722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  warningBox:    { backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#795548", marginBottom: 16 },
  editForm:      { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup:    { display: "flex", flexDirection: "column", gap: 4 },
  label:         { fontSize: 13, fontWeight: 600, color: "#555" },
  input:         { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" },
  fieldError:    { color: "#e53935", fontSize: 12, marginTop: 2 },
  fieldHint:     { color: "#aaa", fontSize: 11, marginTop: 3 },
  editActions:   { display: "flex", gap: 10, marginTop: 4 },
  saveBtn:       { padding: "10px 20px", backgroundColor: "#ff5722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 },
  cancelEditBtn: { padding: "10px 20px", backgroundColor: "#f5f5f5", color: "#555", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  infoList:      { display: "flex", flexDirection: "column" },
  infoRow:       { display: "flex", padding: "13px 0", borderBottom: "1px solid #f5f5f5" },
  infoLabel:     { width: 160, fontSize: 13, color: "#999", flexShrink: 0 },
  infoValue:     { fontSize: 14, color: "#222", fontWeight: 500 },
  empty:         { color: "#ccc", fontStyle: "italic" },
  shippingBox:   { backgroundColor: "#e8f5e9", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2e7d32", marginBottom: 16 },
  orderCard:     { border: "1px solid #f0f0f0", borderRadius: 12, marginBottom: 16, overflow: "hidden" },
  orderHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  orderId:       { fontWeight: 700, fontSize: 14, color: "#333" },
  methodTag:     { fontSize: 12, color: "#555", backgroundColor: "#f5f5f5", padding: "2px 8px", borderRadius: 10 },
  statusBadge:   { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  progressBar:   { display: "flex", alignItems: "center", padding: "12px 20px" },
  progressStep:  { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  progressDot:   { width: 28, height: 28, borderRadius: "50%", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  progressLabel: { fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  progressLine:  { flex: 1, height: 3, margin: "0 6px", marginBottom: 18 },
  orderBody:     { display: "flex", gap: 14, padding: 16, alignItems: "flex-start" },
  orderThumb:    { width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #f0f0f0" },
  orderInfo:     { flex: 1 },
  orderTitle:    { fontSize: 15, fontWeight: 600, color: "#333", cursor: "pointer", marginBottom: 4 },
  orderMeta:     { fontSize: 12, color: "#aaa", marginBottom: 4 },
  orderNote:     { fontSize: 12, color: "#888", marginTop: 4 },
  orderAddress:  { fontSize: 12, color: "#9c27b0", marginTop: 4 },
  orderPrice:    { fontSize: 16, fontWeight: 700, color: "#e53935", flexShrink: 0 },
  orderActions:      { display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid #f0f0f0", backgroundColor: "#fafafa", alignItems: "center" },
  payBtn:            { padding: "8px 18px", backgroundColor: "#ff5722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 },
  cancelOrderBtn:    { padding: "8px 14px", backgroundColor: "#fff", color: "#e53935", border: "1px solid #e53935", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  infoActions:       { padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: 13, color: "#666", backgroundColor: "#fafafa", display: "flex", alignItems: "center" },
  confirmReceivedBox:{ display: "flex", alignItems: "flex-start", backgroundColor: "#e8f5e9", borderRadius: 8, padding: "8px 12px", marginTop: 8, fontSize: 12 },
  confirmReceivedBtn:{ padding: "10px 16px", backgroundColor: "#43a047", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 },
  modalOverlay:   { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal:          { backgroundColor: "#fff", borderRadius: 14, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  modalHeader:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" },
  modalOrderInfo: { padding: "14px 20px", backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  modalOrderTitle:{ fontSize: 15, fontWeight: 600, color: "#333", marginBottom: 4 },
  modalOrderPrice:{ fontSize: 20, fontWeight: 700, color: "#e53935", marginBottom: 8 },
  escrowNote:     { display: "flex", alignItems: "flex-start", gap: 4, backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#2e7d32", marginTop: 8 },
  modalLabel:     { fontSize: 13, fontWeight: 600, color: "#555", margin: "14px 20px 8px", display: "block" },
  methodList:     { display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 16px" },
  methodCard:     { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid #e0e0e0", borderRadius: 10, cursor: "pointer" },
  methodName:     { fontSize: 14, fontWeight: 600, color: "#333" },
  methodDesc:     { fontSize: 12, color: "#888", marginTop: 2 },
  backBtn:        { margin: "12px 20px 0", padding: "6px 14px", backgroundColor: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#555", display: "block" },
  profileWarningBox: { margin: "12px 20px 0", padding: "10px 14px", backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, fontSize: 13, color: "#795548" },
  payInfoBox:     { margin: "12px 20px", padding: "14px", backgroundColor: "#f9f9f9", borderRadius: 10, border: "1px solid #e0e0e0" },
  payInfoTitle:   { fontSize: 14, fontWeight: 700, color: "#333", margin: "0 0 10px" },
  payInfoRow:     { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 },
  payInfoNote:    { fontSize: 12, color: "#ff9800", marginTop: 10 },
  noteInput:      { width: "calc(100% - 40px)", display: "block", margin: "8px 20px 0", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" },
  confirmPayBtn:  { margin: "14px 20px 20px", padding: "12px 20px", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, width: "calc(100% - 40px)", display: "block" },
};