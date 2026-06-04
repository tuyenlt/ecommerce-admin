import statisticsApi from "../api/statisticsApi";

const statisticsService = {
	getRevenueByMonth: async (year) => {
		try {
			const response = await statisticsApi.getRevenueByMonth(year);
			return response.data;
		} catch (error) {
			console.error("Error fetching revenue stats:", error);
			throw error;
		}
	},
	getOrdersByMonth: async (year) => {
		try {
			const response = await statisticsApi.getOrdersByMonth(year);
			return response.data;
		} catch (error) {
			console.error("Error fetching orders stats:", error);
			throw error;
		}
	},
	getTopSellingProducts: async (params) => {
		try {
			const response = await statisticsApi.getTopSellingProducts(params);
			return response.data;
		} catch (error) {
			console.error("Error fetching top selling products:", error);
			throw error;
		}
	},
	getTotalProducts: async () => {
		try {
			const response = await statisticsApi.getTotalProducts();
			return response.data;
		} catch (error) {
			console.error("Error fetching total products:", error);
			throw error;
		}
	},
	getDashboard: async (year) => {
		try {
			const response = await statisticsApi.getDashboard(year);
			return response.data;
		} catch (error) {
			console.error("Error fetching dashboard stats:", error);
			throw error;
		}
	},
};

export default statisticsService;
