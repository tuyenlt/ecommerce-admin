import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderFilter({ query, setQuery }) {
	const [filter, setFilter] = useState(() => {
		try {
			return query?.filter ? JSON.parse(query.filter) : {
				status: null,
				payment_method: null,
				payment_status: null,
				user: {
					full_name: null
				}
			};
		} catch {
			return {
				status: null,
				payment_method: null,
				payment_status: null,
				user: {
					full_name: null
				}
			};
		}
	});

	const [created_at_from, setCreatedAtFrom] = useState(query?.created_at_from || null);
	const [created_at_to, setCreatedAtTo] = useState(query?.created_at_to || null);

	const [amount_from, setAmountFrom] = useState(query?.amount_from || null);
	const [amount_to, setAmountTo] = useState(query?.amount_to || null);

	const handleApplyFilter = () => {
		const appliedFilter = {};
		if (filter.status && filter.status !== "all") appliedFilter.status = filter.status;
		if (filter.payment_method && filter.payment_method !== "all") appliedFilter.payment_method = filter.payment_method;
		if (filter.payment_status && filter.payment_status !== "all") appliedFilter.payment_status = filter.payment_status;
		if (filter.user?.full_name && filter.user?.full_name !== "") appliedFilter.user = { full_name: filter.user.full_name };

		setQuery({
			...query,
			filter: Object.keys(appliedFilter).length > 0 ? JSON.stringify(appliedFilter) : null,
			created_at_from: created_at_from || null,
			created_at_to: created_at_to || null,
			amount_from: amount_from || null,
			amount_to: amount_to || null,
			page: 1
		});
	};

	const handleResetFilter = () => {
		setFilter({
			status: null,
			payment_method: null,
			payment_status: null,
			full_name: null,
		});
		setCreatedAtFrom(null);
		setCreatedAtTo(null);
		setAmountFrom(null);
		setAmountTo(null);

		setQuery({
			page: 1,
			limit: query?.limit || 10,
			filter: null,
			created_at_from: null,
			created_at_to: null,
			amount_from: null,
			amount_to: null,
		});
	};

	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Tìm kiếm</label>
						<Input
							placeholder="Tên khách hàng..."
							value={filter.user?.full_name || ""}
							onChange={(e) => setFilter({ ...filter, user: { full_name: e.target.value } })}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Trạng thái đơn hàng</label>
						<Select
							value={filter.status || "all"}
							onValueChange={(value) => setFilter({ ...filter, status: value })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tất cả trạng thái" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả trạng thái</SelectItem>
								<SelectItem value="pending">Chờ xử lý</SelectItem>
								<SelectItem value="preparing">Đang chuẩn bị</SelectItem>
								<SelectItem value="shipped">Đang giao</SelectItem>
								<SelectItem value="cancelled">Đã huỷ</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Trạng thái thanh toán</label>
						<Select
							value={filter.payment_status || "all"}
							onValueChange={(value) => setFilter({ ...filter, payment_status: value })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tất cả trạng thái" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả trạng thái</SelectItem>
								<SelectItem value="unpaid">Chưa thanh toán</SelectItem>
								<SelectItem value="paid">Đã thanh toán</SelectItem>
								<SelectItem value="failed">Thất bại</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Phương thức thanh toán</label>
						<Select
							value={filter.payment_method || "all"}
							onValueChange={(value) => setFilter({ ...filter, payment_method: value })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tất cả phương thức" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả phương thức</SelectItem>
								<SelectItem value="cod">Thanh toán khi nhận hàng (COD)</SelectItem>
								<SelectItem value="online_banking">Chuyển khoản</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Từ ngày</label>
						<Input
							type="date"
							value={created_at_from || ""}
							onChange={(e) => setCreatedAtFrom(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Đến ngày</label>
						<Input
							type="date"
							value={created_at_to || ""}
							onChange={(e) => setCreatedAtTo(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Số tiền tối thiểu</label>
						<Input
							type="number"
							placeholder="0"
							value={amount_from || ""}
							onChange={(e) => setAmountFrom(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Số tiền tối đa</label>
						<Input
							type="number"
							placeholder="1000000"
							value={amount_to || ""}
							onChange={(e) => setAmountTo(e.target.value)}
						/>
					</div>
				</div>
				<div className="flex justify-end gap-2 mt-4">
					<Button variant="outline" onClick={handleResetFilter}>
						<RotateCcw className="w-4 h-4 mr-2" />
						Đặt lại
					</Button>
					<Button onClick={handleApplyFilter}>
						<Search className="w-4 h-4 mr-2" />
						Tìm kiếm
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}