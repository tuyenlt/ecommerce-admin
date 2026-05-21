import axiosClient from "./axiosClient";

const productApi = {
  getProducts: (params) => {
    return axiosClient.get("/products", { params });
  },

  getProductById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  createProduct: (data) => {
    return axiosClient.post("/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateProduct: (id, data) => {
    return axiosClient.put(`/products/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProduct: (id) => {
    return axiosClient.delete(`/products/${id}`);
  },
};

export default productApi;
