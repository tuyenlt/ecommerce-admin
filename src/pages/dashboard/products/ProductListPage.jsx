import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import productService from "@/services/productService";

const ProductListPage = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
	const [search, setSearch] = useState("");

	const [deleteId, setDeleteId] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchProducts = async (page = 1, searchQuery = "") => {
		setLoading(true);
		try {
			const res = await productService.getProducts({ page, limit: pagination.limit, search: searchQuery });
			setProducts(res.data.data.map((item) => ({
				...item,
				images: JSON.parse(item.images),
			})));
			setPagination({
				page: res.data.page,
				limit: res.data.limit,
				totalPages: res.data.total
			})
		} catch {
			toast.error("Không thể tải danh sách sản phẩm");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchProducts(1, search);
		}, 500);
		return () => clearTimeout(timer);
	}, [search]);

	const handlePageChange = (newPage) => {
		if (newPage > 0 && newPage <= pagination.totalPages) {
			fetchProducts(newPage, search);
		}
	};

	const handleDeleteClick = (id) => {
		setDeleteId(id);
	};

	const confirmDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		try {
			await productService.deleteProduct(deleteId);
			toast.success("Xóa sản phẩm thành công");
			fetchProducts(pagination.page, search);
		} catch {
			toast.error("Có lỗi xảy ra khi xóa sản phẩm");
		} finally {
			setIsDeleting(false);
			setDeleteId(null);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Sản phẩm</h1>
				<Button asChild>
					<Link to="/products/new">
						<Plus className="w-4 h-4 mr-2" />
						Thêm sản phẩm
					</Link>
				</Button>
			</div>

			<div className="flex items-center gap-2 max-w-sm relative">
				<Search className="w-4 h-4 text-muted-foreground absolute left-3" />
				<Input
					placeholder="Tìm kiếm sản phẩm..."
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="border rounded-md bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tên sản phẩm</TableHead>
							<TableHead>Giá</TableHead>
							<TableHead>Tồn kho</TableHead>
							<TableHead>Trạng thái</TableHead>
							<TableHead className="text-right">Hành động</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									Đang tải...
								</TableCell>
							</TableRow>
						) : products.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
									Không tìm thấy sản phẩm nào.
								</TableCell>
							</TableRow>
						) : (
							products.map((product) => (
								<TableRow key={product.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											{product.images && product.images.length > 0 ? (
												<img
													src={product.images[0]}
													alt={product.name}
													className="w-20 h-20 rounded-md object-cover border"
												/>
											) : (
												<div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border">
													Img
												</div>
											)}
											<div>
												<div className="font-medium line-clamp-1">{product.name}</div>
												<div className="text-xs text-muted-foreground">{product.category?.name || "Chưa có danh mục"}</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										{product.sale_price !== "0đ" ? (
											<div className="flex flex-col">
												<span className="text-destructive font-medium">{product.sale_price}</span>
												<span className="text-muted-foreground line-through text-xs">{product.base_price}</span>
											</div>
										) : (
											<span>{product.base_price}</span>
										)}
									</TableCell>
									<TableCell>{product.stock}</TableCell>
									<TableCell>
										{!product.is_active ? (
											<Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Hoạt động</Badge>
										) : (
											<Badge variant="secondary">Đã ẩn</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="icon" asChild>
											<Link to={`/products/${product.id}/edit`}>
												<Edit className="w-4 h-4" />
											</Link>
										</Button>
										<Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(product.id)}>
											<Trash2 className="w-4 h-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{!loading && products.length > 0 && pagination && (
				<div className="flex items-center justify-end space-x-2 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(pagination.page - 1)}
						disabled={pagination.page <= 1}
					>
						Trang trước
					</Button>
					<div className="text-sm font-medium">
						Trang {pagination.page} / {pagination.totalPages}
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
			)}

			<Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Xóa sản phẩm</DialogTitle>
						<DialogDescription>
							Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này sẽ thay đổi trạng thái sản phẩm và không hiển thị nữa.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Hủy</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
							{isDeleting ? "Đang xóa..." : "Xóa"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ProductListPage;
