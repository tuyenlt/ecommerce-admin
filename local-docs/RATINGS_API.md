# API Ratings Documentation

## Giới thiệu

API Ratings cung cấp các endpoint để quản lý đánh giá và nhận xét sản phẩm.

## Yêu cầu chung

- **Authentication**: Yêu cầu token JWT hợp lệ đối với các hành động bảo mật (ví dụ: xóa đánh giá)
- **Header**: `Authorization: Bearer <token>` (khi có yêu cầu đăng nhập)

## Base URL

```
http://localhost:3000/api/v1/ratings
```

---

## Endpoints

### 1. Lấy danh sách đánh giá cho Admin

**GET** `/admin`

Lấy danh sách tất cả các đánh giá sản phẩm có phân trang để phục vụ cho giao diện quản trị (Admin Dashboard) hoặc kiểm duyệt đánh giá. Endpoint này trả về thông tin chi tiết của đánh giá kèm theo thông tin của sản phẩm và người dùng đã đánh giá.

#### Yêu cầu bổ sung:
- **Authorization**: Chỉ user có role `ADMIN` mới có quyền truy cập.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | No | Số trang cần lấy (mặc định: 1) |
| limit | number | No | Số lượng bản ghi trên mỗi trang (mặc định: 10, tối đa: 100) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/ratings/admin?page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "product_id": 12,
      "user_id": 5,
      "rating": 5,
      "comment": "Sản phẩm dùng rất tốt, giao hàng nhanh!",
      "model_rating": 4,
      "product": {
        "id": 12,
        "name": "Nồi chiên không dầu Philips NA130/00",
        "images": ["https://example.com/philips1.jpg"]
      },
      "user": {
        "id": 5,
        "full_name": "Nguyen Van A",
        "phone": "0987654321"
      },
      "created_at": "2026-06-03T10:30:00.000Z",
      "updated_at": "2026-06-03T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "statusCode": 200
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| id | number | ID của đánh giá |
| product_id | number | ID của sản phẩm được đánh giá |
| user_id | number | ID của người dùng thực hiện đánh giá |
| rating | number | Số sao đánh giá (1-5) |
| comment | string | Nội dung nhận xét |
| model_rating | number | Điểm đánh giá tự động từ mô hình AI (phân tích sắc thái) |
| product | object | Thông tin thu gọn của sản phẩm được đánh giá |
| user | object | Thông tin thu gọn của người dùng đã viết đánh giá |

---

### 2. Xóa đánh giá

**DELETE** `/:id`

Xóa đánh giá sản phẩm dựa theo ID. Người dùng chỉ có quyền xóa đánh giá do chính mình viết, ngoại trừ người dùng có role `ADMIN` có thể xóa bất kỳ đánh giá nào.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | ID của đánh giá cần xóa (Path parameter) |

#### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/v1/ratings/1" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Response (200 OK)

```json
{
  "data": {
    "message": "Rating deleted successfully"
  },
  "statusCode": 200
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Nguyên nhân**: Token JWT không hợp lệ hoặc đã hết hạn.

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

**Nguyên nhân**: Truy cập vào endpoint Admin nhưng tài khoản không có role `ADMIN`.

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "You do not have permission to delete this rating",
  "error": "BAD_REQUEST"
}
```

**Nguyên nhân**: Người dùng cố tình xóa đánh giá của người khác khi không phải là Admin, hoặc ID đánh giá truyền vào không tồn tại.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-04 | Initial release |
