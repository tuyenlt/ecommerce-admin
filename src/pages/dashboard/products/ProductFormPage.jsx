import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect";
import { toast } from "sonner";
import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import { parseVietnamesePrice } from "@/lib/utils";

const ProductFormPage = () => {
	const { id } = useParams();
	const isEdit = Boolean(id);
	const navigate = useNavigate();

	const [loading, setLoading] = useState(isEdit);
	const [saving, setSaving] = useState(false);
	const [categories, setCategories] = useState([]);

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		base_price: "",
		sale_price: "",
		category_id: "",
		warranty: "",
		stock: "0",
		is_active: true,
	});

	const [specs, setSpecs] = useState([]);
	const [colors, setColors] = useState([]);
	const [images, setImages] = useState([]);
	const [existingImages, setExistingImages] = useState([]);

	const fetchCategories = async () => {
		try {
			const res = await categoryService.getCategories();
			setCategories(res.data || []);
		} catch {
			toast.error("Lỗi khi tải danh mục");
		}
	};

	const fetchProduct = async () => {
		try {
			const res = await productService.getProductById(id);
			const product = res.data;
			setFormData({
				name: product.name || "",
				description: product.description || "",
				base_price: parseVietnamesePrice(product.base_price) || "",
				sale_price: parseVietnamesePrice(product.sale_price) || "",
				category_id: product.category_id?.toString() || "",
				warranty: product.warranty || "",
				stock: product.stock?.toString() || "0",
				is_active: product.is_active ?? true,
			});

			try {
				const parsedSpecs = JSON.parse(product.specs || "[]");
				setSpecs(Array.isArray(parsedSpecs) ? parsedSpecs : []);
			} catch (e) { setSpecs([]); }

			try {
				const parsedColors = JSON.parse(product.color || "[]");
				setColors(Array.isArray(parsedColors) ? parsedColors : []);
			} catch (e) { setColors([]); }

			try {
				let parsedImages = product.images;
				if (typeof product.images === 'string') {
					parsedImages = JSON.parse(product.images);
				}
				setExistingImages(Array.isArray(parsedImages) ? parsedImages : []);
			} catch (e) { setExistingImages([]); }

		} catch {
			toast.error("Không tìm thấy sản phẩm");
			navigate("/products");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
		if (isEdit) {
			fetchProduct();
		}
	}, [id, isEdit]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleImageChange = (e) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			setImages((prev) => [...prev, ...newFiles]);
		}
	};

	const removeImage = (index) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
	};

	const removeExistingImage = (index) => {
		setExistingImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSelectChange = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSwitchChange = (checked) => {
		setFormData((prev) => ({ ...prev, is_active: checked }));
	};

	const handleAddSpec = () => setSpecs([...specs, { name: "", value: "" }]);
	const handleRemoveSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));
	const handleSpecChange = (index, field, value) => {
		const newSpecs = [...specs];
		newSpecs[index][field] = value;
		setSpecs(newSpecs);
	};

	const handleAddColor = () => setColors([...colors, { color: "", price: "" }]);
	const handleRemoveColor = (index) => setColors(colors.filter((_, i) => i !== index));
	const handleColorChange = (index, field, value) => {
		const newColors = [...colors];
		newColors[index][field] = value;
		setColors(newColors);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = new FormData();
			payload.append("name", formData.name);
			payload.append("description", formData.description);
			payload.append("base_price", parseFloat(formData.base_price));
			if (formData.sale_price) payload.append("sale_price", parseFloat(formData.sale_price));
			payload.append("category_id", parseInt(formData.category_id));
			payload.append("warranty", formData.warranty);
			payload.append("stock", parseInt(formData.stock));
			payload.append("is_active", formData.is_active);
			payload.append("specs", JSON.stringify(specs));
			payload.append("color", JSON.stringify(colors));
			
			// Thêm các ảnh cũ cần giữ lại dưới dạng JSON string của mảng
			payload.append("images", JSON.stringify(existingImages));

			// Thêm các ảnh mới (Files)
			images.forEach((img) => {
				payload.append("images", img);
			});

			if (isEdit) {
				await productService.updateProduct(id, payload);
				toast.success("Cập nhật sản phẩm thành công");
			} else {
				await productService.createProduct(payload);
				toast.success("Tạo sản phẩm thành công");
				navigate("/products");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Có lỗi xảy ra");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto pb-10">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/products">
						<ChevronLeft className="w-4 h-4" />
					</Link>
				</Button>
				<h1 className="text-3xl font-bold tracking-tight">
					{isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
				</h1>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

					{/* Main info */}
					<div className="md:col-span-2 space-y-6">
						<div className="bg-card p-6 rounded-lg border space-y-6">
							<h2 className="text-lg font-semibold">Thông tin chung</h2>

							<div className="space-y-2">
								<Label htmlFor="name">Tên sản phẩm <span className="text-destructive">*</span></Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
									placeholder="Nhập tên sản phẩm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Mô tả chi tiết</Label>
								<p className="text-xs text-muted-foreground">Hỗ trợ định dạng mã HTML (Ví dụ: &lt;b&gt;In đậm&lt;/b&gt;).</p>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleChange}
									rows={8}
									placeholder="<p>Mô tả sản phẩm...</p>"
								/>
							</div>

							<div className="space-y-2">
								<Label>Hình ảnh sản phẩm</Label>
								<Input
									type="file"
									multiple
									accept="image/*"
									onChange={handleImageChange}
								/>
								<div className="flex flex-wrap gap-4 mt-4">
									{existingImages.map((img, idx) => (
										<div key={`existing-${idx}`} className="relative group">
											<img src={img} alt="Product" className="w-24 h-24 object-cover rounded-lg border shadow-sm" />
											<button
												type="button"
												className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
												onClick={() => removeExistingImage(idx)}
											>
												<X className="w-3.5 h-3.5" />
											</button>
										</div>
									))}
									{images.map((img, idx) => {
										// Tạo url tạm để preview ảnh
										const previewUrl = URL.createObjectURL(img);
										return (
											<div key={`new-${idx}`} className="relative group">
												<img src={previewUrl} alt="New Product" className="w-24 h-24 object-cover rounded-lg border shadow-sm" />
												<button
													type="button"
													className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
													onClick={() => removeImage(idx)}
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
										);
									})}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="warranty">Bảo hành</Label>
								<Input
									id="warranty"
									name="warranty"
									value={formData.warranty}
									onChange={handleChange}
									placeholder="VD: 12 tháng"
								/>
							</div>
						</div>

						{/* Thông số kỹ thuật */}
						<div className="bg-card p-6 rounded-lg border space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Thông số kỹ thuật</h2>
								<Button type="button" variant="outline" size="sm" onClick={handleAddSpec}>
									<Plus className="w-4 h-4 mr-2" />
									Thêm thông số
								</Button>
							</div>

							{specs.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">Chưa có thông số nào.</p>
							) : (
								<div className="space-y-4">
									{specs.map((spec, index) => (
										<div key={index} className="flex items-center gap-3">
											<Input
												placeholder="Tên (VD: RAM)"
												value={spec.name}
												onChange={(e) => handleSpecChange(index, "name", e.target.value)}
											/>
											<Input
												placeholder="Giá trị (VD: 8GB)"
												value={spec.value}
												onChange={(e) => handleSpecChange(index, "value", e.target.value)}
											/>
											<Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleRemoveSpec(index)}>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Màu sắc & Giá riêng */}
						<div className="bg-card p-6 rounded-lg border space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Tùy chọn màu sắc</h2>
								<Button type="button" variant="outline" size="sm" onClick={handleAddColor}>
									<Plus className="w-4 h-4 mr-2" />
									Thêm màu
								</Button>
							</div>

							{colors.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">Chưa có màu sắc nào.</p>
							) : (
								<div className="space-y-4">
									{colors.map((c, index) => (
										<div key={index} className="flex items-center gap-3">
											<Input
												placeholder="Màu sắc (VD: Đen)"
												value={c.color}
												onChange={(e) => handleColorChange(index, "color", e.target.value)}
											/>
											<Input
												placeholder="Giá phụ phí/Tùy chọn (VD: 100)"
												value={c.price}
												onChange={(e) => handleColorChange(index, "price", e.target.value)}
											/>
											<Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleRemoveColor(index)}>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Pricing & Status */}
					<div className="space-y-6">
						<div className="bg-card p-6 rounded-lg border space-y-6">
							<h2 className="text-lg font-semibold">Trạng thái</h2>
							<div className="flex items-center justify-between">
								<Label htmlFor="is_active" className="cursor-pointer">Hoạt động</Label>
								<Switch
									id="is_active"
									checked={formData.is_active}
									onCheckedChange={handleSwitchChange}
								/>
							</div>
						</div>

						<div className="bg-card p-6 rounded-lg border space-y-6">
							<h2 className="text-lg font-semibold">Giá & Tồn kho</h2>

							<div className="space-y-2">
								<Label htmlFor="base_price">Giá gốc ($) <span className="text-destructive">*</span></Label>
								<Input
									id="base_price"
									name="base_price"
									type="number"
									step="0.01"
									min="0"
									value={formData.base_price}
									onChange={handleChange}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="sale_price">Giá khuyến mãi ($)</Label>
								<Input
									id="sale_price"
									name="sale_price"
									type="number"
									step="0.01"
									min="0"
									value={formData.sale_price}
									onChange={handleChange}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="stock">Tồn kho</Label>
								<Input
									id="stock"
									name="stock"
									type="number"
									min="0"
									value={formData.stock}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="bg-card p-6 rounded-lg border space-y-6">
							<h2 className="text-lg font-semibold">Phân loại</h2>
							<div className="space-y-2">
								<Label htmlFor="category_id">Danh mục <span className="text-destructive">*</span></Label>
								<CategoryTreeSelect
									categories={categories}
									value={formData.category_id ? parseInt(formData.category_id) : null}
									onChange={(val) => handleSelectChange("category_id", val.toString())}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" asChild>
						<Link to="/products">Hủy</Link>
					</Button>
					<Button type="submit" disabled={saving}>
						{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
						<Save className="w-4 h-4 mr-2" />
						Lưu thay đổi
					</Button>
				</div>
			</form>
		</div>
	);
};

export default ProductFormPage;
