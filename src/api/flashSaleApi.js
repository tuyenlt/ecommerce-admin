import axiosClient from "./axiosClient";

const flashSaleApi = {
	getAllFlashSales: () => {
		return axiosClient.get("/flash-sales");
	},

	createFlashSale: (data) => {
		return axiosClient.post("/flash-sales", data);
	},

	updateFlashSale: (id, data) => {
		return axiosClient.put(`/flash-sales/${id}`, data);
	},

	deleteFlashSale: (id) => {
		return axiosClient.delete(`/flash-sales/${id}`);
	},

	addFlashSaleItems: (id, data) => {
		return axiosClient.post(`/flash-sales/${id}/items`, data);
	},

	deleteFlashSaleItems: (id, data) => {
		// axiosClient delete supports data parameter in config
		return axiosClient.delete(`/flash-sales/${id}/items`, { data });
	},
};

export default flashSaleApi;
