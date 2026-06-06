import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image, Search, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import bannerService from "@/services/bannerService";
import BannerFormDialog from "./BannerFormDialog";

export default function BannerListPage() {
	const [banners, setBanners] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive, running, upcoming, expired

	const [formOpen, setFormOpen] = useState(false);
	const [selectedBanner, setSelectedBanner] = useState(null);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [bannerToDelete, setBannerToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchBanners = async () => {
		try {
			setLoading(true);
			const response = await bannerService.getAllBanners();
			setBanners(response.data || []);
		} catch (error) {
			console.error("Error fetching banners:", error);
			toast.error("Không thể tải danh sách banner");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let active = true;
		bannerService.getAllBanners()
			.then((response) => {
				if (active) {
					setBanners(response.data || []);
					setLoading(false);
				}
			})
			.catch((error) => {
				console.error("Error fetching banners:", error);
				if (active) {
					toast.error("Không thể tải danh sách banner");
					setLoading(false);
				}
			});
		return () => {
			active = false;
		};
	}, []);

	const handleAdd = () => {
		setSelectedBanner(null);
		setFormOpen(true);
	};

	const handleEdit = (banner) => {
		setSelectedBanner(banner);
		setFormOpen(true);
	};

	const openDeleteDialog = (banner) => {
		setBannerToDelete(banner);
		setDeleteOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!bannerToDelete) return;
		try {
			setIsDeleting(true);
			await bannerService.deleteBanner(bannerToDelete.id);
			toast.success("Xoá banner thành công");
			fetchBanners();
		} catch (error) {
			console.error("Error deleting banner:", error);
			toast.error("Không thể xoá banner này");
		} finally {
			setIsDeleting(false);
			setDeleteOpen(false);
			setBannerToDelete(null);
		}
	};

	const handleToggleStatus = async (banner) => {
		try {
			const formData = new FormData();
			formData.append("is_active", !banner.is_active);

			await bannerService.updateBanner(banner.id, formData);
			toast.success(`Đã ${!banner.is_active ? "kích hoạt" : "vô hiệu hóa"} banner thành công`);
			fetchBanners();
		} catch (error) {
			console.error("Error toggling banner status:", error);
			toast.error("Không thể cập nhật trạng thái banner");
		}
	};

	// Determine temporal status of banner
	const getBannerTemporalStatus = (banner) => {
		if (!banner.is_active) return { label: "Vô hiệu hóa", variant: "secondary" };

		const now = new Date();
		const start = banner.start_date ? new Date(banner.start_date) : null;
		const end = banner.end_date ? new Date(banner.end_date) : null;

		if (start && now < start) {
			return { label: "Chưa diễn ra", variant: "outline" };
		}
		if (end && now > end) {
			return { label: "Hết hạn", variant: "destructive" };
		}
		return { label: "Đang chạy", variant: "default" };
	};

	// Format datetime
	const formatDateTime = (dateStr) => {
		if (!dateStr) return "Không giới hạn";
		return new Date(dateStr).toLocaleString("vi-VN", {
			hour: "2-digit",
			minute: "2-digit",
			day: "numeric",
			month: "numeric",
			year: "numeric",
		});
	};

	// Filter banners
	const filteredBanners = banners.filter((banner) => {
		const matchQuery =
			banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			banner.description.toLowerCase().includes(searchQuery.toLowerCase());

		const now = new Date();
		const start = banner.start_date ? new Date(banner.start_date) : null;
		const end = banner.end_date ? new Date(banner.end_date) : null;

		let matchStatus = true;
		if (statusFilter === "active") {
			matchStatus = banner.is_active;
		} else if (statusFilter === "inactive") {
			matchStatus = !banner.is_active;
		} else if (statusFilter === "running") {
			matchStatus = banner.is_active && (!start || now >= start) && (!end || now <= end);
		} else if (statusFilter === "upcoming") {
			matchStatus = banner.is_active && start && now < start;
		} else if (statusFilter === "expired") {
			matchStatus = banner.is_active && end && now > end;
		}

		return matchQuery && matchStatus;
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Quản lý Banner</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Cấu hình hình ảnh, đường dẫn và thời gian hiển thị banner khuyến mãi ở trang chủ.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={fetchBanners} disabled={loading}>
						<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
					</Button>
					<Button onClick={handleAdd}>
						<Plus className="w-4 h-4 mr-2" />
						Thêm Banner
					</Button>
				</div>
			</div>

			<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
				{/* Search input */}
				<div className="relative w-full md:max-w-sm">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Tìm kiếm banner..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{/* Filters tabs */}
				<div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
					{[
						{ value: "all", label: "Tất cả" },
						{ value: "running", label: "Đang chạy" },
						{ value: "upcoming", label: "Chưa diễn ra" },
						{ value: "expired", label: "Hết hạn" },
						{ value: "inactive", label: "Vô hiệu hóa" },
					].map((tab) => (
						<Button
							key={tab.value}
							variant={statusFilter === tab.value ? "default" : "outline"}
							size="sm"
							onClick={() => setStatusFilter(tab.value)}
							className="rounded-full text-xs"
						>
							{tab.label}
						</Button>
					))}
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg flex items-center gap-2">
						<Image className="w-5 h-5 text-primary" />
						Danh sách banner khuyến mãi
					</CardTitle>
					<CardDescription>
						Banners được sắp xếp theo thứ tự hiển thị ưu tiên tăng dần.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[120px]">Hình ảnh</TableHead>
									<TableHead>Thông tin Banner</TableHead>
									<TableHead className="w-[100px] text-center">Thứ tự</TableHead>
									<TableHead className="w-[280px]">Thời gian hoạt động</TableHead>
									<TableHead className="w-[130px] text-center">Trạng thái</TableHead>
									<TableHead className="w-[100px] text-right">Thao tác</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
											Đang tải dữ liệu banner...
										</TableCell>
									</TableRow>
								) : filteredBanners.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
											Không tìm thấy banner nào phù hợp bộ lọc.
										</TableCell>
									</TableRow>
								) : (
									filteredBanners.map((banner) => {
										const tempStatus = getBannerTemporalStatus(banner);
										return (
											<TableRow key={banner.id} className="hover:bg-muted/10">
												<TableCell>
													<div className="w-24 h-14 rounded-md overflow-hidden bg-muted border flex items-center justify-center">
														{banner.image_url ? (
															<img
																src={banner.image_url}
																alt={banner.title}
																className="w-full h-full object-cover"
															/>
														) : (
															<Image className="w-5 h-5 text-muted-foreground" />
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														<h4 className="font-semibold text-foreground leading-none">
															{banner.title}
														</h4>
														<p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
															{banner.description}
														</p>
														{banner.redirect_url && (
															<a
																href={banner.redirect_url}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-block text-[10px] text-primary underline truncate max-w-xs"
															>
																{banner.redirect_url}
															</a>
														)}
													</div>
												</TableCell>
												<TableCell className="text-center font-medium">
													{banner.sort_order}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													<div className="flex flex-col gap-0.5">
														<span className="flex items-center gap-1">
															<Calendar className="w-3 h-3 text-muted-foreground" />
															Bắt đầu: {formatDateTime(banner.start_date)}
														</span>
														<span className="flex items-center gap-1">
															<Calendar className="w-3 h-3 text-muted-foreground" />
															Kết thúc: {formatDateTime(banner.end_date)}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<div className="flex flex-col items-center gap-1.5">
														<Badge variant={tempStatus.variant} className="text-[10px]">
															{tempStatus.label}
														</Badge>
														<Button
															variant="ghost"
															size="xs"
															className="text-[10px] text-muted-foreground underline cursor-pointer hover:text-foreground h-auto p-0"
															onClick={() => handleToggleStatus(banner)}
														>
															{banner.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
														</Button>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleEdit(banner)}
														>
															<Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
															onClick={() => openDeleteDialog(banner)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{formOpen && (
				<BannerFormDialog
					key={selectedBanner ? `edit-${selectedBanner.id}` : "new"}
					open={formOpen}
					onOpenChange={setFormOpen}
					banner={selectedBanner}
					onSuccess={fetchBanners}
				/>
			)}

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bạn có chắc chắn muốn xoá banner này?</DialogTitle>
						<div className="text-sm text-muted-foreground mt-2">
							Hành động này không thể hoàn tác. Banner "{bannerToDelete?.title}" sẽ bị xoá khỏi hệ thống.
						</div>
					</DialogHeader>
					<DialogFooter>
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
							{isDeleting ? "Đang xoá..." : "Xoá Banner"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
