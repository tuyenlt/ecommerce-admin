import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import OrderService from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const statusMap = {
	pending: { label: "Chờ xử lý", variant: "secondary" },
	preparing: { label: "Đang chuẩn bị", variant: "default" },
	shipped: { label: "Đang giao", variant: "outline" },
	cancelled: { label: "Đã huỷ", variant: "destructive" },
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

export default function OrderDetailPage() {
	const { id } = useParams();
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [newStatus, setNewStatus] = useState("");

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				setLoading(true);
				const response = await OrderService.getOrderById(id);
				setOrder(response.data);
				setNewStatus(response.data.status);
			} catch (error) {
				console.error("Error fetching order:", error);
				toast.error("Không thể tải thông tin đơn hàng");
			} finally {
				setLoading(false);
			}
		};
		fetchOrder();
	}, [id]);

	const handleUpdateStatus = async () => {
		if (!newStatus || newStatus === order.status) return;
		try {
			setSaving(true);
			await OrderService.updateOrderStatus(id, newStatus);
			setOrder({ ...order, status: newStatus });
			toast.success("Cập nhật trạng thái thành công");
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Cập nhật trạng thái thất bại");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="p-8 text-center text-muted-foreground">Đang tải thông tin đơn hàng...</div>;
	}

	if (!order) {
		return <div className="p-8 text-center text-red-500">Không tìm thấy đơn hàng</div>;
	}

	return (
		<div className="flex flex-col gap-6 p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/orders">
						<Button variant="outline" size="icon">
							<ChevronLeft className="w-4 h-4" />
						</Button>
					</Link>
					<h1 className="text-2xl font-bold">Chi tiết đơn hàng #{order.id.toString().padStart(6, '0')}</h1>
				</div>
				<div className="flex items-center gap-3">
					<Select 
						value={newStatus} 
						onValueChange={setNewStatus} 
						disabled={order.status === 'pending'}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Chọn trạng thái" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending" disabled={order.status !== 'pending'}>Chờ xử lý</SelectItem>
							<SelectItem value="preparing">Đang chuẩn bị</SelectItem>
							<SelectItem value="shipped">Đang giao</SelectItem>
							<SelectItem value="cancelled">Đã huỷ</SelectItem>
						</SelectContent>
					</Select>
					<Button 
						onClick={handleUpdateStatus} 
						disabled={saving || newStatus === order.status || order.status === 'pending'}
					>
						<Save className="w-4 h-4 mr-2" />
						Lưu
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Sản phẩm ({order.items?.length || 0})</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Sản phẩm</TableHead>
									<TableHead className="text-center">Đơn giá</TableHead>
									<TableHead className="text-center">Số lượng</TableHead>
									<TableHead className="text-right pr-6">Thành tiền</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{order.items?.map((item) => {
									let image = "";
									try {
										const imagesArray = JSON.parse(item.product?.images || "[]");
										if (Array.isArray(imagesArray)) {
											image = imagesArray[0] || "";
										} else {
											image = item.product?.images;
										}
									} catch (e) {
										image = item.product?.images;
									}

									return (
										<TableRow key={item.id}>
											<TableCell className="pl-6">
												<div className="flex items-center gap-3">
													{image ? (
														<img
															src={image}
															alt={item.product?.name}
															className="w-12 h-12 rounded object-cover border"
														/>
													) : (
														<div className="w-12 h-12 rounded bg-muted flex items-center justify-center border text-xs text-muted-foreground">No img</div>
													)}
													<span className="font-medium line-clamp-2 max-w-[300px]">{item.product?.name}</span>
												</div>
											</TableCell>
											<TableCell className="text-center">
												{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
											</TableCell>
											<TableCell className="text-center">{item.quantity}</TableCell>
											<TableCell className="text-right pr-6 font-medium">
												{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Thông tin khách hàng</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground mb-1">Tên khách hàng</p>
								<p className="font-medium">{order.user?.full_name || 'N/A'}</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm text-muted-foreground mb-1">Email</p>
								<p className="font-medium">{order.user?.email || 'N/A'}</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm text-muted-foreground mb-1">Số điện thoại</p>
								<p className="font-medium">{order.phone || 'N/A'}</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm text-muted-foreground mb-1">Địa chỉ giao hàng</p>
								<p className="font-medium">{order.address || 'N/A'}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Thanh toán</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<p className="text-sm text-muted-foreground">Trạng thái đơn</p>
								<Badge variant={statusMap[order.status]?.variant || "secondary"}>
									{statusMap[order.status]?.label || order.status}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<p className="text-sm text-muted-foreground">Thanh toán</p>
								<Badge variant={paymentStatusMap[order.payment_status]?.variant || "secondary"}>
									{paymentStatusMap[order.payment_status]?.label || order.payment_status}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<p className="text-sm text-muted-foreground">Phương thức</p>
								<p className="font-medium text-sm">
									{paymentMethodMap[order.payment_method] || order.payment_method}
								</p>
							</div>
							<Separator />
							<div className="flex justify-between items-center font-bold text-lg">
								<p>Tổng cộng</p>
								<p className="text-primary">
									{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0)}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
