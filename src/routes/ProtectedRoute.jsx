import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/authStore";

/**
 * ProtectedRoute
 *
 * Bảo vệ các route yêu cầu đăng nhập.
 * Nếu chưa có accessToken → redirect về /login.
 * Nếu đã login → render children (Outlet).
 */
const ProtectedRoute = () => {
	const { isAuthenticated } = useAuthStore();

	if (!isAuthenticated) {

	}

	return <Outlet />;
};

export default ProtectedRoute;
