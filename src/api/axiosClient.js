import axios from "axios";
import useAuthStore from "@/store/authStore";

/**
 * Axios instance với cấu hình chuẩn.
 *
 * - withCredentials: true → tự động gửi httpOnly cookie (refreshToken)
 * - baseURL từ biến môi trường VITE_API_BASE_URL
 */
const axiosClient = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // Gửi httpOnly cookie (refreshToken) theo mọi request
});

// ─── Flag & Queue để tránh nhiều lần refresh cùng lúc ─────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

// ─── Request Interceptor ───────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
	(config) => {
		const { accessToken } = useAuthStore.getState();
		if (accessToken) {
			config.headers["Authorization"] = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
	(response) => {
		// console.log("🚀 ~ axiosClient.interceptors.response.use ~ response:", response.data)
		response.data = response.data.data;
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// Chỉ xử lý lỗi 401 và chưa retry, không xử lý cho api refresh
		if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh-token") {
			if (isRefreshing) {
				// Nếu đang refresh, đưa request vào hàng chờ
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers["Authorization"] = `Bearer ${token}`;
						return axiosClient(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}
			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Gọi endpoint refresh token
				// refreshToken được gửi tự động qua httpOnly cookie
				const response = await axiosClient.post("/auth/refresh-token");
				const { accessToken: newToken } = response.data;

				// Cập nhật accessToken mới vào store
				useAuthStore.getState().setAccessToken(newToken);

				// Xử lý hàng chờ với token mới
				processQueue(null, newToken);

				// Retry request gốc với token mới
				originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
				return axiosClient(originalRequest);
			} catch (refreshError) {
				// Refresh thất bại → logout và redirect về login
				processQueue(refreshError, null);
				useAuthStore.getState().clearAuth();
				window.location.href = "/login";
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export default axiosClient;
