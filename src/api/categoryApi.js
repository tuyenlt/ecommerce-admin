import axiosClient from "./axiosClient";

const categoryApi = {
  getCategories: () => {
    return axiosClient.get("/categories");
  },

  getCategoryById: (id) => {
    return axiosClient.get(`/categories/${id}`);
  },

  createCategory: (data) => {
    return axiosClient.post("/categories", data);
  },

  updateCategory: (id, data) => {
    return axiosClient.patch(`/categories/${id}`, data);
  },

  deleteCategory: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  },
};

export default categoryApi;
