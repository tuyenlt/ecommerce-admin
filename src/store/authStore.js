import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Auth Store (Zustand)
 *
 * - accessToken: lưu in-memory (không lưu localStorage để tránh XSS)
 * - user: thông tin user hiện tại (được persist)
 * - isAuthenticated: trạng thái đăng nhập (được persist)
 *
 * refreshToken được xử lý qua httpOnly cookie (backend set/clear)
 * nên không cần lưu ở client-side.
 */
const useAuthStore = create(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			isAuthenticated: false,

			/**
			 * Lưu thông tin sau khi login thành công
			 * @param {{ user: object, accessToken: string }} payload
			 */
			setAuth: ({ user, accessToken }) =>
				set({
					user,
					accessToken,
					isAuthenticated: true,
				}),

			/**
			 * Cập nhật accessToken mới (sau khi refresh)
			 * @param {string} accessToken
			 */
			setAccessToken: (accessToken) => set({ accessToken }),

			/**
			 * Xóa toàn bộ auth state (logout)
			 */
			clearAuth: () =>
				set({
					user: null,
					accessToken: null,
					isAuthenticated: false,
				}),
		}),
		{
			name: "auth-storage",
			partialize: (state) => ({ 
				user: state.user, 
				isAuthenticated: state.isAuthenticated 
			}),
		}
	)
);

export default useAuthStore;
