import axiosClient from "./axiosClient";

const STATISTICS_ENDPOINT = "/stats";

const statisticsApi = {
	getRevenueByMonth(year) {
		const params = year ? { year } : {};
		return axiosClient.get(`${STATISTICS_ENDPOINT}/revenue-by-month`, { params });
	},
	getOrdersByMonth(year) {
		const params = year ? { year } : {};
		return axiosClient.get(`${STATISTICS_ENDPOINT}/orders-by-month`, { params });
	},
	getTopSellingProducts(params) {
		return axiosClient.get(`${STATISTICS_ENDPOINT}/top-selling-products`, { params });
	},
	getTotalProducts() {
		return axiosClient.get(`${STATISTICS_ENDPOINT}/total-products`);
	},
	getDashboard(year) {
		const params = year ? { year } : {};
		return axiosClient.get(`${STATISTICS_ENDPOINT}/dashboard`, { params });
	},
};

export default statisticsApi;
