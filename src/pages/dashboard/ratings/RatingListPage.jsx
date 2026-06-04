import { useState, useEffect, useCallback } from "react";
import {
	Star,
	Sparkles,
	Trash2,
	Eye,
	Search,
	RotateCcw,
	MessageSquare,
	AlertTriangle,
	Calendar,
	User,
	ShoppingBag,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ratingService from "@/services/ratingService";

const RatingListPage = () => {
	const [ratings, setRatings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 1,
	});

	// Filter & Search states
	const [search, setSearch] = useState("");
	const [starFilter, setStarFilter] = useState("all");
	const [sentimentFilter, setSentimentFilter] = useState("all");

	// Modals states
	const [selectedRating, setSelectedRating] = useState(null);
	const [deleteId, setDeleteId] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Statistics
	const [stats, setStats] = useState({
		total: 0,
		avgRating: 0,
		avgAIScore: 0,
		positiveRate: 0,
	});

	// Fetch ratings from backend
	const fetchRatings = useCallback(async (page = 1) => {
		setLoading(true);
		try {
			// Get all ratings (with limit 100 to calculate statistics locally if pagination is small,
			// but since backend only supports pagination, we will fetch standard page/limit)
			const res = await ratingService.getRatings({
				page,
				limit: pagination.limit,
			});

			let list = [];
			let pag = { page: 1, limit: 10, totalPages: 1, total: 0 };

			// Handle potential response structure differences robustly
			if (res && Array.isArray(res)) {
				list = res;
				pag = {
					page: page,
					limit: pagination.limit,
					totalPages: Math.ceil(res.length / pagination.limit) || 1,
					total: res.length,
				};
			} else if (res && res.data && Array.isArray(res.data)) {
				list = res.data;
				pag = res.pagination || {
					page: page,
					limit: pagination.limit,
					totalPages: Math.ceil(res.data.length / pagination.limit) || 1,
					total: res.data.length,
				};
			}

			setRatings(list);
			setPagination(pag);

			// Calculate statistics based on available data
			if (list.length > 0) {
				const totalRatings = list.length;
				const sumStars = list.reduce((acc, item) => acc + item.rating, 0);
				const sumAIScore = list.reduce((acc, item) => acc + (Number(item.model_rating) || 0), 0);
				const positiveCount = list.filter(
					(item) => item.rating >= 4 || (item.model_rating && item.model_rating >= 4)
				).length;

				setStats({
					total: pag.total || totalRatings,
					avgRating: (sumStars / totalRatings).toFixed(1),
					avgAIScore: (sumAIScore / totalRatings).toFixed(1),
					positiveRate: Math.round((positiveCount / totalRatings) * 100),
				});
			} else {
				setStats({ total: 0, avgRating: 0, avgAIScore: 0, positiveRate: 0 });
			}
		} catch (error) {
			console.error("Fetch ratings error:", error);
			toast.error("Không thể tải danh sách đánh giá từ hệ thống");
		} finally {
			setLoading(false);
		}
	}, [pagination.limit]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchRatings(1);
		}, 0);
		return () => clearTimeout(timer);
	}, [fetchRatings]);

	const handlePageChange = (newPage) => {
		if (newPage > 0 && newPage <= pagination.totalPages) {
			fetchRatings(newPage);
		}
	};

	const handleDeleteClick = (id) => {
		setDeleteId(id);
	};

	const confirmDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		try {
			await ratingService.deleteRating(deleteId);
			toast.success("Xóa đánh giá thành công");
			fetchRatings(pagination.page);
		} catch (error) {
			console.error("Delete rating error:", error);
			toast.error("Có lỗi xảy ra khi xóa đánh giá");
		} finally {
			setIsDeleting(false);
			setDeleteId(null);
		}
	};

	const handleResetFilters = () => {
		setSearch("");
		setStarFilter("all");
		setSentimentFilter("all");
	};

	// Parse product image safely
	const getProductImage = (product) => {
		if (!product || !product.images) return null;
		let imgs = product.images;
		if (typeof imgs === "string") {
			try {
				imgs = JSON.parse(imgs);
			} catch {
				imgs = [];
			}
		}
		return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
	};

	// Local filtering of ratings based on search & filters (since API is paginated and doesn't filter server-side)
	const filteredRatings = ratings.filter((item) => {
		const matchesSearch =
			search === "" ||
			(item.user?.full_name &&
				item.user.full_name.toLowerCase().includes(search.toLowerCase())) ||
			(item.product?.name &&
				item.product.name.toLowerCase().includes(search.toLowerCase())) ||
			(item.comment && item.comment.toLowerCase().includes(search.toLowerCase()));

		const matchesStar =
			starFilter === "all" || item.rating.toString() === starFilter;

		let matchesSentiment = true;
		if (sentimentFilter !== "all") {
			const aiScore = item.model_rating || 0;
			if (sentimentFilter === "positive") matchesSentiment = aiScore >= 4;
			else if (sentimentFilter === "neutral") matchesSentiment = aiScore === 3;
			else if (sentimentFilter === "negative") matchesSentiment = aiScore > 0 && aiScore <= 2;
		}

		return matchesSearch && matchesStar && matchesSentiment;
	});

	// Get Sentiment badge configuration
	const getSentimentDetails = (score) => {
		if (!score) return { label: "Chưa phân tích", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
		if (score >= 4) return { label: "Tích cực", color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20" };
		if (score === 3) return { label: "Trung lập", color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20" };
		return { label: "Tiêu cực", color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20" };
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
						Quản lý Đánh giá
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Xem và quản lý các phản hồi, đánh giá từ khách hàng cũng như phân tích sắc thái bằng AI.
					</p>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="hover:shadow-md transition-shadow duration-300 bg-card/50 backdrop-blur-sm border-border/60">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Tổng số đánh giá
						</CardTitle>
						<div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
							<MessageSquare className="w-4 h-4 text-primary" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground mt-1">Lượt phản hồi sản phẩm</p>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow duration-300 bg-card/50 backdrop-blur-sm border-border/60">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Điểm đánh giá TB
						</CardTitle>
						<div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
							<Star className="w-4 h-4 text-amber-500 fill-amber-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold flex items-baseline gap-1">
							{stats.avgRating} <span className="text-sm text-muted-foreground">/ 5</span>
						</div>
						<div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
							{Array.from({ length: 5 }).map((_, i) => (
								<Star
									key={i}
									className={`w-3.5 h-3.5 ${
										i < Math.round(stats.avgRating)
											? "fill-amber-500"
											: "text-muted border-none"
									}`}
								/>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow duration-300 bg-card/50 backdrop-blur-sm border-border/60">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Chỉ số Sắc thái AI
						</CardTitle>
						<div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
							<Sparkles className="w-4 h-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold flex items-baseline gap-1">
							{stats.avgAIScore} <span className="text-sm text-muted-foreground">/ 5</span>
						</div>
						<p className="text-xs text-muted-foreground mt-1">Độ tích cực ước tính từ AI</p>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow duration-300 bg-card/50 backdrop-blur-sm border-border/60">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Tỷ lệ Hài lòng
						</CardTitle>
						<div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
							<TrendingUp className="w-4 h-4 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.positiveRate}%</div>
						<div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
							<div
								className="bg-emerald-500 h-1.5 rounded-full"
								style={{ width: `${stats.positiveRate}%` }}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters Bar */}
			<div className="bg-card border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-1 flex-col sm:flex-row gap-3">
					<div className="relative flex-1 max-w-sm">
						<Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
						<Input
							placeholder="Tìm kiếm khách hàng, sản phẩm..."
							className="pl-9"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="w-[160px]">
						<Select value={starFilter} onValueChange={setStarFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Số sao đánh giá" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả số sao</SelectItem>
								<SelectItem value="5">5 Sao</SelectItem>
								<SelectItem value="4">4 Sao</SelectItem>
								<SelectItem value="3">3 Sao</SelectItem>
								<SelectItem value="2">2 Sao</SelectItem>
								<SelectItem value="1">1 Sao</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-[180px]">
						<Select value={sentimentFilter} onValueChange={setSentimentFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Sắc thái AI" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả sắc thái</SelectItem>
								<SelectItem value="positive">Tích cực (AI &gt;= 4)</SelectItem>
								<SelectItem value="neutral">Trung lập (AI = 3)</SelectItem>
								<SelectItem value="negative">Tiêu cực (AI &lt;= 2)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{(search || starFilter !== "all" || sentimentFilter !== "all") && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleResetFilters}
						className="shrink-0"
					>
						<RotateCcw className="w-3.5 h-3.5 mr-2" />
						Đặt lại
					</Button>
				)}
			</div>

			{/* Table View */}
			<div className="border rounded-md bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[200px]">Khách hàng</TableHead>
							<TableHead className="w-[250px]">Sản phẩm</TableHead>
							<TableHead className="w-[120px]">Đánh giá</TableHead>
							<TableHead className="w-[140px]">Sắc thái AI</TableHead>
							<TableHead>Nội dung nhận xét</TableHead>
							<TableHead className="w-[150px]">Ngày gửi</TableHead>
							<TableHead className="text-right w-[100px]">Thao tác</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
										<span className="text-sm text-muted-foreground">Đang tải danh sách...</span>
									</div>
								</TableCell>
							</TableRow>
						) : filteredRatings.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
									Không tìm thấy đánh giá nào phù hợp với bộ lọc.
								</TableCell>
							</TableRow>
						) : (
							filteredRatings.map((item) => {
								const sentiment = getSentimentDetails(item.model_rating);
								const imgUrl = getProductImage(item.product);
								return (
									<TableRow key={item.id} className="hover:bg-accent/40 transition-colors">
										<TableCell>
											<div className="font-semibold text-foreground text-sm flex flex-col">
												<span>{item.user?.full_name || "Khách ẩn danh"}</span>
												<span className="text-xs text-muted-foreground font-normal mt-0.5">
													{item.user?.phone || "Không có SĐT"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												{imgUrl ? (
													<img
														src={imgUrl}
														alt={item.product?.name}
														className="w-10 h-10 rounded-md object-cover border border-border"
													/>
												) : (
													<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border">
														No Img
													</div>
												)}
												<span className="font-medium text-xs line-clamp-2 max-w-[200px]" title={item.product?.name}>
													{item.product?.name || `Sản phẩm #${item.product_id}`}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-0.5">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														className={`w-3.5 h-3.5 ${
															i < item.rating
																? "fill-amber-400 text-amber-400"
																: "text-slate-200 dark:text-slate-700"
														}`}
													/>
												))}
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												className={`text-xs px-2.5 py-0.5 font-medium rounded-full ${sentiment.color}`}
											>
												<Sparkles className="w-3 h-3 mr-1 inline shrink-0" />
												{sentiment.label} ({item.model_rating || "N/A"})
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm text-foreground/90 max-w-[320px] truncate" title={item.comment}>
												{item.comment || <em className="text-muted-foreground">Không viết nhận xét</em>}
											</div>
										</TableCell>
										<TableCell>
											<span className="text-xs text-muted-foreground">
												{item.created_at
													? new Date(item.created_at).toLocaleString("vi-VN")
													: "N/A"}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-muted-foreground hover:text-foreground"
													onClick={() => setSelectedRating(item)}
												>
													<Eye className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
													onClick={() => handleDeleteClick(item.id)}
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

			{/* Pagination View */}
			{!loading && ratings.length > 0 && (
				<div className="flex items-center justify-between border-t border-border pt-4">
					<div className="text-xs text-muted-foreground">
						Hiển thị trang {pagination.page} trên {pagination.totalPages} trang (Tổng cộng {pagination.total} đánh giá)
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(pagination.page - 1)}
							disabled={pagination.page <= 1}
						>
							Trang trước
						</Button>
						<div className="text-sm font-semibold px-2">
							{pagination.page}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(pagination.page + 1)}
							disabled={pagination.page >= pagination.totalPages}
						>
							Trang sau
						</Button>
					</div>
				</div>
			)}

			{/* Detail Dialog */}
			<Dialog open={!!selectedRating} onOpenChange={(open) => !open && setSelectedRating(null)}>
				<DialogContent className="max-w-2xl sm:rounded-lg">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							<MessageSquare className="w-5 h-5 text-primary" />
							Chi tiết Đánh giá #{selectedRating?.id}
						</DialogTitle>
						<DialogDescription>
							Thông tin đầy đủ của đánh giá sản phẩm từ người tiêu dùng.
						</DialogDescription>
					</DialogHeader>

					{selectedRating && (
						<div className="grid gap-6 py-4">
							{/* Client & Product Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2.5 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
									<div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
										<User className="w-3.5 h-3.5" />
										Khách hàng
									</div>
									<div>
										<div className="font-semibold text-sm">{selectedRating.user?.full_name || "Khách ẩn danh"}</div>
										<div className="text-xs text-muted-foreground mt-0.5">SĐT: {selectedRating.user?.phone || "N/A"}</div>
										<div className="text-xs text-muted-foreground">User ID: {selectedRating.user_id}</div>
									</div>
								</div>

								<div className="space-y-2.5 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
									<div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
										<ShoppingBag className="w-3.5 h-3.5" />
										Sản phẩm
									</div>
									<div className="flex gap-2">
										{getProductImage(selectedRating.product) && (
											<img
												src={getProductImage(selectedRating.product)}
												alt={selectedRating.product?.name}
												className="w-12 h-12 rounded object-cover border shrink-0"
											/>
										)}
										<div>
											<div className="font-semibold text-xs line-clamp-2">{selectedRating.product?.name || `Sản phẩm #${selectedRating.product_id}`}</div>
											<div className="text-xs text-muted-foreground mt-0.5">ID Sản phẩm: {selectedRating.product_id}</div>
										</div>
									</div>
								</div>
							</div>

							{/* Rating details & AI score */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-1">
									<span className="text-xs font-semibold text-muted-foreground">Đánh giá sao thực tế:</span>
									<div className="flex items-center gap-1 mt-1">
										<div className="flex">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													className={`w-5 h-5 ${
														i < selectedRating.rating
															? "fill-amber-400 text-amber-400"
															: "text-slate-200 dark:text-slate-700"
													}`}
												/>
											))}
										</div>
										<span className="text-sm font-bold ml-1">({selectedRating.rating} / 5)</span>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<span className="text-xs font-semibold text-muted-foreground">Sắc thái phân tích từ AI:</span>
									<div className="flex items-center gap-2 mt-1">
										<Badge
											variant="secondary"
											className={`text-xs px-2.5 py-0.5 font-medium rounded-full ${
												getSentimentDetails(selectedRating.model_rating).color
											}`}
										>
											<Sparkles className="w-3.5 h-3.5 mr-1 inline shrink-0" />
											{getSentimentDetails(selectedRating.model_rating).label} (AI: {selectedRating.model_rating || "Chưa phân tích"})
										</Badge>
									</div>
								</div>
							</div>

							{/* Time info */}
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Calendar className="w-3.5 h-3.5" />
								<span>Thời gian gửi: {new Date(selectedRating.created_at).toLocaleString("vi-VN")}</span>
							</div>

							{/* Message comment body */}
							<div className="space-y-2 border-t pt-4">
								<div className="text-xs font-bold text-muted-foreground uppercase">Nội dung nhận xét:</div>
								<div className="p-4 rounded-lg bg-accent/30 text-sm text-foreground/90 whitespace-pre-wrap italic leading-relaxed">
									"{selectedRating.comment || "Khách hàng không viết bình luận."}"
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="secondary" onClick={() => setSelectedRating(null)}>
							Đóng cửa sổ
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								const id = selectedRating?.id;
								setSelectedRating(null);
								handleDeleteClick(id);
							}}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Xóa đánh giá này
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-500 font-bold">
							<AlertTriangle className="w-5 h-5" />
							Xác nhận xóa đánh giá
						</DialogTitle>
						<DialogDescription>
							Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này sẽ loại bỏ hoàn toàn đánh giá khỏi sản phẩm và không thể hoàn tác.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
							Hủy bỏ
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
							{isDeleting ? "Đang xóa..." : "Đồng ý xóa"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default RatingListPage;
