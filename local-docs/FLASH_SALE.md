# Tài liệu tích hợp Flash Sale API

Tài liệu này hướng dẫn cách tích hợp các API Flash Sale cho Frontend (Admin và User).

---

## 1. Tổng quan Luồng Nghiệp Vụ

- **Quản trị viên (Admin)**: Tạo chiến dịch Flash Sale với khoảng thời gian bắt đầu/kết thúc và chỉ định danh sách sản phẩm tham gia cùng mức giá ưu đãi và số lượng giới hạn.
- **Khách hàng (User)**: Xem danh sách các chiến dịch Flash Sale đang diễn ra (Active), hoặc xem thông tin Flash Sale đính kèm trong các API chi tiết sản phẩm và danh sách sản phẩm.
- **Tạo đơn hàng**: Khi khách hàng mua sản phẩm đang trong đợt Flash Sale đang hoạt động, hệ thống sẽ tự động áp dụng giá ưu đãi của Flash Sale thay vì giá gốc của sản phẩm và trừ đi số lượng kho Flash Sale tương ứng.

---

## 2. API dành cho Quản trị viên (Admin Only)

Tất cả các API này yêu cầu Header: `Authorization: Bearer <Admin_Token>`

### 2.1. Lấy tất cả chiến dịch Flash Sale
- **Endpoint**: `GET /api/v1/flash-sales`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Flash Sale Hè 2026",
      "description": "Chiến dịch siêu sale hè",
      "start_time": "2026-06-06T08:00:00.000Z",
      "end_time": "2026-06-06T12:00:00.000Z",
      "is_active": true,
      "items": [
        {
          "id": 1,
          "product_id": 5,
          "price": 150000,
          "quantity": 10,
          "product": {
            "id": 5,
            "name": "Sản phẩm A",
            "base_price": 200000
          }
        }
      ]
    }
  ]
  ```

### 2.2. Tạo chiến dịch Flash Sale mới
- **Endpoint**: `POST /api/v1/flash-sales`
- **Request Body**:
  ```json
  {
    "name": "Flash Sale Tối Thứ 7",
    "description": "Siêu giảm giá cuối tuần",
    "start_time": "2026-06-06T19:00:00.000Z",
    "end_time": "2026-06-06T22:00:00.000Z",
    "is_active": true,
    "items": [
      {
        "product_id": 2,
        "price": 99000,
        "quantity": 50
      }
    ]
  }
  ```

### 2.3. Cập nhật chiến dịch Flash Sale
- **Endpoint**: `PUT /api/v1/flash-sales/:id`
- **Request Body**:
  ```json
  {
    "name": "Flash Sale Tối Thứ 7 (Cập Nhật)",
    "is_active": false
  }
  ```

### 2.4. Xóa chiến dịch Flash Sale
- **Endpoint**: `DELETE /api/v1/flash-sales/:id`

### 2.5. Thêm sản phẩm vào chiến dịch Flash Sale hiện có
- **Endpoint**: `POST /api/v1/flash-sales/:id/items`
- **Request Body**:
  ```json
  {
    "items": [
      {
        "product_id": 3,
        "price": 120000,
        "quantity": 20
      }
    ]
  }
  ```

### 2.6. Loại bỏ sản phẩm khỏi chiến dịch Flash Sale
- **Endpoint**: `DELETE /api/v1/flash-sales/:id/items`
- **Request Body**:
  ```json
  {
    "itemIds": [3]
  }
  ```

---

## 3. API dành cho Khách hàng (Public)

### 3.1. Lấy danh sách các chiến dịch Flash Sale đang diễn ra
- **Endpoint**: `GET /api/v1/flash-sales/active`
- **Description**: Trả về danh sách các chiến dịch Flash Sale có trạng thái `is_active: true` và thời gian hiện tại nằm giữa `start_time` và `end_time`.

### 3.2. Xem chi tiết chiến dịch Flash Sale theo ID
- **Endpoint**: `GET /api/v1/flash-sales/:id`

### 3.3. Filter sản phẩm đang Flash Sale trong danh sách sản phẩm
- **Endpoint**: `GET /api/v1/products?onFlashSale=true`
- **Query Parameter**:
  - `onFlashSale` (boolean, optional): Nếu gửi `true`, hệ thống chỉ trả về các sản phẩm đang có Flash Sale đang diễn ra hoạt động và còn số lượng tồn kho Flash Sale > 0.

---

## 4. Cập Nhật Dữ Liệu Trả Về của Sản Phẩm

Trong các API lấy thông tin sản phẩm (bao gồm `GET /api/v1/products` và `GET /api/v1/products/:id`), hệ thống sẽ trả về thêm thuộc tính `flash_sale`.

### Định dạng thuộc tính `flash_sale`
Nếu sản phẩm có tham gia chương trình Flash Sale đang hoạt động, thuộc tính `flash_sale` sẽ chứa thông tin chi tiết:
```json
{
  "id": 5,
  "name": "Sản phẩm A",
  "base_price": "200.000đ",
  "sale_price": "180.000đ",
  "flash_sale": {
    "id": 1,
    "name": "Flash Sale Hè 2026",
    "price": 150000,
    "quantity": 10,
    "start_time": "2026-06-06T08:00:00.000Z",
    "end_time": "2026-06-06T12:00:00.000Z"
  }
}
```
Nếu sản phẩm không tham gia chương trình Flash Sale hoặc chương trình đã kết thúc/chưa bắt đầu, `flash_sale` sẽ là `null`.

---

## 5. Logic Tạo Đơn Hàng & Giảm Số Lượng Flash Sale

Khi Client gọi API tạo đơn hàng `POST /api/v1/orders`, hệ thống sẽ tự động thực hiện các bước kiểm tra sau trong một Database Transaction:
1. Xác định xem các sản phẩm trong giỏ hàng có đang nằm trong đợt Flash Sale đang diễn ra hay không.
2. Nếu có, áp dụng giá Flash Sale cho sản phẩm đó (giá ưu đãi đặc biệt).
3. Kiểm tra xem số lượng đặt mua có lớn hơn số lượng còn lại của Flash Sale hay không. Nếu vượt quá giới hạn, hệ thống sẽ trả về lỗi `400 Bad Request` chi tiết.
4. Trừ số lượng kho của Flash Sale (`flash_sale_item.quantity`) tương ứng và trừ kho tổng sản phẩm (`product.stock`).
