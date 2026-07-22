import React, { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Bell, BellOff, Trophy, Megaphone, Truck, CheckCircle2, Zap, Package } from "lucide-react";

// ✅ Nhận prop whiteIcon để đổi màu icon chuông thành trắng
const NotificationBell = ({ userId, whiteIcon = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const dropRef = useRef(null);
  const stompRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const res = await axiosClient.get("/notifications");
      setNotifications(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    } catch (err) { console.log(err); }
  };

  const markAllRead = async () => {
    try {
      await axiosClient.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) { console.log(err); }
  };

  const markOneRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (err) { console.log(err); }
  };

  const connectWS = () => {
    if (!userId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (msg) => {
          try {
            const notif = JSON.parse(msg.body);
            setNotifications(prev => [notif, ...prev]);
            setUnread(prev => prev + 1);
            document.getElementById("notif-bell")?.classList.add("bell-ring");
            setTimeout(() => document.getElementById("notif-bell")?.classList.remove("bell-ring"), 1000);
          } catch (e) {
            const newNotif = { id: Date.now(), message: msg.body, read: false, createdAt: new Date().toISOString() };
            setNotifications(prev => [newNotif, ...prev]);
            setUnread(prev => prev + 1);
          }
        });
      },
    });
    client.activate();
    stompRef.current = client;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (userId) { loadNotifications(); connectWS(); }
    return () => { if (stompRef.current) stompRef.current.deactivate(); };
  }, [userId]);

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    return `${d} ngày trước`;
  };

  const getIcon = (message = "") => {
    const m = message.toLowerCase();
    if (m.includes("thắng") || m.includes("won"))      return <Trophy      size={18} color="#f57f17" />;
    if (m.includes("vượt") || m.includes("outbid"))    return <Megaphone   size={18} color="#1976d2" />;
    if (m.includes("giao") || m.includes("shipping"))  return <Truck       size={18} color="#9c27b0" />;
    if (m.includes("hoàn thành") || m.includes("paid"))return <CheckCircle2 size={18} color="#43a047" />;
    if (m.includes("mua") || m.includes("buy"))        return <Zap         size={18} color="#ff5722" />;
    if (m.includes("đơn") || m.includes("order"))      return <Package     size={18} color="#6d4c41" />;
    return <Bell size={18} color="#757575" />;
  };

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0%,100% { transform: rotate(0); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }
        .bell-ring { animation: bellRing 0.6s ease; }
      `}</style>

      <div style={styles.wrapper} ref={dropRef}>
        <button
          id="notif-bell"
          style={{
            ...styles.bellBtn,
            // ✅ Nếu whiteIcon: nền trong suốt nhẹ, icon trắng — hòa vào header cam
            backgroundColor: whiteIcon ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.15)",
            color: whiteIcon ? "#fff" : "#555",
          }}
          onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead(); }}
        >
          {/* ✅ Icon Bell màu trắng khi whiteIcon=true */}
          <Bell size={18} color={whiteIcon ? "#fff" : "#555"} />
          {unread > 0 && (
            <span style={styles.badge}>{unread > 99 ? "99+" : unread}</span>
          )}
        </button>

        {open && (
          <div style={styles.dropdown}>
            <div style={styles.dropHeader}>
              <span style={styles.dropTitle}>Thông báo</span>
              {notifications.length > 0 && (
                <button style={styles.clearBtn} onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>
              )}
            </div>

            <div style={styles.list}>
              {notifications.length === 0 ? (
                <div style={styles.empty}>
                  <div style={{ marginBottom: 8 }}><BellOff size={32} color="#bbb" /></div>
                  <p style={{ color: "#999", margin: 0, fontSize: 14 }}>Chưa có thông báo nào</p>
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    style={{
                      ...styles.item,
                      backgroundColor: n.read ? "#fff" : "#fff8f0",
                      borderLeft: n.read ? "3px solid transparent" : "3px solid #ff5722",
                    }}
                    onClick={() => markOneRead(n.id)}
                  >
                    <div style={styles.itemIcon}>{getIcon(n.message)}</div>
                    <div style={styles.itemBody}>
                      <div style={styles.itemMsg}>{n.message}</div>
                      <div style={styles.itemTime}>{formatTime(n.createdAt)}</div>
                    </div>
                    {!n.read && <div style={styles.unreadDot} />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;

const styles = {
  wrapper:   { position: "relative" },
  bellBtn:   { position: "relative", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  badge:     { position: "absolute", top: -4, right: -4, background: "#e53935", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
  dropdown:  { position: "absolute", top: "calc(100% + 10px)", right: 0, width: 360, background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", zIndex: 2000, overflow: "hidden" },
  dropHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f0f0f0" },
  dropTitle: { fontSize: 15, fontWeight: 700, color: "#222" },
  clearBtn:  { background: "none", border: "none", color: "#ff5722", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  list:      { maxHeight: 400, overflowY: "auto" },
  empty:     { padding: "40px 20px", textAlign: "center" },
  item:      { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f5f5f5" },
  itemIcon:  { fontSize: 20, flexShrink: 0, marginTop: 2 },
  itemBody:  { flex: 1, minWidth: 0 },
  itemMsg:   { fontSize: 13, color: "#333", lineHeight: 1.5, wordBreak: "break-word" },
  itemTime:  { fontSize: 11, color: "#aaa", marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", background: "#ff5722", flexShrink: 0, marginTop: 6 },
};