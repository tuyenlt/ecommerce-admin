import categoryApi from "@/api/categoryApi";

/**
 * Lớp trung gian xử lý logic cho categories
 */
const categoryService = {
	getCategories: async () => {
		return await categoryApi.getCategories();
	},

	getCategoryById: async (id) => {
		return await categoryApi.getCategoryById(id);
	},

	createCategory: async (data) => {
		return await categoryApi.createCategory(data);
	},

	updateCategory: async (id, data) => {
		return await categoryApi.updateCategory(id, data);
	},

	deleteCategory: async (id) => {
		return await categoryApi.deleteCategory(id);
	},
};

export default categoryService;
