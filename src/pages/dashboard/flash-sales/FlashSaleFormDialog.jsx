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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import flashSaleService from "@/services/flashSaleService";
import productService from "@/services/productService";
import categoryService from "@/services/categoryService";
import { parseVietnamesePrice, formatVietnamesePrice } from "@/lib/utils";

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

// Advanced Product Selector Sub-Dialog
function ProductSelectorDialog({ open, onOpenChange, products, categories, loading, onSelect }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState("");
	const [sortBy, setSortBy] = useState("name-asc"); // name-asc, name-desc, price-asc, price-desc, stock-desc

	const filteredProducts = products.filter((p) => {
		const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = !selectedCategoryId || String(p.category_id) === String(selectedCategoryId);
		return matchesSearch && matchesCategory;
	}).sort((a, b) => {
		if (sortBy === "name-asc") {
			return a.name.localeCompare(b.name, "vi");
		}
		if (sortBy === "name-desc") {
			return b.name.localeCompare(a.name, "vi");
		}
		
		const aPrice = parseVietnamesePrice(a.sale_price !== "0đ" ? a.sale_price : a.base_price);
		const bPrice = parseVietnamesePrice(b.sale_price !== "0đ" ? b.sale_price : b.base_price);
		
		if (sortBy === "price-asc") {
			return aPrice - bPrice;
		}
		if (sortBy === "price-desc") {
			return bPrice - aPrice;
		}
		if (sortBy === "stock-desc") {
			return (b.stock || 0) - (a.stock || 0);
		}
		return 0;
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-6">
				<DialogHeader>
					<DialogTitle>Tìm kiếm và Chọn sản phẩm</DialogTitle>
				</DialogHeader>

				{/* Search, Filter, Sort Controls */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-3 my-4">
					<div className="relative md:col-span-6">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Tìm tên sản phẩm..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<div className="relative md:col-span-3">
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={selectedCategoryId}
							onChange={(e) => setSelectedCategoryId(e.target.value)}
						>
							<option value="">Tất cả danh mục</option>
							{categories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>

					<div className="relative md:col-span-3">
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
						>
							<option value="name-asc">Tên A-Z</option>
							<option value="name-desc">Tên Z-A</option>
							<option value="price-asc">Giá tăng dần</option>
							<option value="price-desc">Giá giảm dần</option>
							<option value="stock-desc">Tồn kho nhiều nhất</option>
						</select>
					</div>
				</div>

				{/* Products List Table */}
				<div className="flex-1 overflow-y-auto border rounded-md min-h-[300px]">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
							<Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
							Đang tải danh sách sản phẩm...
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="flex items-center justify-center h-full text-muted-foreground p-6">
							Không tìm thấy sản phẩm nào phù hợp bộ lọc.
						</div>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-muted text-muted-foreground text-left border-b font-medium sticky top-0">
								<tr>
									<th className="p-3">Sản phẩm</th>
									<th className="p-3">Danh mục</th>
									<th className="p-3 text-right">Giá hiện tại</th>
									<th className="p-3 text-right">Tồn kho</th>
									<th className="p-3 text-center w-24">Hành động</th>
								</tr>
							</thead>
							<tbody className="divide-y bg-card">
								{filteredProducts.map((p) => {
									const isDiscount = p.sale_price !== "0đ";
									return (
										<tr key={p.id} className="hover:bg-muted/10">
											<td className="p-3">
												<div className="flex items-center gap-3">
													{p.images && p.images.length > 0 ? (
														<img
															src={p.images[0]}
															alt={p.name}
															className="w-10 h-10 rounded-md object-cover border"
														/>
													) : (
														<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border">
															No Img
														</div>
													)}
													<div className="font-medium line-clamp-2">{p.name}</div>
												</div>
											</td>
											<td className="p-3 text-muted-foreground">{p.category?.name || "N/A"}</td>
											<td className="p-3 text-right">
												{isDiscount ? (
													<div className="flex flex-col items-end">
														<span className="text-destructive font-semibold">{p.sale_price}</span>
														<span className="text-xs text-muted-foreground line-through">{p.base_price}</span>
													</div>
												) : (
													<span className="font-semibold">{p.base_price}</span>
												)}
											</td>
											<td className="p-3 text-right font-medium">{p.stock}</td>
											<td className="p-3 text-center">
												<Button
													type="button"
													size="sm"
													onClick={() => onSelect(p)}
													className="bg-amber-500 hover:bg-amber-600 text-white"
												>
													Chọn
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>

				<DialogFooter className="pt-4 border-t mt-4">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Đóng
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function FlashSaleFormDialog({ open, onOpenChange, flashSale, onSuccess }) {
	const isEdit = Boolean(flashSale);

	// Campaign basic states
	const [name, setName] = useState(flashSale?.name || "");
	const [description, setDescription] = useState(flashSale?.description || "");
	const [startTime, setStartTime] = useState(flashSale?.start_time ? toLocalDatetimeString(flashSale.start_time) : "");
	const [endTime, setEndTime] = useState(flashSale?.end_time ? toLocalDatetimeString(flashSale.end_time) : "");
	const [isActive, setIsActive] = useState(flashSale?.is_active ?? true);

	// Product selection states
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loadingProducts, setLoadingProducts] = useState(false);
	const [selectorOpen, setSelectorOpen] = useState(false);

	// Item adding states (form fields for adding a product to campaign)
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [selectedProductId, setSelectedProductId] = useState("");
	const [salePriceInput, setSalePriceInput] = useState("");
	const [saleQuantityInput, setSaleQuantityInput] = useState("");

	// Create mode items state
	const [localItems, setLocalItems] = useState([]);

	// General saving states
	const [saving, setSaving] = useState(false);
	const [addingItem, setAddingItem] = useState(false);
	const [deletingItemId, setDeletingItemId] = useState(null);

	// Fetch all products and categories
	useEffect(() => {
		const loadData = async () => {
			setLoadingProducts(true);
			try {
				const [prodRes, catRes] = await Promise.all([
					productService.getProducts({ page: 1, limit: 100 }),
					categoryService.getCategories()
				]);
				
				const formattedProds = (prodRes.data?.data || []).map(p => {
					let imgs;
					try {
						imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
						if (!Array.isArray(imgs)) imgs = [];
					} catch {
						imgs = [];
					}
					return { ...p, images: imgs };
				});
				
				setProducts(formattedProds);
				setCategories(catRes.data || []);
			} catch (error) {
				console.error("Lỗi khi tải dữ liệu selector:", error);
				toast.error("Không thể tải danh sách sản phẩm/danh mục");
			} finally {
				setLoadingProducts(false);
			}
		};
		if (open) {
			loadData();
		}
	}, [open]);

	// Set selected product in the form
	const handleProductSelect = (prod) => {
		setSelectedProduct(prod);
		setSelectedProductId(prod ? prod.id : "");
		if (prod) {
			const parsed = parseVietnamesePrice(prod.sale_price !== "0đ" ? prod.sale_price : prod.base_price);
			// Suggest a discounted price of 80% of current price as default
			setSalePriceInput(Math.round(parsed * 0.8));
			setSaleQuantityInput(10);
		} else {
			setSalePriceInput("");
			setSaleQuantityInput("");
		}
	};

	// Add item to campaign (local array in create mode, api call in edit mode)
	const handleAddItem = async () => {
		if (!selectedProductId || !selectedProduct) {
			toast.warning("Vui lòng chọn sản phẩm");
			return;
		}

		const price = Number(salePriceInput);
		const quantity = Number(saleQuantityInput);

		if (isNaN(price) || price <= 0) {
			toast.warning("Giá Flash Sale phải lớn hơn 0");
			return;
		}

		if (isNaN(quantity) || quantity <= 0) {
			toast.warning("Số lượng Flash Sale phải lớn hơn 0");
			return;
		}

		const basePriceParsed = parseVietnamesePrice(selectedProduct.base_price);
		if (price >= basePriceParsed) {
			toast.warning(`Giá Flash Sale (${formatVietnamesePrice(price)}) phải nhỏ hơn giá gốc sản phẩm (${formatVietnamesePrice(basePriceParsed)})`);
			return;
		}

		if (isEdit) {
			// In Edit Mode, save item directly to backend
			setAddingItem(true);
			try {
				await flashSaleService.addFlashSaleItems(flashSale.id, {
					items: [{ product_id: Number(selectedProductId), price, quantity }]
				});
				toast.success("Thêm sản phẩm vào chiến dịch thành công");
				// Reset item inputs
				setSelectedProduct(null);
				setSelectedProductId("");
				setSalePriceInput("");
				setSaleQuantityInput("");
				// Refresh parent data
				onSuccess();
			} catch (error) {
				console.error("Error adding flash sale item:", error);
				const errorMsg = error.response?.data?.errors?.[0]?.message || "Lỗi khi thêm sản phẩm vào chiến dịch";
				toast.error(errorMsg);
			} finally {
				setAddingItem(false);
			}
		} else {
			// In Create Mode, save item in local state
			const exists = localItems.some(item => String(item.product_id) === String(selectedProductId));
			if (exists) {
				toast.warning("Sản phẩm này đã được thêm vào danh sách");
				return;
			}

			const newItem = {
				product_id: Number(selectedProductId),
				price,
				quantity,
				product: {
					id: selectedProduct.id,
					name: selectedProduct.name,
					base_price: selectedProduct.base_price
				}
			};

			setLocalItems([...localItems, newItem]);
			// Reset inputs
			setSelectedProduct(null);
			setSelectedProductId("");
			setSalePriceInput("");
			setSaleQuantityInput("");
			toast.success("Đã thêm sản phẩm vào danh sách nháp");
		}
	};

	// Remove item (local array in create mode, api call in edit mode)
	const handleRemoveItem = async (itemIdOrProductId, flashSaleItemId) => {
		if (isEdit) {
			if (!flashSaleItemId) return;
			setDeletingItemId(flashSaleItemId);
			try {
				await flashSaleService.deleteFlashSaleItems(flashSale.id, {
					itemIds: [flashSaleItemId]
				});
				toast.success("Loại bỏ sản phẩm khỏi chiến dịch thành công");
				onSuccess();
			} catch (error) {
				console.error("Error deleting flash sale item:", error);
				toast.error("Không thể loại bỏ sản phẩm khỏi chiến dịch");
			} finally {
				setDeletingItemId(null);
			}
		} else {
			setLocalItems(localItems.filter(item => item.product_id !== itemIdOrProductId));
			toast.success("Đã xóa sản phẩm khỏi danh sách nháp");
		}
	};

	// Save entire campaign
	const handleSaveCampaign = async (e) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Vui lòng điền tên chiến dịch");
			return;
		}

		if (!startTime) {
			toast.warning("Vui lòng chọn thời gian bắt đầu");
			return;
		}

		if (!endTime) {
			toast.warning("Vui lòng chọn thời gian kết thúc");
			return;
		}

		const start = new Date(startTime);
		const end = new Date(endTime);

		if (end <= start) {
			toast.warning("Thời gian kết thúc phải lớn hơn thời gian bắt đầu");
			return;
		}

		const payload = {
			name: name.trim(),
			description: description.trim(),
			start_time: start.toISOString(),
			end_time: end.toISOString(),
			is_active: isActive,
		};

		if (!isEdit) {
			if (localItems.length === 0) {
				toast.warning("Chiến dịch phải có ít nhất một sản phẩm tham gia");
				return;
			}
			payload.items = localItems.map(item => ({
				product_id: item.product_id,
				price: item.price,
				quantity: item.quantity
			}));
		}

		setSaving(true);
		try {
			if (isEdit) {
				await flashSaleService.updateFlashSale(flashSale.id, payload);
				toast.success("Cập nhật thông tin chiến dịch Flash Sale thành công");
			} else {
				await flashSaleService.createFlashSale(payload);
				toast.success("Tạo chiến dịch Flash Sale mới thành công");
			}
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Error saving flash sale campaign:", error);
			const errorMsg = error.response?.data?.errors?.[0]?.message || "Không thể lưu thông tin chiến dịch";
			toast.error(errorMsg);
		} finally {
			setSaving(false);
		}
	};

	const currentItems = isEdit ? (flashSale?.items || []) : localItems;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEdit ? `Chỉnh sửa Chiến dịch: ${flashSale?.name}` : "Tạo Chiến dịch Flash Sale mới"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSaveCampaign} className="space-y-6 mt-4">
					{/* Basic Campaign Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Tên chiến dịch <span className="text-destructive">*</span></Label>
							<Input
								id="name"
								placeholder="Nhập tên chiến dịch (ví dụ: Flash Sale Hè 2026)"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>

						<div className="flex items-center gap-3 md:pl-4 pt-6">
							<Switch
								id="isActive"
								checked={isActive}
								onCheckedChange={setIsActive}
							/>
							<div className="space-y-0.5">
								<Label htmlFor="isActive" className="text-base font-semibold cursor-pointer">Kích hoạt chiến dịch</Label>
								<div className="text-xs text-muted-foreground">Chiến dịch sẽ hiển thị và hoạt động trên cửa hàng</div>
							</div>
						</div>

						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="description">Mô tả chiến dịch</Label>
							<Textarea
								id="description"
								placeholder="Nhập mô tả ngắn về đợt Flash Sale"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="startTime">Thời gian bắt đầu <span className="text-destructive">*</span></Label>
							<Input
								id="startTime"
								type="datetime-local"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="endTime">Thời gian kết thúc <span className="text-destructive">*</span></Label>
							<Input
								id="endTime"
								type="datetime-local"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								required
							/>
						</div>
					</div>

					<hr />

					{/* Flash Sale Items Management Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium tracking-tight">Sản phẩm tham gia</h3>

						{/* Add Item Subsection */}
						<div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/40 p-4 rounded-lg border">
							<div className="space-y-2 md:col-span-5">
								<Label>Chọn sản phẩm <span className="text-destructive">*</span></Label>
								<div className="flex gap-2 items-center">
									{selectedProduct ? (
										<div className="flex items-center gap-3 p-1.5 border rounded-md bg-background w-full h-10">
											{selectedProduct.images && selectedProduct.images.length > 0 ? (
												<img
													src={selectedProduct.images[0]}
													alt={selectedProduct.name}
													className="w-7 h-7 rounded object-cover border shrink-0"
												/>
											) : (
												<div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground border shrink-0">
													No Img
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="font-medium text-xs truncate">{selectedProduct.name}</div>
												<div className="text-[10px] text-muted-foreground">
													Giá gốc: {selectedProduct.base_price} | Kho: {selectedProduct.stock}
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
												onClick={() => setSelectedProduct(null)}
											>
												Hủy
											</Button>
										</div>
									) : (
										<Button
											type="button"
											variant="outline"
											className="w-full h-10 justify-start text-muted-foreground font-normal text-xs overflow-hidden"
											onClick={() => setSelectorOpen(true)}
										>
											<Search className="w-4 h-4 mr-1 shrink-0" />
											Tìm kiếm & Chọn sản phẩm...
										</Button>
									)}
								</div>
							</div>

							<div className="space-y-2 md:col-span-3">
								<Label htmlFor="salePrice">Giá Flash Sale (VNĐ)</Label>
								<Input
									id="salePrice"
									type="number"
									placeholder="Giá bán ưu đãi"
									value={salePriceInput}
									onChange={(e) => setSalePriceInput(e.target.value)}
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="saleQuantity">Số lượng mở bán</Label>
								<Input
									id="saleQuantity"
									type="number"
									placeholder="Số lượng"
									value={saleQuantityInput}
									onChange={(e) => setSaleQuantityInput(e.target.value)}
								/>
							</div>

							<div className="md:col-span-2">
								<Button
									type="button"
									onClick={handleAddItem}
									disabled={addingItem}
									className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-medium"
								>
									{addingItem ? (
										<Loader2 className="w-4 h-4 animate-spin mr-1" />
									) : (
										<Plus className="w-4 h-4 mr-1" />
									)}
									Thêm
								</Button>
							</div>
						</div>

						{/* Items list / table */}
						<div className="border rounded-md overflow-hidden bg-card">
							<table className="w-full text-sm">
								<thead className="bg-muted text-muted-foreground text-left border-b font-medium">
									<tr>
										<th className="p-3">Tên sản phẩm</th>
										<th className="p-3 text-right">Giá gốc</th>
										<th className="p-3 text-right">Giá Flash Sale</th>
										<th className="p-3 text-right">Số lượng bán</th>
										<th className="p-3 text-center w-24">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{currentItems.length === 0 ? (
										<tr>
											<td colSpan={5} className="p-6 text-center text-muted-foreground">
												Chưa có sản phẩm nào được thêm vào chiến dịch này.
											</td>
										</tr>
									) : (
										currentItems.map((item, idx) => {
											// Get original price formatting
											const origPriceStr = item.product?.base_price || "0";
											const origPrice = typeof origPriceStr === 'string' 
												? parseVietnamesePrice(origPriceStr) 
												: origPriceStr;

											return (
												<tr key={item.id || `item-idx-${idx}`} className="hover:bg-muted/10">
													<td className="p-3 font-medium">{item.product?.name || `Sản phẩm #${item.product_id}`}</td>
													<td className="p-3 text-right text-muted-foreground">{formatVietnamesePrice(origPrice)}</td>
													<td className="p-3 text-right text-destructive font-semibold">{formatVietnamesePrice(item.price)}</td>
													<td className="p-3 text-right font-medium">{item.quantity}</td>
													<td className="p-3 text-center">
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={() => handleRemoveItem(item.product_id, item.id)}
															disabled={deletingItemId === item.id}
														>
															{deletingItemId === item.id ? (
																<Loader2 className="w-4 h-4 animate-spin" />
															) : (
																<Trash2 className="w-4 h-4" />
															)}
														</Button>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Dialog Actions */}
					<DialogFooter className="gap-2 pt-4 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={saving}
						>
							Hủy
						</Button>
						<Button type="submit" disabled={saving}>
							{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{isEdit ? "Cập nhật chiến dịch" : "Tạo chiến dịch"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>

			{/* Sub Dialog Selector */}
			{selectorOpen && (
				<ProductSelectorDialog
					open={selectorOpen}
					onOpenChange={setSelectorOpen}
					products={products}
					categories={categories}
					loading={loadingProducts}
					onSelect={(prod) => {
						handleProductSelect(prod);
						setSelectorOpen(false);
					}}
				/>
			)}
		</Dialog>
	);
}
