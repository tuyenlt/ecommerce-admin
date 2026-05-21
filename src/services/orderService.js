import OrderApi from "@/api/orderApi";

const OrderService = {
	async getOrders(params) {
		return await OrderApi.getOrders(params);
	},

	async getOrderById(id) {
		return await OrderApi.getOrderById(id);
	},

	async updateOrderStatus(id, status) {
		return await OrderApi.updateOrderStatus(id, status);
	},

	async cancelOrder(id) {
		return await OrderApi.cancelOrder(id);
	},
}
export default OrderService;