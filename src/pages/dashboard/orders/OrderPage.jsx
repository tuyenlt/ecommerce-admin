import { useState, useEffect } from "react";
import OrderService from "@/services/orderService";
import OrderFilter from "./components/OrderFilter";
import OrderList from "./components/OrderList";

export default function OrderPage() {
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		total_page: 1,
	});

	const [query, setQuery] = useState({
		page: 1,
		limit: 10,
		filter: null,
	});

	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				const response = await OrderService.getOrders(query);
				setOrders(response.data.data);
				setPagination(response.data.pagination);
			} catch (error) {
				console.error("Error fetching orders:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchOrders();
	}, [query]);


	return (
		<div className="flex flex-col gap-4">
			<OrderFilter query={query} setQuery={setQuery} />
			<OrderList orders={orders} loading={loading} pagination={pagination} setQuery={setQuery} />
		</div>
	);
}