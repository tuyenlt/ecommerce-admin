import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
	LayoutDashboard,
	ShoppingBag,
	ClipboardList,
	Users,
	Settings,
	LogOut,
	Menu,
	X,
	ChevronDown,
	Bell,
	Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from "@/store/authStore";
import authApi from "@/api/authApi";

const navItems = [
	{ path: "/", label: "Tổng quan", icon: LayoutDashboard, exact: true },
	{ path: "/products", label: "Sản phẩm", icon: ShoppingBag },
	{ path: "/categories", label: "Danh mục", icon: Layers },
	{ path: "/orders", label: "Đơn hàng", icon: ClipboardList },
	// { path: "/settings", label: "Cài đặt", icon: Settings },
];

/**
 * DashboardLayout
 * Layout chính cho các trang protected.
 * Bao gồm: Sidebar (desktop) + Header + main content area.
 */
const DashboardLayout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { user, clearAuth } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			await authApi.logout();
		} catch {
			// Vẫn clear state dù API có lỗi
		} finally {
			clearAuth();
			navigate("/login", { replace: true });
		}
	};

	const userInitials = user?.name
		? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
		: "AD";

	return (
		<div className="flex h-screen bg-background overflow-hidden">
			{/* ── Sidebar Overlay (mobile) ── */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* ── Sidebar ── */}
			<aside
				className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
			>
				{/* Logo */}
				<div className="flex items-center gap-3 px-6 h-16 border-b border-border">
					<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
						<ShoppingBag className="w-4 h-4 text-primary-foreground" />
					</div>
					<span className="font-bold text-lg tracking-tight">Admin Shop</span>
					{/* Close button mobile */}
					<button
						className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
						onClick={() => setSidebarOpen(false)}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Nav Items */}
				<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
					{navItems.map(({ path, label, icon: Icon, exact }) => (
						<NavLink
							key={path}
							to={path}
							end={exact}
							onClick={() => setSidebarOpen(false)}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								}`
							}
						>
							<Icon className="w-4 h-4 shrink-0" />
							{label}
						</NavLink>
					))}
				</nav>

				{/* User section bottom */}
				<div className="px-3 pb-4">
					<Separator className="mb-4" />
					<div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
						<Avatar className="w-8 h-8">
							<AvatarImage src={user?.avatar} alt={user?.name} />
							<AvatarFallback className="text-xs bg-primary text-primary-foreground">
								{userInitials}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{user?.name ?? "Quản trị viên"}</p>
							<p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
						</div>
					</div>
				</div>
			</aside>

			{/* ── Main Area ── */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Header */}
				<header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
					{/* Mobile menu toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="lg:hidden"
						onClick={() => setSidebarOpen(true)}
					>
						<Menu className="w-5 h-5" />
					</Button>

					{/* Spacer */}
					<div className="flex-1" />

					{/* Notifications */}
					<Button variant="ghost" size="icon" className="relative">
						<Bell className="w-5 h-5" />
						<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
					</Button>

					{/* User dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
								<Avatar className="w-7 h-7">
									<AvatarImage src={user?.avatar} alt={user?.name} />
									<AvatarFallback className="text-xs bg-primary text-primary-foreground">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<span className="hidden sm:block text-sm font-medium">
									{user?.name ?? "Quản trị viên"}
								</span>
								<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => navigate("/settings")}>
								<Settings className="w-4 h-4 mr-2" />
								Cài đặt
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={handleLogout}
							>
								<LogOut className="w-4 h-4 mr-2" />
								Đăng xuất
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
