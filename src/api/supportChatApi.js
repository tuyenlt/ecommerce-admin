import axiosClient from "./axiosClient";

const supportChatApi = {
	/**
	 * Lấy danh sách cuộc hội thoại hỗ trợ (Role: Admin)
	 * @returns {Promise<Array<{ user: object, last_message: object, unread_count: number }>>}
	 */
	getConversations: () => {
		return axiosClient.get("/support-chat/conversations");
	},

	/**
	 * Lấy lịch sử chat của khách hàng cụ thể (Role: Admin)
	 * @param {number|string} customerId
	 * @param {object} params - { page, limit }
	 * @returns {Promise<{ data: Array<object>, pagination: object }>}
	 */
	getCustomerMessages: (customerId, params) => {
		return axiosClient.get(`/support-chat/conversations/${customerId}/messages`, { params });
	},

	/**
	 * Đánh dấu đã đọc tin nhắn của khách hàng (Role: Admin)
	 * @param {number|string} customerId
	 * @returns {Promise<{ success: boolean }>}
	 */
	markAsRead: (customerId) => {
		return axiosClient.post(`/support-chat/conversations/${customerId}/read`);
	},
};

export default supportChatApi;
