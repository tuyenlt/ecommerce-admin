import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function OrderList({ orders, loading, pagination, setQuery }) {

	const handlePageChange = (newPage) => {
		setQuery(prev => ({ ...prev, page: newPage }));
	};

	const statusMap = {
		pending: { label: "Chờ xử lý", variant: "secondary", className: "bg-[#ffdb8d] text-[#ff9800]" },
		preparing: { label: "Đang chuẩn bị", variant: "default", className: "bg-[#e3f2fd] text-[#1976d2]" },
		shipped: { label: "Đã giao hàng", variant: "outline", className: "bg-[#c8e6c9] text-[#388e3c]" },
		cancelled: { label: "Đã huỷ", variant: "destructive", className: "bg-[#ffebee] text-[#d32f2f]" },
	};

	const paymentStatusMap = {
		unpaid: { label: "Chưa thanh toán", variant: "secondary" },
		paid: { label: "Đã thanh toán", variant: "default" },
		failed: { label: "Thất bại", variant: "destructive" },
	};

	const paymentMethodMap = {
		cod: "Thanh toán khi nhận hàng",
		online_banking: "Chuyển khoản",
	};

	return (
		<Card>
			<CardContent className="p-0">
				<div className="rounded-md border-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Khách hàng</TableHead>
								<TableHead>Ngày tạo</TableHead>
								<TableHead className="text-center">Số lượng SP</TableHead>
								<TableHead>Tổng tiền</TableHead>
								<TableHead>Trạng thái</TableHead>
								<TableHead>Thanh toán</TableHead>
								<TableHead className="text-right pr-4">Thao tác</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={7} className="h-24 text-center">
										Đang tải dữ liệu...
									</TableCell>
								</TableRow>
							) : orders?.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="h-24 text-center">
										Không tìm thấy đơn hàng.
									</TableCell>
								</TableRow>
							) : (
								orders?.map((order) => (
									<TableRow key={order.id || order._id}>
										<TableCell className="pl-4">
											{order.user?.full_name || 'N/A'}
											<div className="text-xs text-muted-foreground">
												{order.user?.email || ''}
											</div>
										</TableCell>
										<TableCell>
											{order.created_at ? new Date(order.created_at).toLocaleDateString("vi-VN") : 'N/A'}
										</TableCell>
										<TableCell className="text-center">
											{order.total_product || 0}
										</TableCell>
										<TableCell>
											{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || order.total || 0)}
										</TableCell>
										<TableCell>
											<Badge className={statusMap[order.status]?.className}>
												{statusMap[order.status]?.label || order.status || 'N/A'}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={paymentStatusMap[order.payment_status]?.variant || "secondary"}>
												{paymentStatusMap[order.payment_status]?.label || order.payment_status || 'N/A'}
											</Badge>
											{order.payment_method && (
												<div className="text-xs text-muted-foreground mt-1">
													{paymentMethodMap[order.payment_method] || order.payment_method}
												</div>
											)}
										</TableCell>
										<TableCell className="text-right pr-4">
											<Link to={`/orders/${order.id || order._id}`}>
												<Button variant="ghost" size="icon">
													<Eye className="w-4 h-4" />
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{pagination && pagination.total_page > 1 && (
					<div className="flex items-center justify-between px-4 py-4 border-t">
						<div className="text-sm text-muted-foreground">
							Đang hiển thị trang {pagination.page} trên {pagination.total_page} (Tổng số {pagination.total} đơn hàng)
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(pagination.page - 1)}
								disabled={pagination.page <= 1}
							>
								<ChevronLeft className="w-4 h-4 mr-1" />
								Trang trước
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(pagination.page + 1)}
								disabled={pagination.page >= pagination.total_page}
							>
								Trang sau
								<ChevronRight className="w-4 h-4 ml-1" />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
