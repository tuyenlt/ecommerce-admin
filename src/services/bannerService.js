import bannerApi from "@/api/bannerApi";

/**
 * Lớp trung gian xử lý logic nghiệp vụ cho banners
 */
const bannerService = {
  getAllBanners: async () => {
    return await bannerApi.getAllBanners();
  },

  getBannerById: async (id) => {
    return await bannerApi.getBannerById(id);
  },

  createBanner: async (formData) => {
    return await bannerApi.createBanner(formData);
  },

  updateBanner: async (id, formData) => {
    return await bannerApi.updateBanner(id, formData);
  },

  deleteBanner: async (id) => {
    return await bannerApi.deleteBanner(id);
  },
};

export default bannerService;
