import ratingApi from "@/api/ratingApi";

const ratingService = {
  getRatings: async (params) => {
    try {
      const response = await ratingApi.getRatings(params);
      return response.data;
    } catch (error) {
      console.error("Error fetching ratings:", error);
      throw error;
    }
  },

  deleteRating: async (id) => {
    try {
      const response = await ratingApi.deleteRating(id);
      return response.data;
    } catch (error) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  },
};

export default ratingService;
