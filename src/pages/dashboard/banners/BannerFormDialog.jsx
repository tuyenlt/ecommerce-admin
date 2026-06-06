import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import bannerService from "@/services/bannerService";

const toLocalDatetimeString = (dateString) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return "";
	const pad = (num) => String(num).padStart(2, "0");
	const Y = date.getFullYear();
	const M = pad(date.getMonth() + 1);
	const D = pad(date.getDate());
	const h = pad(date.getHours());
	const m = pad(date.getMinutes());
	return `${Y}-${M}-${D}T${h}:${m}`;
};

export default function BannerFormDialog({ open, onOpenChange, banner, onSuccess }) {
	const [title, setTitle] = useState(banner?.title || "");
	const [description, setDescription] = useState(banner?.description || "");
	const [redirectUrl, setRedirectUrl] = useState(banner?.redirect_url || "");
	const [sortOrder, setSortOrder] = useState(banner?.sort_order || 0);
	const [startDate, setStartDate] = useState(banner?.start_date ? toLocalDatetimeString(banner.start_date) : "");
	const [endDate, setEndDate] = useState(banner?.end_date ? toLocalDatetimeString(banner.end_date) : "");
	const [isActive, setIsActive] = useState(banner?.is_active ?? true);
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(banner?.image_url || "");
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef(null);

	const isEdit = !!banner;

	const handleImageChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			// Check file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast.error("Kích thước file ảnh không được vượt quá 5MB");
				return;
			}
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const triggerFileSelect = () => {
		fileInputRef.current?.click();
	};

	const removeImage = () => {
		setImageFile(null);
		setImagePreview(banner?.image_url || "");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!title.trim()) {
			toast.error("Vui lòng nhập tiêu đề banner");
			return;
		}
		if (!description.trim()) {
			toast.error("Vui lòng nhập mô tả banner");
			return;
		}
		if (!isEdit && !imageFile) {
			toast.error("Vui lòng chọn hình ảnh banner");
			return;
		}

		try {
			setLoading(true);
			const formDataObj = new FormData();
			formDataObj.append("title", title.trim());
			formDataObj.append("description", description.trim());
			formDataObj.append("redirect_url", redirectUrl.trim());
			formDataObj.append("sort_order", Number(sortOrder));
			formDataObj.append("is_active", isActive);

			if (startDate) {
				formDataObj.append("start_date", new Date(startDate).toISOString());
			}
			if (endDate) {
				formDataObj.append("end_date", new Date(endDate).toISOString());
			}
			if (imageFile) {
				formDataObj.append("image", imageFile);
			}

			if (isEdit) {
				await bannerService.updateBanner(banner.id, formDataObj);
				toast.success("Cập nhật banner thành công");
			} else {
				await bannerService.createBanner(formDataObj);
				toast.success("Thêm banner mới thành công");
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Error saving banner:", error);
			toast.error(error.response?.data?.message || (isEdit ? "Lỗi khi cập nhật banner" : "Lỗi khi tạo banner"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Cập nhật Banner" : "Thêm Banner mới"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-3">
					<div className="space-y-1.5">
						<Label htmlFor="title">Tiêu đề banner <span className="text-destructive">*</span></Label>
						<Input
							id="title"
							placeholder="Nhập tiêu đề khuyến mãi..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="description">Mô tả banner <span className="text-destructive">*</span></Label>
						<Textarea
							id="description"
							placeholder="Nhập chi tiết khuyến mãi..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							required
							rows={3}
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Hình ảnh banner <span className="text-destructive">{!isEdit && "*"}</span></Label>
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/*"
							onChange={handleImageChange}
						/>
						{imagePreview ? (
							<div className="relative border rounded-lg overflow-hidden group h-40 bg-muted flex items-center justify-center">
								<img
									src={imagePreview}
									alt="Banner preview"
									className="w-full h-full object-contain"
								/>
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
									<Button type="button" variant="secondary" size="sm" onClick={triggerFileSelect}>
										Thay đổi ảnh
									</Button>
									{imageFile && (
										<Button type="button" variant="destructive" size="icon" onClick={removeImage}>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							</div>
						) : (
							<div
								onClick={triggerFileSelect}
								className="border border-dashed rounded-lg h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
									<Upload className="w-5 h-5" />
								</div>
								<div className="text-center">
									<p className="text-sm font-medium">Nhấp để tải ảnh lên</p>
									<p className="text-xs text-muted-foreground mt-0.5">Hỗ trợ PNG, JPG, WEBP tối đa 5MB</p>
								</div>
							</div>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="redirectUrl">Đường dẫn điều hướng (Tùy chọn)</Label>
						<Input
							id="redirectUrl"
							placeholder="https://example.com/khuyen-mai"
							value={redirectUrl}
							onChange={(e) => setRedirectUrl(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
							<Input
								id="sortOrder"
								type="number"
								min="0"
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value)}
							/>
						</div>

						<div className="flex items-center justify-between border rounded-lg px-3 py-1 bg-muted/20">
							<Label htmlFor="isActive" className="cursor-pointer font-medium text-sm">Hoạt động</Label>
							<Switch
								id="isActive"
								checked={isActive}
								onCheckedChange={setIsActive}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="startDate">Ngày bắt đầu hiển thị</Label>
							<Input
								id="startDate"
								type="datetime-local"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="endDate">Ngày kết thúc hiển thị</Label>
							<Input
								id="endDate"
								type="datetime-local"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter className="pt-4">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
							Hủy
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{isEdit ? "Cập nhật" : "Tạo mới"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
