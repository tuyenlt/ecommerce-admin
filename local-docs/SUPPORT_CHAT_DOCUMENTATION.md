# Tài liệu tích hợp API & WebSockets - Chat hỗ trợ khách hàng (Support Chat)

Tài liệu này hướng dẫn Front-end (FE) cách tích hợp hệ thống chat hỗ trợ khách hàng theo thời gian thực (Real-time Support Chat) sử dụng **REST APIs** kết hợp với **WebSockets (Socket.IO)**.

---

## 1. Cơ chế xác thực (Authentication)
Tất cả các kết nối REST API và WebSockets đều yêu cầu xác thực bằng **JWT Access Token**.
- Với REST API: Gửi token qua header `Authorization: Bearer <access_token>`.
- Với WebSockets: Gửi qua một trong các phương thức sau trong lúc kết nối (handshake):
  - **Auth Object**: `{ token: "<access_token>" }`
  - **Query Params**: `?token=<access_token>`
  - **Headers**: `Authorization: Bearer <access_token>`

---

## 2. REST API Endpoints

### 2.1. Lấy lịch sử chat của khách hàng (Role: Customer)
Khách hàng dùng endpoint này để lấy lịch sử tin nhắn của mình khi mở hộp thoại chat (hỗ trợ phân trang, trả về tin nhắn theo thứ tự cũ đến mới).

- **URL**: `/api/v1/support-chat/messages`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Params**:
  - `page` (optional, number): Trang cần lấy (mặc định: `1`).
  - `limit` (optional, number): Số lượng tin nhắn mỗi trang (mặc định: `50`).
- **Response**: Trả về dữ liệu đã được phân trang (data chứa danh sách tin nhắn từ cũ nhất đến mới nhất của trang hiện tại).
  ```json
  {
    "data": [
      {
        "id": 1,
        "created_at": "2026-06-06T07:11:04.000Z",
        "updated_at": "2026-06-06T07:11:04.000Z",
        "user_id": 12,
        "content": "Xin chào, tôi cần hỗ trợ về đơn hàng #1002",
        "type": "customer_to_admin",
        "is_read": true,
        "user": {
          "id": 12,
          "full_name": "Nguyen Van A",
          "email": "customer@example.com"
        }
      },
      {
        "id": 2,
        "created_at": "2026-06-06T07:12:00.000Z",
        "updated_at": "2026-06-06T07:12:00.000Z",
        "user_id": 12,
        "content": "Chào bạn, mình kiểm tra đơn hàng giúp bạn ngay nhé.",
        "type": "admin_to_customer",
        "is_read": false
      }
    ],
    "pagination": {
      "limit": 50,
      "page": 1,
      "total": 2
    }
  }
  ```

### 2.2. Đánh dấu đã đọc tin nhắn (Role: Customer)
Khi khách hàng mở hộp thoại chat và nhìn thấy tin nhắn từ Admin, gọi API này để đánh dấu tất cả tin nhắn của Admin gửi cho mình là đã đọc.

- **URL**: `/api/v1/support-chat/read`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### 2.3. Lấy danh sách hội thoại hỗ trợ (Role: Admin)
Admin dùng endpoint này để tải danh sách tất cả các khách hàng đã từng nhắn tin, kèm theo tin nhắn mới nhất và số lượng tin nhắn chưa đọc từ khách hàng đó để hiển thị lên Dashboard.

- **URL**: `/api/v1/support-chat/conversations`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: Trả về danh sách hội thoại được sắp xếp theo thời gian của tin nhắn mới nhất giảm dần (Mới nhất lên đầu).
  ```json
  [
    {
      "user": {
        "id": 12,
        "full_name": "Nguyen Van A",
        "email": "customer@example.com",
        "avatar_url": "https://example.com/avatar.png",
        "phone": "0987654321"
      },
      "last_message": {
        "content": "Cảm ơn admin nhé!",
        "type": "customer_to_admin",
        "is_read": false,
        "created_at": "2026-06-06T07:15:00.000Z"
      },
      "unread_count": 1
    }
  ]
  ```

### 2.4. Lấy lịch sử chat của khách hàng cụ thể (Role: Admin)
Khi Admin click vào một khách hàng trong danh sách hội thoại để chat, dùng endpoint này để tải toàn bộ nội dung chat của khách hàng đó (hỗ trợ phân trang).

- **URL**: `/api/v1/support-chat/conversations/:customerId/messages`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Params**:
  - `page` (optional, number): Trang cần lấy (mặc định: `1`).
  - `limit` (optional, number): Số lượng tin nhắn mỗi trang (mặc định: `50`).
- **Response**: Tương tự cấu trúc phân trang của endpoint `/api/v1/support-chat/messages`.

### 2.5. Đánh dấu đã đọc tin nhắn của khách hàng (Role: Admin)
Khi Admin xem cuộc hội thoại của khách hàng cụ thể, gọi API này để đánh dấu tất cả các tin nhắn gửi từ khách hàng đó sang trạng thái đã đọc.

- **URL**: `/api/v1/support-chat/conversations/:customerId/read`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "success": true
  }
  ```

---

## 3. Tích hợp Real-time với WebSockets (Socket.IO)

Hệ thống sử dụng thư viện **Socket.IO v4**.

### 3.1. Kết nối (Connection)
- **Namespace**: `/support-chat`
- **URL mẫu**: `http://localhost:3000/support-chat`
- **Cách kết nối (FE Javascript/React/Vue)**:
  ```javascript
  import { io } from "socket.io-client";

  const socket = io("http://localhost:3000/support-chat", {
    auth: {
      token: "YOUR_JWT_ACCESS_TOKEN" // Bắt buộc
    }
  });

  socket.on("connect", () => {
    console.log("Connected to support-chat, client socket ID:", socket.id);
  });
  ```

### 3.2. Cơ chế phân chia Phòng (Rooms) ở Backend
Khi kết nối thành công, Server tự động gán client vào phòng dựa trên vai trò:
- **Khách hàng (Customer)**: Tự động join vào phòng riêng: `customer-${userId}` (Ví dụ: `customer-12`).
- **Quản trị viên (Admin)**: Tự động join vào phòng chung của các admin: `admins`.

---

### 3.3. Các sự kiện FE gửi lên Server (Emit)

#### A. Gửi tin nhắn mới (`send_message`)
FE gửi sự kiện này khi người dùng bấm gửi tin nhắn.
- **Payload**:
  - `content` (string, bắt buộc): Nội dung tin nhắn.
  - `customerId` (number, bắt buộc đối với **Admin**, bỏ qua đối với **Customer**): ID của khách hàng mà admin đang reply.
- **Code mẫu**:
  - *Phía Customer*:
    ```javascript
    socket.emit("send_message", { content: "Tôi cần trợ giúp" }, (response) => {
      console.log("Gửi thành công:", response);
    });
    ```
  - *Phía Admin*:
    ```javascript
    socket.emit("send_message", { content: "Chào bạn, tôi giúp gì được ạ?", customerId: 12 }, (response) => {
      console.log("Gửi thành công:", response);
    });
    ```

#### B. Đăng ký theo dõi cuộc hội thoại (`join_conversation`) (Chỉ dành cho Admin)
Mặc định Admin chỉ nhận thông báo cập nhật chung ở phòng `admins`. Để nhận tin nhắn chat theo thời gian thực của một cuộc hội thoại cụ thể, Admin cần emit sự kiện này khi mở cửa sổ chat của khách hàng đó.
- **Payload**: `{ customerId: number }`
- **Code mẫu**:
  ```javascript
  socket.emit("join_conversation", { customerId: 12 });
  ```

#### C. Hủy theo dõi cuộc hội thoại (`leave_conversation`) (Chỉ dành cho Admin)
Khi Admin đóng cửa sổ chat của khách hàng đó, emit sự kiện này để ngừng nhận tin nhắn real-time từ phòng chat đó.
- **Payload**: `{ customerId: number }`
- **Code mẫu**:
  ```javascript
  socket.emit("leave_conversation", { customerId: 12 });
  ```

#### D. Đánh dấu đã đọc (`mark_as_read`)
FE emit sự kiện này khi người dùng click xem hoặc focus vào cửa sổ chat để đồng bộ trạng thái đã đọc tức thời qua Socket.
- **Payload**:
  - `customerId` (number, bắt buộc đối với **Admin**, bỏ qua đối với **Customer**).
- **Code mẫu**:
  - *Phía Customer*:
    ```javascript
    socket.emit("mark_as_read");
    ```
  - *Phía Admin*:
    ```javascript
    socket.emit("mark_as_read", { customerId: 12 });
    ```

---

### 3.4. Các sự kiện FE cần lắng nghe (Listen)

#### A. Nhận tin nhắn mới (`new_message`)
Nhận tin nhắn thời gian thực trong cuộc hội thoại đang mở (cả Khách hàng và Admin đang xem phòng đều nhận được).
- **Phạm vi**: Khách hàng nhận được tin nhắn trong room của họ, Admin nhận được nếu đã gọi `join_conversation` cho khách hàng đó.
- **Payload**: `ContactMessageEntity`
- **Ví dụ**:
  ```javascript
  socket.on("new_message", (message) => {
    console.log("Tin nhắn mới nhận được:", message);
    // Cập nhật mảng messages của chatbox
  });
  ```

#### B. Cập nhật danh sách hội thoại (`conversation_update`) (Chỉ dành cho Admin)
Sử dụng để cập nhật tức thời danh sách tin nhắn bên trái màn hình của Dashboard Admin (cập nhật nội dung tin nhắn cuối cùng, unread count,...).
- **Phạm vi**: Chỉ các client trong phòng `admins` nhận được.
- **Payload**:
  ```json
  {
    "customerId": 12,
    "message": {
      "id": 5,
      "content": "Tin nhắn mới nhất từ khách hàng",
      "type": "customer_to_admin",
      "is_read": false,
      "created_at": "2026-06-06T07:15:00.000Z"
    },
    "readByRole": 1 // (Tùy chọn) Gửi kèm nếu có hành động đọc tin nhắn
  }
  ```
- **Ví dụ**:
  ```javascript
  socket.on("conversation_update", (data) => {
    console.log("Cập nhật hội thoại:", data);
    // Cập nhật giao diện danh sách các cuộc hội thoại
  });
  ```

#### C. Trạng thái đã đọc thay đổi (`messages_read`)
Nhận thông báo khi đối phương đã đọc tin nhắn của mình.
- **Phạm vi**: Các client đang tham gia phòng `customer-${customerId}`.
- **Payload**:
  ```json
  {
    "customerId": 12,
    "readByRole": 1 // 1: Admin, 2: Customer
  }
  ```
- **Ví dụ**:
  ```javascript
  socket.on("messages_read", (data) => {
    console.log(`Hội thoại của khách hàng ${data.customerId} đã được đọc bởi role: ${data.readByRole}`);
    // Đổi trạng thái hiển thị "Đã xem" trên giao diện chatbox
  });
  ```
