import supportChatApi from "@/api/supportChatApi";

const supportChatService = {
	getConversations: async () => {
		try {
			const response = await supportChatApi.getConversations();
			// axiosClient returns response.data directly in the interceptor.
			// Let's return response or response.data based on structure.
			// In axiosClient.js: response.data = response.data.data; return response;
			// So `response` returned by axiosClient.get is an object where `data` holds the payload.
			// Let's return response.data to match how ratingService does: `return response.data;`.
			return response.data;
		} catch (error) {
			console.error("Error fetching support conversations:", error);
			throw error;
		}
	},

	getCustomerMessages: async (customerId, params) => {
		try {
			const response = await supportChatApi.getCustomerMessages(customerId, params);
			return response.data;
		} catch (error) {
			console.error(`Error fetching messages for customer ${customerId}:`, error);
			throw error;
		}
	},

	markAsRead: async (customerId) => {
		try {
			const response = await supportChatApi.markAsRead(customerId);
			return response.data;
		} catch (error) {
			console.error(`Error marking messages as read for customer ${customerId}:`, error);
			throw error;
		}
	},
};

export default supportChatService;
