import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useToastContext } from "../context/ToastContext";
import { Camera, X } from "lucide-react";

const CreateAuction = () => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    startingPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    bidIncrementStep: "",
    durationDays: "",
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Chỉ nhận số, hiển thị format VNĐ
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm({ ...form, [e.target.name]: raw });
  };

  const formatPrice = (val) =>
    val ? Number(val).toLocaleString("vi-VN") : "";

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > 10) {
      toast.warning("Tối đa 10 ảnh");
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
      try {
        if (!form.title || !form.description || !form.categoryId || !form.startingPrice || !form.durationDays) {
          toast.warning("Vui lòng nhập đầy đủ thông tin");
          return;
        }

        // Validate buyNowPrice phải lớn hơn startingPrice
        if (form.buyNowPrice && Number(form.buyNowPrice) <= Number(form.startingPrice)) {
          toast.warning("Giá mua ngay phải lớn hơn giá khởi điểm");
          return;
        }

        // Validate reservePrice không lớn hơn buyNowPrice
        if (form.reservePrice && form.buyNowPrice &&
            Number(form.reservePrice) > Number(form.buyNowPrice)) {
          toast.warning("Giá mong muốn không thể lớn hơn giá mua ngay");
          return;
        }

        // ✅ THÊM ĐOẠN 1 — Validate bidIncrementStep (đặt cùng nhóm validate ở trên)
        if (form.bidIncrementStep && Number(form.bidIncrementStep) <= 0) {
          toast.warning("Bước giá phải lớn hơn 0");
          return;
        }

        if (form.bidIncrementStep && form.startingPrice &&
            Number(form.bidIncrementStep) > Number(form.startingPrice)) {
          toast.warning("Bước giá không nên lớn hơn giá khởi điểm");
          return;
        }

        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("categoryId", form.categoryId);
        formData.append("startingPrice", form.startingPrice);
        formData.append("reservePrice", form.reservePrice || 0);
        if (form.buyNowPrice) {
          formData.append("buyNowPrice", form.buyNowPrice);
        }

        // ✅ THÊM ĐOẠN 2 — Append vào FormData (đặt cùng nhóm append ở trên)
        if (form.bidIncrementStep) {
          formData.append("bidIncrementStep", form.bidIncrementStep);
        }

        formData.append("durationDays", form.durationDays);
        images.forEach((image) => formData.append("images", image));

        await axiosClient.post("/auctions", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Đăng phiên đấu giá thành công! Đang chờ admin duyệt.");
        navigate("/my-auctions");
      } catch (err) {
        console.log(err);
        toast.error(err.response?.data?.message || "Đăng phiên đấu giá thất bại");
      }
  };

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.title}>Đăng phiên đấu giá mới</h2>

        <div style={styles.field}>
          <label style={styles.label}>Tên sản phẩm *</label>
          <input
            name="title"
            placeholder="Nhập tên sản phẩm"
            value={form.title}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Mô tả sản phẩm *</label>
          <textarea
            name="description"
            placeholder="Mô tả chi tiết sản phẩm..."
            value={form.description}
            onChange={handleChange}
            style={styles.textarea}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Danh mục *</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Giá khởi điểm (VNĐ) *</label>
            <input
              name="startingPrice"
              type="text"
              placeholder="0"
              value={formatPrice(form.startingPrice)}
              onChange={handlePriceChange}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bước giá mỗi lượt đặt (VNĐ)</label>
            <input
              name="bidIncrementStep"
              type="text"
              placeholder="Mặc định: 100.000"
              value={formatPrice(form.bidIncrementStep)}
              onChange={handlePriceChange}
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Giá mong muốn (VNĐ)</label>
            <input
              name="reservePrice"
              type="text"
              placeholder="Không bắt buộc"
              value={formatPrice(form.reservePrice)}
              onChange={handlePriceChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Giá mua ngay (VNĐ)</label>
          <input
            name="buyNowPrice"
            type="text"
            placeholder="Để trống nếu không áp dụng"
            value={formatPrice(form.buyNowPrice)}
            onChange={handlePriceChange}
            style={styles.input}
          />
          <span style={styles.hint}>
            Người mua có thể mua ngay với giá này mà không cần đấu giá
          </span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Thời gian đấu giá *</label>
          <select
            name="durationDays"
            value={form.durationDays}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Chọn thời gian</option>
            <option value="1">1 ngày</option>
            <option value="3">3 ngày</option>
            <option value="5">5 ngày</option>
            <option value="7">7 ngày</option>
            <option value="10">10 ngày</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Ảnh sản phẩm (tối đa 10 ảnh)</label>
          <label style={styles.uploadBox}>
            <Camera size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Chọn ảnh sản phẩm
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {images.length > 0 && (
          <div style={styles.previewGrid}>
            {images.map((image, index) => (
              <div key={index} style={styles.previewItem}>
                <img
                  src={URL.createObjectURL(image)}
                  alt=""
                  style={styles.preview}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={styles.removeButton}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSubmit} style={styles.button}>
          Tạo đấu giá
        </button>
      </div>
    </div>
  );
};

export default CreateAuction;

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    paddingBottom: "40px",
  },

  container: {
    width: "560px",
    margin: "40px auto",
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },

  title: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "22px",
    fontWeight: "700",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
    minWidth: 0,   // ✅ thêm dòng này
  },

  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",   // ✅ thêm margin để tách row khỏi field "Giá mua ngay" dưới
    alignItems: "flex-start",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
  },

  hint: {
    fontSize: "12px",
    color: "#999",
    marginTop: "2px",
  },

  input: {
    padding: "11px 12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },

  textarea: {
    minHeight: "120px",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
  },

  uploadBox: {
    padding: "14px",
    border: "2px dashed #ff5722",
    borderRadius: "10px",
    textAlign: "center",
    cursor: "pointer",
    color: "#ff5722",
    fontWeight: "bold",
    fontSize: "14px",
  },

  previewGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },

  previewItem: {
    position: "relative",
  },

  preview: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  removeButton: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#e53935",
    color: "white",
    fontWeight: "bold",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#ff5722",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "8px",
  },
};