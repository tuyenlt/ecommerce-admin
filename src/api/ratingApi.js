import axiosClient from "./axiosClient";

const ratingApi = {
  getRatings: (params) => {
    return axiosClient.get("/ratings/admin", { params });
  },

  deleteRating: (id) => {
    return axiosClient.delete(`/ratings/${id}`);
  },
};

export default ratingApi;
