import axiosClient from "./axiosClient";

export const login = (data) => {
  return axiosClient.post("/auth/login", data);
};

export const register = (data) => {
  return axiosClient.post("/auth/register", data);
};

export const forgotPassword = (data) => {
  return axiosClient.post("/auth/forgot-password", data);
};

export const resetPassword = (data) => {
  return axiosClient.post("/auth/reset-password", data);
};