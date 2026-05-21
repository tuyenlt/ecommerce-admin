import axiosClient from "./axiosClient";

const OrderApi = {
	async getOrders(query = {}) {
		return await axiosClient.get("/orders", { params: query });
	},

	async getOrderById(id) {
		return await axiosClient.get(`/orders/${id}`);
	},

	async updateOrderStatus(id, status) {
		return await axiosClient.post(`/orders/${id}/status`, { status });
	},

	async cancelOrder(id) {
		return await axiosClient.post(`/orders/${id}/cancel`);
	},
};

export default OrderApi;