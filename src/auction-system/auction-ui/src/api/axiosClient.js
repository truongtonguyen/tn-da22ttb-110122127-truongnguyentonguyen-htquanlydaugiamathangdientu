import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    // 403 + message khóa tài khoản → tự logout
    if (
      status === 403 &&
      message.includes("Tài khoản của bạn đã bị khóa")
    ) {
      localStorage.removeItem("token");
      alert("⚠️ " + message);
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 401 → token hết hạn hoặc không hợp lệ → logout
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;