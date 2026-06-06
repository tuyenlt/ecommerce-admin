import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import {
	MessageSquare,
	Send,
	Search,
	Phone,
	Mail,
	Circle,
	ArrowLeft,
	MoreVertical,
	Check,
	CheckCheck,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import supportChatService from "@/services/supportChatService";

const ChatPage = () => {
	const { accessToken } = useAuthStore();
	const [connected, setConnected] = useState(false);

	// Conversations list
	const [conversations, setConversations] = useState([]);
	const [loadingConversations, setLoadingConversations] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Active conversation
	const [selectedCustomer, setSelectedCustomer] = useState(null); // holds customer user object
	const [messages, setMessages] = useState([]);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [messageInput, setMessageInput] = useState("");

	// Responsive view state for mobile
	const [showChatWindowMobile, setShowChatWindowMobile] = useState(false);

	// Refs
	const messagesEndRef = useRef(null);
	const socketRef = useRef(null);
	const activeCustomerIdRef = useRef(null);

	// Parse Socket URL dynamically from VITE_API_BASE_URL
	const getSocketUrl = () => {
		const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
		try {
			const url = new URL(baseUrl);
			return `${url.protocol}//${url.host}/support-chat`;
		} catch {
			return "http://localhost:3000/support-chat";
		}
	};

	// 1. Fetch all conversations on mount
	const fetchConversations = useCallback(async () => {
		setLoadingConversations(true);
		try {
			const data = await supportChatService.getConversations();
			setConversations(data || []);
		} catch (error) {
			console.error("Fetch conversations error:", error);
			toast.error("Không thể tải danh sách hội thoại");
		} finally {
			setLoadingConversations(false);
		}
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchConversations();
		}, 0);
		return () => clearTimeout(timer);
	}, [fetchConversations]);

	// 2. Fetch messages when a customer is selected
	const fetchMessages = useCallback(async (customerId) => {
		setLoadingMessages(true);
		try {
			const res = await supportChatService.getCustomerMessages(customerId, { page: 1, limit: 100 });
			// The response structure might be { data: [...], pagination: {...} } or an array
			if (res && Array.isArray(res)) {
				setMessages(res);
			} else if (res && Array.isArray(res.data)) {
				setMessages(res.data);
			} else {
				setMessages([]);
			}
		} catch (error) {
			console.error(`Fetch messages error for customer ${customerId}:`, error);
			toast.error("Không thể tải lịch sử tin nhắn");
		} finally {
			setLoadingMessages(false);
		}
	}, []);

	// Handle read action (both REST API call & Socket emit)
	const handleMarkAsRead = useCallback(async (customerId) => {
		if (!customerId) return;
		try {
			// Call REST API
			await supportChatService.markAsRead(customerId);

			// Emit Socket event if connected
			if (socketRef.current && socketRef.current.connected) {
				socketRef.current.emit("mark_as_read", { customerId });
			}

			// Update unread count in state immediately
			setConversations((prev) =>
				prev.map((c) =>
					c.user.id === customerId ? { ...c, unread_count: 0 } : c
				)
			);
		} catch (error) {
			console.error("Mark as read error:", error);
		}
	}, []);

	// 3. Socket.IO Setup
	useEffect(() => {
		if (!accessToken) return;

		const socketUrl = getSocketUrl();
		const socketIo = io(socketUrl, {
			auth: {
				token: accessToken,
			},
			transports: ["websocket"],
		});

		socketRef.current = socketIo;

		socketIo.on("connect", () => {
			setConnected(true);
			// Join conversation again if one is already active (e.g., on reconnect)
			if (activeCustomerIdRef.current) {
				socketIo.emit("join_conversation", { customerId: activeCustomerIdRef.current });
			}
		});

		socketIo.on("disconnect", () => {
			setConnected(false);
		});

		// Listen to new messages
		socketIo.on("new_message", (message) => {
			if (!message) return;
			// 1. If message belongs to active customer, append to message list
			const messageCustomerId = message.type === "customer_to_admin" ? message.user_id : message.customerId;
			const isCurrentActive = Number(activeCustomerIdRef.current) === Number(messageCustomerId) || 
								    (message.user && Number(activeCustomerIdRef.current) === Number(message.user.id));

			if (isCurrentActive) {
				setMessages((prev) => {
					// Avoid duplicates using string comparison
					if (prev.some((m) => String(m.id) === String(message.id))) return prev;
					return [...prev, message];
				});

				// Auto mark as read immediately if admin is actively looking at it
				if (message.type === "customer_to_admin") {
					handleMarkAsRead(messageCustomerId);
				}
			}
		});

		// Listen to conversation list updates (real-time sidebar updates)
		socketIo.on("conversation_update", (data) => {
			if (!data) return;
			const { customerId, message } = data;

			setConversations((prev) => {
				// Check if conversation already exists in sidebar
				const index = prev.findIndex((c) => Number(c.user?.id) === Number(customerId));

				if (index !== -1) {
					const updatedConversations = [...prev];
					const existing = updatedConversations[index];

					// Calculate new unread count
					// If message is from customer and admin is NOT currently viewing this customer, increment count
					let newUnreadCount = existing.unread_count;
					if (message && message.type === "customer_to_admin" && Number(activeCustomerIdRef.current) !== Number(customerId)) {
						newUnreadCount += 1;
					}

					// Update existing conversation details
					updatedConversations[index] = {
						...existing,
						last_message: message || existing.last_message,
						unread_count: Number(activeCustomerIdRef.current) === Number(customerId) ? 0 : newUnreadCount,
					};

					// Sort: move the updated conversation to the top
					return [
						updatedConversations[index],
						...updatedConversations.filter((_, idx) => idx !== index),
					];
				} else {
					// Fetch conversations list from API to get full user metadata for new conversation
					fetchConversations();
					return prev;
				}
			});
		});

		// Listen to read receipts
		socketIo.on("messages_read", (data) => {
			if (!data) return;
			const { customerId, readByRole } = data;
			// If messages read by customer (readByRole === 2) and it's our active conversation
			if (Number(customerId) === Number(activeCustomerIdRef.current) && Number(readByRole) === 2) {
				setMessages((prev) =>
					prev.map((m) =>
						m.type === "admin_to_customer" ? { ...m, is_read: true } : m
					)
				);
			}
		});

		return () => {
			if (socketIo) {
				socketIo.disconnect();
			}
		};
	}, [accessToken, handleMarkAsRead, fetchConversations]);

	// Keep active customer ref in sync
	useEffect(() => {
		activeCustomerIdRef.current = selectedCustomer?.id || null;
	}, [selectedCustomer]);

	// Auto-scroll to bottom of messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Select a customer conversation
	const handleSelectCustomer = (customer) => {
		// If clicking the same one, just open on mobile
		if (selectedCustomer?.id === customer.id) {
			setShowChatWindowMobile(true);
			return;
		}

		// Leave previous socket room
		if (selectedCustomer && socketRef.current) {
			socketRef.current.emit("leave_conversation", { customerId: selectedCustomer.id });
		}

		setSelectedCustomer(customer);
		setMessages([]);
		setShowChatWindowMobile(true);

		// Join new socket room
		if (socketRef.current) {
			socketRef.current.emit("join_conversation", { customerId: customer.id });
		}

		// Fetch history messages
		fetchMessages(customer.id);

		// Mark as read
		handleMarkAsRead(customer.id);
	};

	// Back to conversations list on mobile
	const handleBackToList = () => {
		setShowChatWindowMobile(false);
	};

	// Send message
	const handleSendMessage = (e) => {
		e.preventDefault();
		if (!messageInput.trim() || !selectedCustomer || !socketRef.current) return;

		const payload = {
			content: messageInput.trim(),
			customerId: selectedCustomer.id,
		};

		// Emit socket message
		socketRef.current.emit("send_message", payload, (response) => {
			// Callback response from server
			if (response && response.message) {
				const msgEntity = response.message;
				setMessages((prev) => {
					// Avoid duplicates if new_message event already appended it using string comparison
					if (prev.some((m) => String(m.id) === String(msgEntity.id))) return prev;
					return [...prev, msgEntity];
				});
			}
		});

		// Clear input
		setMessageInput("");
	};

	// Filter conversations based on query
	const filteredConversations = conversations.filter((c) => {
		const name = c.user?.full_name || "";
		const email = c.user?.email || "";
		const phone = c.user?.phone || "";
		const query = searchQuery.toLowerCase();
		return (
			name.toLowerCase().includes(query) ||
			email.toLowerCase().includes(query) ||
			phone.includes(query)
		);
	});

	// Helper to get initials
	const getInitials = (name) => {
		if (!name) return "KH";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	// Helper to format time relative/friendly
	const formatMessageTime = (dateStr) => {
		if (!dateStr) return "";
		const date = new Date(dateStr);
		const now = new Date();

		// Check if today
		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
		}

		// Check if yesterday
		const yesterday = new Date(now);
		yesterday.setDate(now.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) {
			return "Hôm qua";
		}

		// Otherwise full date
		return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
	};

	return (
		<div className="flex flex-col space-y-4 h-[calc(100vh-10rem)]">
			{/* Page Header */}
			<div className="flex items-center justify-between shrink-0">
				<div>
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent flex items-center gap-2">
						<MessageSquare className="w-8 h-8 text-primary" />
						Hỗ trợ Khách hàng
					</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Trò chuyện thời gian thực và giải đáp thắc mắc của khách hàng mua sắm.
					</p>
				</div>

				{/* Connection Indicator */}
				<Badge
					variant={connected ? "outline" : "destructive"}
					className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full ${
						connected
							? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20"
							: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20"
					}`}
				>
					<Circle className={`w-2 h-2 ${connected ? "fill-emerald-500 text-emerald-500" : "fill-rose-500 text-rose-500"}`} />
					{connected ? "Đã kết nối Live" : "Mất kết nối"}
				</Badge>
			</div>

			{/* Main Grid View */}
			<Card className="flex-1 overflow-hidden border border-border bg-card/50 backdrop-blur-sm shadow-sm flex">
				<CardContent className="p-0 flex flex-1 h-full overflow-hidden w-full relative">
					
					{/* ─── CỘT TRÁI: DANH SÁCH HỘI THOẠI ─── */}
					<div
						className={`
							w-full md:w-80 border-r border-border flex flex-col h-full bg-card shrink-0
							${showChatWindowMobile ? "hidden md:flex" : "flex"}
						`}
					>
						{/* Search Bar */}
						<div className="p-4 border-b border-border shrink-0">
							<div className="relative">
								<Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
								<Input
									placeholder="Tìm tên, email, SĐT..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 bg-accent/30 border-border/80 focus-visible:ring-1"
								/>
							</div>
						</div>

						{/* Conversations List */}
						<div className="flex-1 overflow-y-auto divide-y divide-border/60">
							{loadingConversations ? (
								<div className="flex flex-col items-center justify-center h-48 gap-2">
									<Loader2 className="w-6 h-6 text-primary animate-spin" />
									<span className="text-xs text-muted-foreground">Đang tải cuộc hội thoại...</span>
								</div>
							) : filteredConversations.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4 text-center">
									<MessageSquare className="w-8 h-8 opacity-20 mb-2" />
									<span className="text-sm">Không tìm thấy hội thoại nào</span>
								</div>
							) : (
								filteredConversations.map((item) => {
									const isSelected = selectedCustomer?.id === item.user.id;
									const lastMsg = item.last_message;
									const initials = getInitials(item.user.full_name);

									return (
										<div
											key={item.user.id}
											onClick={() => handleSelectCustomer(item.user)}
											className={`
												flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 hover:bg-accent/40
												${isSelected ? "bg-accent border-l-4 border-primary" : "border-l-4 border-transparent"}
											`}
										>
											<Avatar className="w-10 h-10 border border-border/50 shrink-0">
												<AvatarImage src={item.user.avatar_url} alt={item.user.full_name} />
												<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
													{initials}
												</AvatarFallback>
											</Avatar>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-1">
													<p className="font-semibold text-sm truncate text-foreground">
														{item.user.full_name || "Khách ẩn danh"}
													</p>
													{lastMsg && (
														<span className="text-[10px] text-muted-foreground shrink-0 font-medium">
															{formatMessageTime(lastMsg.created_at)}
														</span>
													)}
												</div>
												<div className="flex items-center justify-between gap-2 mt-0.5">
													<p className={`text-xs truncate ${item.unread_count > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
														{lastMsg ? (
															lastMsg.type === "admin_to_customer" 
																? `Bạn: ${lastMsg.content}`
																: lastMsg.content
														) : (
															<em className="text-muted-foreground/60">Chưa có tin nhắn</em>
														)}
													</p>
													{item.unread_count > 0 && (
														<Badge className="bg-destructive text-destructive-foreground text-[10px] font-bold h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full animate-pulse">
															{item.unread_count}
														</Badge>
													)}
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>

					{/* ─── CỘT PHẢI: CỬA SỔ CHAT CHÍNH ─── */}
					<div
						className={`
							flex-1 flex flex-col h-full bg-accent/10
							${showChatWindowMobile ? "flex" : "hidden md:flex"}
						`}
					>
						{selectedCustomer ? (
							<>
								{/* Header */}
								<div className="h-16 px-4 border-b border-border bg-card flex items-center justify-between shrink-0">
									<div className="flex items-center gap-3 min-w-0">
										{/* Mobile back button */}
										<Button
											variant="ghost"
											size="icon"
											onClick={handleBackToList}
											className="md:hidden text-muted-foreground hover:text-foreground mr-1"
										>
											<ArrowLeft className="w-5 h-5" />
										</Button>

										<Avatar className="w-10 h-10 border border-border/60">
											<AvatarImage src={selectedCustomer.avatar_url} alt={selectedCustomer.full_name} />
											<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
												{getInitials(selectedCustomer.full_name)}
											</AvatarFallback>
										</Avatar>

										<div className="min-w-0">
											<h2 className="font-semibold text-sm truncate text-foreground">
												{selectedCustomer.full_name || "Khách ẩn danh"}
											</h2>
											<p className="text-xs text-muted-foreground truncate flex items-center gap-2">
												{selectedCustomer.email && (
													<span className="flex items-center gap-0.5">
														<Mail className="w-3 h-3 inline shrink-0" />
														{selectedCustomer.email}
													</span>
												)}
												{selectedCustomer.phone && (
													<span className="flex items-center gap-0.5">
														<Phone className="w-3 h-3 inline shrink-0" />
														{selectedCustomer.phone}
													</span>
												)}
											</p>
										</div>
									</div>

									<div>
										<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
											<MoreVertical className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{/* Messages History List */}
								<div className="flex-1 overflow-y-auto p-4 space-y-4">
									{loadingMessages ? (
										<div className="flex flex-col items-center justify-center h-full gap-2">
											<Loader2 className="w-6 h-6 text-primary animate-spin" />
											<span className="text-xs text-muted-foreground">Đang tải lịch sử tin nhắn...</span>
										</div>
									) : messages.length === 0 ? (
										<div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
											<MessageSquare className="w-10 h-10 mb-2" />
											<p className="text-sm">Hãy gửi tin nhắn đầu tiên để bắt đầu hỗ trợ</p>
										</div>
									) : (
										messages.map((msg, index) => {
											const isAgent = msg.type === "admin_to_customer";
											const showTime = index === 0 || 
												new Date(msg.created_at) - new Date(messages[index - 1].created_at) > 5 * 60 * 1000;

											return (
												<div key={msg.id ? `msg-${msg.id}` : `msg-idx-${index}`} className="space-y-1">
													{showTime && (
														<div className="flex justify-center my-2 shrink-0">
															<span className="text-[10px] bg-background/80 text-muted-foreground border border-border px-2 py-0.5 rounded-full font-medium shadow-2xs">
																{new Date(msg.created_at).toLocaleString("vi-VN", {
																	hour: "2-digit",
																	minute: "2-digit",
																	day: "numeric",
																	month: "numeric",
																})}
															</span>
														</div>
													)}

													<div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
														<div className={`flex items-end gap-1.5 max-w-[75%] ${isAgent ? "flex-row-reverse" : "flex-row"}`}>
															{!isAgent && (
																<Avatar className="w-6 h-6 border shrink-0">
																	<AvatarImage src={selectedCustomer.avatar_url} alt={selectedCustomer.full_name} />
																	<AvatarFallback className="bg-primary/5 text-primary text-[8px] font-bold">
																		{getInitials(selectedCustomer.full_name)}
																	</AvatarFallback>
																</Avatar>
															)}

															<div className="flex flex-col group">
																<div
																	className={`
																		p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
																		${
																			isAgent
																				? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
																				: "bg-card text-foreground border border-border rounded-bl-none shadow-xs"
																		}
																	`}
																>
																	{msg.content}
																</div>

																{/* Read Receipt indicator for admin messages (only for the last admin message) */}
																{isAgent && index === messages.length - 1 && (
																	<div className="flex justify-end gap-1 items-center mt-1 text-[10px] text-muted-foreground select-none">
																		{msg.is_read ? (
																			<>
																				<CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
																				<span>Đã xem</span>
																			</>
																		) : (
																			<>
																				<Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
																				<span>Đã gửi</span>
																			</>
																		)}
																	</div>
																)}
															</div>
														</div>
													</div>
												</div>
											);
										})
									)}
									<div ref={messagesEndRef} />
								</div>

								{/* Input Footer */}
								<form
									onSubmit={handleSendMessage}
									className="p-4 border-t border-border bg-card flex items-center gap-3 shrink-0"
								>
									<Input
										placeholder="Nhập nội dung tin nhắn hỗ trợ..."
										value={messageInput}
										onChange={(e) => setMessageInput(e.target.value)}
										className="flex-1 bg-accent/30 border-border/80 focus-visible:ring-1 py-5"
									/>
									<Button type="submit" size="icon" disabled={!messageInput.trim()} className="shrink-0">
										<Send className="w-4 h-4" />
									</Button>
								</form>
							</>
						) : (
							/* Placeholder when no chat is active */
							<div className="flex-1 flex flex-col items-center justify-center text-center p-8">
								<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary animate-pulse">
									<MessageSquare className="w-8 h-8" />
								</div>
								<h3 className="text-lg font-bold text-foreground">Chào mừng đến với Support Chat</h3>
								<p className="text-sm text-muted-foreground max-w-sm mt-1">
									Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái để xem lịch sử và bắt đầu hỗ trợ khách hàng theo thời gian thực.
								</p>
							</div>
						)}
					</div>

				</CardContent>
			</Card>
		</div>
	);
};

export default ChatPage;
