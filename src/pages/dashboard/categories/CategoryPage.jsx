import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import categoryService from "@/services/categoryService";
import CategoryFormDialog from "./CategoryFormDialog";

export default function CategoryPage() {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const [formOpen, setFormOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(null);
	
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const response = await categoryService.getCategories();
			setCategories(response.data || []);
		} catch (error) {
			console.error("Error fetching categories:", error);
			toast.error("Không thể tải danh sách danh mục");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	// Flatten categories for table rendering
	const flattenCategories = (cats, level = 0) => {
		if (!cats) return [];
		let flat = [];
		cats.forEach(cat => {
			flat.push({ ...cat, level });
			const children = cat.subCategories || cat.children || [];
			if (children.length > 0) {
				flat = flat.concat(flattenCategories(children, level + 1));
			}
		});
		return flat;
	};

	const flatCategories = flattenCategories(categories);

	const handleAdd = () => {
		setSelectedCategory(null);
		setFormOpen(true);
	};

	const handleEdit = (category) => {
		setSelectedCategory(category);
		setFormOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!categoryToDelete) return;
		try {
			setIsDeleting(true);
			await categoryService.deleteCategory(categoryToDelete.id);
			toast.success("Xoá danh mục thành công");
			fetchCategories();
		} catch (error) {
			console.error("Error deleting category:", error);
			toast.error("Không thể xoá danh mục này. Có thể danh mục đang chứa sản phẩm hoặc danh mục con.");
		} finally {
			setIsDeleting(false);
			setDeleteOpen(false);
			setCategoryToDelete(null);
		}
	};

	const openDeleteDialog = (category) => {
		setCategoryToDelete(category);
		setDeleteOpen(true);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Quản lý Danh mục</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Tạo và quản lý các danh mục sản phẩm của cửa hàng
					</p>
				</div>
				<Button onClick={handleAdd}>
					<Plus className="w-4 h-4 mr-2" />
					Thêm danh mục
				</Button>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg flex items-center gap-2">
						<Layers className="w-5 h-5 text-primary" />
						Cấu trúc danh mục
					</CardTitle>
					<CardDescription>
						Danh sách tất cả các danh mục và danh mục con
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tên danh mục</TableHead>
									<TableHead className="w-[200px]">Ngày tạo</TableHead>
									<TableHead className="w-[100px] text-right">Thao tác</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
											Đang tải dữ liệu...
										</TableCell>
									</TableRow>
								) : flatCategories.length === 0 ? (
									<TableRow>
										<TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
											Chưa có danh mục nào
										</TableCell>
									</TableRow>
								) : (
									flatCategories.map((cat) => (
										<TableRow key={cat.id}>
											<TableCell>
												<div 
													className="flex items-center gap-2"
													style={{ paddingLeft: `${cat.level * 24}px` }}
												>
													{cat.level > 0 && <span className="text-muted-foreground">└</span>}
													<span className={cat.level === 0 ? "font-medium" : ""}>
														{cat.name}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{cat.created_at ? new Date(cat.created_at).toLocaleDateString('vi-VN') : "N/A"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button 
														variant="ghost" 
														size="icon"
														onClick={() => handleEdit(cat)}
													>
														<Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
													</Button>
													<Button 
														variant="ghost" 
														size="icon"
														className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
														onClick={() => openDeleteDialog(cat)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{formOpen && (
				<CategoryFormDialog 
					open={formOpen}
					onOpenChange={setFormOpen}
					category={selectedCategory}
					categories={categories}
					onSuccess={fetchCategories}
				/>
			)}

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bạn có chắc chắn muốn xoá?</DialogTitle>
						<div className="text-sm text-muted-foreground mt-2">
							Hành động này không thể hoàn tác. Danh mục "{categoryToDelete?.name}" sẽ bị xoá vĩnh viễn.
							Lưu ý: Bạn không thể xoá danh mục nếu nó đang chứa danh mục con hoặc sản phẩm.
						</div>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" disabled={isDeleting} onClick={() => setDeleteOpen(false)}>Hủy</Button>
						<Button 
							variant="destructive"
							disabled={isDeleting}
							onClick={(e) => {
								e.preventDefault();
								handleDeleteConfirm();
							}}
						>
							{isDeleting ? "Đang xoá..." : "Xoá danh mục"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
