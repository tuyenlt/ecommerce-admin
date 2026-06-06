import axiosClient from "./axiosClient";

const bannerApi = {
  getAllBanners: () => {
    return axiosClient.get("/banners/admin/all");
  },

  getBannerById: (id) => {
    return axiosClient.get(`/banners/${id}`);
  },

  createBanner: (formData) => {
    return axiosClient.post("/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateBanner: (id, formData) => {
    return axiosClient.put(`/banners/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteBanner: (id) => {
    return axiosClient.delete(`/banners/${id}`);
  },
};

export default bannerApi;
