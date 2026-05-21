import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect";
import categoryService from "@/services/categoryService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CategoryFormDialog({ open, onOpenChange, category, categories, onSuccess }) {
	const [name, setName] = useState("");
	const [parentId, setParentId] = useState(null);
	const [loading, setLoading] = useState(false);

	const isEdit = !!category;

	useEffect(() => {
		if (open) {
			setName(category?.name || "");
			setParentId(category?.parent_id || null);
		}
	}, [open, category]);

	const filterCategories = (cats) => {
		if (!cats || !isEdit) return cats;
		return cats.filter(c => c.id !== category.id).map(c => ({
			...c,
			subCategories: filterCategories(c.subCategories || c.children),
			children: filterCategories(c.subCategories || c.children),
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Vui lòng nhập tên danh mục");
			return;
		}

		try {
			setLoading(true);
			const payload = {
				name,
				parent_id: parentId,
			};

			if (isEdit) {
				await categoryService.updateCategory(category.id, payload);
				toast.success("Cập nhật danh mục thành công");
			} else {
				await categoryService.createCategory(payload);
				toast.success("Thêm danh mục thành công");
			}
			
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Error saving category:", error);
			toast.error(isEdit ? "Lỗi khi cập nhật danh mục" : "Lỗi khi thêm danh mục");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Cập nhật danh mục" : "Thêm danh mục mới"}</DialogTitle>
				</DialogHeader>
				
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">Tên danh mục <span className="text-destructive">*</span></Label>
						<Input 
							id="name" 
							placeholder="Nhập tên danh mục..." 
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<Label>Danh mục cha (Tùy chọn)</Label>
						<CategoryTreeSelect 
							categories={filterCategories(categories) || []}
							value={parentId}
							onChange={setParentId}
						/>
					</div>
					
					<DialogFooter className="pt-4">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
							Hủy
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{isEdit ? "Cập nhật" : "Thêm mới"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
