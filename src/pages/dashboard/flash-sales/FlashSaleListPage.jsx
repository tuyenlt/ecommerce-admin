import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Calendar, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import flashSaleService from "@/services/flashSaleService";
import FlashSaleFormDialog from "./FlashSaleFormDialog";

export default function FlashSaleListPage() {
	const [flashSales, setFlashSales] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all"); // all, running, upcoming, expired, disabled

	// Dialog & Form states
	const [formOpen, setFormOpen] = useState(false);
	const [selectedFlashSale, setSelectedFlashSale] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [flashSaleToDelete, setFlashSaleToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchFlashSales = async () => {
		setLoading(true);
		try {
			const res = await flashSaleService.getAllFlashSales();
			setFlashSales(res.data || []);
		} catch (error) {
			console.error("Lỗi khi tải danh sách Flash Sale:", error);
			toast.error("Không thể tải danh sách Flash Sale");
		} finally {
			setLoading(false);
		}
	};

	// Use useEffect with mount-only check (avoiding cascading setState issues)
	useEffect(() => {
		let active = true;
		flashSaleService.getAllFlashSales()
			.then((res) => {
				if (active) {
					setFlashSales(res.data || []);
					setLoading(false);
				}
			})
			.catch((error) => {
				if (active) {
					console.error("Lỗi khi tải danh sách Flash Sale:", error);
					toast.error("Không thể tải danh sách Flash Sale");
					setLoading(false);
				}
			});
		return () => {
			active = false;
		};
	}, []);

	// Handle toggle active status
	const handleToggleStatus = async (fs) => {
		try {
			const updatedStatus = !fs.is_active;
			await flashSaleService.updateFlashSale(fs.id, {
				name: fs.name,
				is_active: updatedStatus
			});
			toast.success(`Đã ${updatedStatus ? "kích hoạt" : "vô hiệu hóa"} chiến dịch thành công`);
			fetchFlashSales();
		} catch (error) {
			console.error("Error toggling flash sale status:", error);
			toast.error("Không thể cập nhật trạng thái hoạt động");
		}
	};

	// Confirm delete campaign
	const handleDeleteConfirm = async () => {
		if (!flashSaleToDelete) return;
		setIsDeleting(true);
		try {
			await flashSaleService.deleteFlashSale(flashSaleToDelete.id);
			toast.success("Xóa chiến dịch Flash Sale thành công");
			setDeleteOpen(false);
			setFlashSaleToDelete(null);
			fetchFlashSales();
		} catch (error) {
			console.error("Error deleting flash sale:", error);
			toast.error("Không thể xóa chiến dịch Flash Sale");
		} finally {
			setIsDeleting(false);
		}
	};

	// Get campaign state badge
	const getTemporalStatus = (fs) => {
		if (!fs.is_active) return { label: "Vô hiệu hóa", variant: "secondary" };

		const now = new Date();
		const start = fs.start_time ? new Date(fs.start_time) : null;
		const end = fs.end_time ? new Date(fs.end_time) : null;

		if (start && now < start) {
			return { label: "Chưa bắt đầu", variant: "outline" };
		}
		if (end && now > end) {
			return { label: "Đã kết thúc", variant: "destructive" };
		}
		return { label: "Đang diễn ra", variant: "default" }; // Default maps to green/blue
	};

	// Format date time for display
	const formatDateTime = (dateStr) => {
		if (!dateStr) return "N/A";
		return new Date(dateStr).toLocaleString("vi-VN", {
			hour: "2-digit",
			minute: "2-digit",
			day: "numeric",
			month: "numeric",
			year: "numeric",
		});
	};

	// Filter logic
	const filteredSales = flashSales.filter((fs) => {
		const matchQuery =
			fs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(fs.description && fs.description.toLowerCase().includes(searchQuery.toLowerCase()));

		if (!matchQuery) return false;

		if (statusFilter === "all") return true;

		const status = getTemporalStatus(fs);
		if (statusFilter === "running" && status.label === "Đang diễn ra") return true;
		if (statusFilter === "upcoming" && status.label === "Chưa bắt đầu") return true;
		if (statusFilter === "expired" && status.label === "Đã kết thúc") return true;
		if (statusFilter === "disabled" && status.label === "Vô hiệu hóa") return true;

		return false;
	});

	// Find the currently selected flash sale in the fetched list to ensure it has updated items
	const activeSelectedFlashSale = selectedFlashSale
		? flashSales.find(fs => fs.id === selectedFlashSale.id) || selectedFlashSale
		: null;

	return (
		<div className="space-y-6">
			{/* Top Bar Header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
						<Zap className="w-8 h-8 fill-amber-500 text-amber-500 animate-pulse" />
						Quản lý Flash Sale
					</h1>
					<p className="text-muted-foreground">
						Tạo và quản lý các chiến dịch giảm giá chớp nhoáng theo khung giờ.
					</p>
				</div>
				<Button
					onClick={() => {
						setSelectedFlashSale(null);
						setFormOpen(true);
					}}
					className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
				>
					<Plus className="w-4 h-4 mr-2" />
					Thêm chiến dịch
				</Button>
			</div>

			{/* Search and Filter Cards */}
			<Card className="shadow-sm border-muted">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg font-semibold">Bộ lọc tìm kiếm</CardTitle>
					<CardDescription>Tìm kiếm và lọc chiến dịch theo trạng thái hoặc thời gian.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search Input */}
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Tìm theo tên hoặc mô tả chiến dịch..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Refresh Button */}
						<Button variant="outline" size="icon" onClick={fetchFlashSales} title="Tải lại dữ liệu">
							<RefreshCw className="w-4 h-4" />
						</Button>
					</div>

					{/* Status Filters */}
					<div className="flex flex-wrap gap-2 pt-2">
						{[
							{ id: "all", label: "Tất cả" },
							{ id: "running", label: "Đang diễn ra" },
							{ id: "upcoming", label: "Chưa bắt đầu" },
							{ id: "expired", label: "Đã kết thúc" },
							{ id: "disabled", label: "Vô hiệu hóa" },
						].map((tab) => (
							<Button
								key={tab.id}
								variant={statusFilter === tab.id ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter(tab.id)}
								className="rounded-full"
							>
								{tab.label}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Main list Table */}
			<Card className="shadow-sm border-muted overflow-hidden">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-muted/40">
								<TableRow>
									<TableHead className="font-semibold p-4">Tên chiến dịch</TableHead>
									<TableHead className="font-semibold">Thời gian diễn ra</TableHead>
									<TableHead className="font-semibold text-center">Số sản phẩm</TableHead>
									<TableHead className="font-semibold">Trạng thái</TableHead>
									<TableHead className="font-semibold text-center">Hoạt động</TableHead>
									<TableHead className="font-semibold text-right p-4">Hành động</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
											<RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
											Đang tải danh sách chiến dịch...
										</TableCell>
									</TableRow>
								) : filteredSales.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
											Không tìm thấy chiến dịch Flash Sale nào phù hợp.
										</TableCell>
									</TableRow>
								) : (
									filteredSales.map((fs) => {
										const status = getTemporalStatus(fs);
										return (
											<TableRow key={fs.id} className="hover:bg-muted/5">
												{/* Name & Description */}
												<td className="p-4">
													<div className="font-semibold text-base line-clamp-1">{fs.name}</div>
													<div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
														{fs.description || "Không có mô tả"}
													</div>
												</td>

												{/* Time frame */}
												<td>
													<div className="flex flex-col gap-0.5 text-sm">
														<span className="flex items-center gap-1.5 text-muted-foreground">
															<Calendar className="w-3.5 h-3.5" />
															Bắt đầu: {formatDateTime(fs.start_time)}
														</span>
														<span className="flex items-center gap-1.5 text-muted-foreground">
															<Calendar className="w-3.5 h-3.5" />
															Kết thúc: {formatDateTime(fs.end_time)}
														</span>
													</div>
												</td>

												{/* Products count */}
												<td className="text-center font-semibold text-sm">
													<Badge variant="secondary" className="px-2.5 py-0.5 rounded-md">
														{fs.items?.length || 0} SP
													</Badge>
												</td>

												{/* Status badge */}
												<td>
													{status.label === "Đang diễn ra" ? (
														<Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
															{status.label}
														</Badge>
													) : status.label === "Chưa bắt đầu" ? (
														<Badge variant="outline" className="border-amber-500 text-amber-600 font-medium bg-amber-500/5">
															{status.label}
														</Badge>
													) : status.label === "Đã kết thúc" ? (
														<Badge variant="destructive" className="font-medium">
															{status.label}
														</Badge>
													) : (
														<Badge variant="secondary" className="font-medium">
															{status.label}
														</Badge>
													)}
												</td>

												{/* Active toggle */}
												<td className="text-center">
													<Switch
														checked={fs.is_active}
														onCheckedChange={() => handleToggleStatus(fs)}
													/>
												</td>

												{/* Actions */}
												<td className="text-right p-4">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																setSelectedFlashSale(fs);
																setFormOpen(true);
															}}
															title="Sửa chiến dịch"
														>
															<Edit2 className="w-4 h-4 text-blue-500" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={() => {
																setFlashSaleToDelete(fs);
																setDeleteOpen(true);
															}}
															title="Xóa chiến dịch"
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</td>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Form dialog modal */}
			{formOpen && (
				<FlashSaleFormDialog
					key={activeSelectedFlashSale ? `edit-${activeSelectedFlashSale.id}` : "new"}
					open={formOpen}
					onOpenChange={setFormOpen}
					flashSale={activeSelectedFlashSale}
					onSuccess={fetchFlashSales}
				/>
			)}

			{/* Confirm delete dialog */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bạn có chắc chắn muốn xoá chiến dịch này?</DialogTitle>
						<div className="text-sm text-muted-foreground mt-2">
							Hành động này không thể hoàn tác. Chiến dịch Flash Sale "{flashSaleToDelete?.name}" sẽ bị xoá vĩnh viễn khỏi hệ thống.
						</div>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button variant="outline" disabled={isDeleting} onClick={() => setDeleteOpen(false)}>
							Hủy
						</Button>
						<Button
							variant="destructive"
							disabled={isDeleting}
							onClick={(e) => {
								e.preventDefault();
								handleDeleteConfirm();
							}}
						>
							{isDeleting ? "Đang xoá..." : "Xoá Flash Sale"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
