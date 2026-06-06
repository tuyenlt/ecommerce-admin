import flashSaleApi from "@/api/flashSaleApi";

const flashSaleService = {
	getAllFlashSales: async () => {
		return await flashSaleApi.getAllFlashSales();
	},

	createFlashSale: async (data) => {
		return await flashSaleApi.createFlashSale(data);
	},

	updateFlashSale: async (id, data) => {
		return await flashSaleApi.updateFlashSale(id, data);
	},

	deleteFlashSale: async (id) => {
		return await flashSaleApi.deleteFlashSale(id);
	},

	addFlashSaleItems: async (id, data) => {
		return await flashSaleApi.addFlashSaleItems(id, data);
	},

	deleteFlashSaleItems: async (id, data) => {
		return await flashSaleApi.deleteFlashSaleItems(id, data);
	},
};

export default flashSaleService;
