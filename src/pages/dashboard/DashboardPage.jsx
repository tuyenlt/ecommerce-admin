import {
	ShoppingBag,
	ClipboardList,
	Users,
	TrendingUp,
	ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAuthStore from "@/store/authStore";

const stats = [
	{
		title: "Doanh thu",
		value: "$45,231",
		change: "+20.1%",
		icon: TrendingUp,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
	},
	{
		title: "Số đơn hàng",
		value: "2,350",
		change: "+15.3%",
		icon: ClipboardList,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		title: "Sản phẩm",
		value: "1,247",
		change: "+7.4%",
		icon: ShoppingBag,
		color: "text-purple-500",
		bg: "bg-purple-500/10",
	},
];

/**
 * DashboardPage
 * Trang tổng quan sau khi đăng nhập thành công.
 */
const DashboardPage = () => {
	const { user } = useAuthStore();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Xin chào, {user?.name ?? "Quản trị viên"} 👋
				</h1>
				<p className="text-muted-foreground mt-1">
					Đây là tóm tắt hoạt động cửa hàng hôm nay.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map(({ title, value, change, icon: Icon, color, bg }) => (
					<Card key={title} className="hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{title}
							</CardTitle>
							<div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
								<Icon className={`w-4 h-4 ${color}`} />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{value}</div>
							<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
								<ArrowUpRight className="w-3 h-3 text-emerald-500" />
								<span className="text-emerald-500">{change}</span>
								<span>so với tháng trước</span>
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Placeholder for charts/tables */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="lg:col-span-4">
					<CardHeader>
						<CardTitle>Tổng quan doanh thu</CardTitle>
					</CardHeader>
					<CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
						Chưa có biểu đồ — tích hợp thư viện chart tại đây
					</CardContent>
				</Card>
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Đơn hàng gần đây</CardTitle>
					</CardHeader>
					<CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
						Chưa có dữ liệu đơn hàng
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default DashboardPage;
