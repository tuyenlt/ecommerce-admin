import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProductListPage from "@/pages/dashboard/products/ProductListPage";
import ProductFormPage from "@/pages/dashboard/products/ProductFormPage";
import OrderPage from "@/pages/dashboard/orders/OrderPage";
import OrderDetailPage from "@/pages/dashboard/orders/OrderDetailPage";
import CategoryPage from "@/pages/dashboard/categories/CategoryPage";
/**
 * AppRouter
 *
 * Cấu trúc routing:
 *   /login          → Public (AuthLayout)
 *   /               → Protected (DashboardLayout)
 *     index         → DashboardPage
 *     /products     → (thêm sau)
 *     /orders       → (thêm sau)
 */
const AppRouter = () => {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public Routes */}
				<Route element={<AuthLayout />}>
					<Route path="/login" element={<LoginPage />} />
				</Route>

				{/* Protected Routes */}
				<Route element={<ProtectedRoute />}>
					<Route element={<DashboardLayout />}>
						<Route path="/" element={<DashboardPage />} />
						{/* Thêm các route khác tại đây */}
						<Route path="/products" element={<ProductListPage />} />
						<Route path="/products/new" element={<ProductFormPage />} />
						<Route path="/products/:id/edit" element={<ProductFormPage />} />
						<Route path="/orders" element={<OrderPage />} />
						<Route path="/orders/:id" element={<OrderDetailPage />} />
						<Route path="/categories" element={<CategoryPage />} />
					</Route>
				</Route>

				{/* Fallback */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
};

export default AppRouter;
