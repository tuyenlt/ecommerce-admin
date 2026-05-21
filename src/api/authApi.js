import axiosClient from "./axiosClient";

/**
 * Auth API
 *
 * Tất cả request đều dùng axiosClient (withCredentials: true)
 * để httpOnly cookie được gửi/nhận tự động.
 */
const authApi = {
	/**
	 * Đăng nhập
	 * @param {{ email: string, password: string }} credentials
	 * @returns {Promise<{ user: object, accessToken: string }>}
	 */
	login: (credentials) => axiosClient.post("/auth/login", credentials),

	/**
	 * Đăng xuất — backend sẽ clear httpOnly cookie refreshToken
	 * @returns {Promise<void>}
	 */
	logout: () => axiosClient.post("/auth/logout"),

	/**
	 * Lấy accessToken mới từ refreshToken (httpOnly cookie)
	 * @returns {Promise<{ accessToken: string }>}
	 */
	refreshToken: () => axiosClient.post("/auth/refresh-token"),

	/**
	 * Lấy thông tin user hiện tại (dùng khi khởi động app để restore session)
	 * @returns {Promise<{ user: object }>}
	 */
	getMe: () => axiosClient.get("/auth/is-authenticated"),
};

export default authApi;
