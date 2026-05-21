import productApi from "@/api/productApi";

/**
 * Lớp trung gian xử lý logic (nếu có) trước khi gửi/nhận data từ API
 */
const productService = {
	getProducts: async (params) => {
		return await productApi.getProducts(params);
	},

	getProductById: async (id) => {
		return await productApi.getProductById(id);
	},

	createProduct: async (data) => {
		// Có thể thực hiện chuẩn hóa dữ liệu ở đây
		return await productApi.createProduct(data);
	},

	updateProduct: async (id, data) => {
		return await productApi.updateProduct(id, data);
	},

	deleteProduct: async (id) => {
		return await productApi.deleteProduct(id);
	},
};

export default productService;
