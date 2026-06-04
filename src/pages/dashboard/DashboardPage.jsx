import { useEffect, useState } from "react";
import {
	ShoppingBag,
	ClipboardList,
	TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import statisticsService from "@/services/statisticsService";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

// Utility for formatting currency
const formatCurrency = (amount) => {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
	}).format(amount);
};

/**
 * DashboardPage
 * Trang tổng quan sau khi đăng nhập thành công.
 */
const DashboardPage = () => {
	const [loading, setLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState(null);

	useEffect(() => {
		const fetchDashboard = async () => {
			try {
				const data = await statisticsService.getDashboard();
				console.log("🚀 ~ fetchDashboard ~ data:", data)
				setDashboardData(data);
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchDashboard();
	}, []);

	if (loading) {
		return <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-64">Đang tải dữ liệu dashboard...</div>;
	}

	const { summary, revenue_by_month, top_selling_products } = dashboardData || {};

	const stats = [
		{
			title: "Doanh thu tháng này",
			value: summary ? formatCurrency(summary.current_month_revenue) : formatCurrency(0),
			icon: TrendingUp,
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
		},
		{
			title: "Đơn hàng tháng này",
			value: summary?.current_month_orders || 0,
			icon: ClipboardList,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			title: "Tổng sản phẩm",
			value: summary?.total_products || 0,
			icon: ShoppingBag,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
		},
	];

	// Prepare chart data for Chart.js
	const chartData = {
		labels: revenue_by_month?.map((item) => `Tháng ${item.month}`) || [],
		datasets: [
			{
				label: 'Doanh thu',
				data: revenue_by_month?.map((item) => item.revenue) || [],
				backgroundColor: '#3b82f6',
				borderRadius: 4,
				maxBarThickness: 50,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: function (context) {
						let label = context.dataset.label || '';
						if (label) {
							label += ': ';
						}
						if (context.parsed.y !== null) {
							label += formatCurrency(context.parsed.y);
						}
						return label;
					}
				}
			}
		},
		scales: {
			x: {
				grid: {
					display: false,
				},
				border: {
					display: false
				}
			},
			y: {
				grid: {
					borderDash: [3, 3],
					color: '#e5e7eb', // tailwind gray-200
				},
				border: {
					display: false
				},
				ticks: {
					callback: function (value) {
						if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
						if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
						return value;
					}
				}
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{stats.map(({ title, value, icon: Icon, color, bg }) => (
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
						</CardContent>
					</Card>
				))}
			</div>

			{/* Charts and Tables */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="lg:col-span-4 hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle>Tổng quan doanh thu năm nay</CardTitle>
					</CardHeader>
					<CardContent className="h-80">
						{chartData.labels.length > 0 ? (
							<div className="h-full min-h-[300px] w-full">
								<Bar data={chartData} options={chartOptions} />
							</div>
						) : (
							<div className="h-full flex items-center justify-center text-muted-foreground text-sm">
								Chưa có dữ liệu doanh thu
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-3 hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle>Sản phẩm bán chạy nhất</CardTitle>
					</CardHeader>
					<CardContent>
						{top_selling_products && top_selling_products.length > 0 ? (
							<div className="space-y-6">
								{top_selling_products.slice(0, 5).map((product) => (
									<div key={product.product_id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{product.product_images && product.product_images.length > 0 ? (
												<img
													src={product.product_images[0]}
													alt={product.product_name}
													className="w-15 h-15 rounded-md object-cover border"
												/>
											) : (
												<div className="w-15 h-15 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border">
													Img
												</div>
											)}
											<div>
												<p className="text-sm font-medium leading-none mb-1 max-w-[400px]" title={product.product_name}>
													{product.product_name}
												</p>
												<p className="text-xs text-muted-foreground">
													Đã bán: {product.total_quantity}
												</p>
											</div>
										</div>
										<div className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
											{formatCurrency(product.total_revenue)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
								Chưa có dữ liệu sản phẩm
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default DashboardPage;
