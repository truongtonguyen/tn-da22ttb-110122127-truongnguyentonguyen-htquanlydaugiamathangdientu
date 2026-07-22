import axiosClient from "./axiosClient";

// lấy tất cả category
export const getAllCategories = () =>
  axiosClient.get("/categories");

// lấy tất cả auction — categoryId tùy chọn, nếu không truyền thì lấy tất cả
export const getAllAuctions = (page = 0, size = 8, categoryId = null) => {
  const params = { page, size };
  if (categoryId !== null) params.categoryId = categoryId;
  return axiosClient.get("/auctions", { params });
};

// search auction
export const searchAuctions = (keyword, status, page = 0, size = 10) => {
  return axiosClient.get("/auctions/search", {
    params: { keyword, status, page, size },
  });
};

export const getAuctionById = (id) => {
  return axiosClient.get(`/auctions/${id}`);
};