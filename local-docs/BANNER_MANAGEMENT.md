# Banner Management API

## Overview
Hệ thống quản lý banner cho trang chủ và các trang chiến dịch khuyến mãi.

## Endpoints

### 1. Get Active Banners (Public)
**GET** `/banners`

Lấy danh sách tất cả các banner đang hoạt động và trong khoảng thời gian hiển thị.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Khuyến mãi hè 2024",
    "description": "Giảm giá đến 50% cho tất cả sản phẩm",
    "image_url": "http://localhost:3000/uploads/banner1.jpg",
    "redirect_url": "http://localhost:3000/sale/summer-2024",
    "sort_order": 1,
    "is_active": true,
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-08-31T23:59:59Z",
    "created_at": "2024-06-01T10:00:00Z",
    "updated_at": "2024-06-01T10:00:00Z"
  }
]
```

### 2. Get All Banners (Admin Only)
**GET** `/banners/admin/all`

Lấy danh sách tất cả các banner (bao gồm cả inactive và expired).

**Authorization:** JWT Token with Admin role required

**Response:**
```json
[
  {
    "id": 1,
    "title": "Khuyến mãi hè 2024",
    "description": "Giảm giá đến 50% cho tất cả sản phẩm",
    "image_url": "http://localhost:3000/uploads/banner1.jpg",
    "redirect_url": "http://localhost:3000/sale/summer-2024",
    "sort_order": 1,
    "is_active": true,
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-08-31T23:59:59Z",
    "created_at": "2024-06-01T10:00:00Z",
    "updated_at": "2024-06-01T10:00:00Z"
  },
  {
    "id": 2,
    "title": "Banner đã hết hạn",
    "description": "Không còn hoạt động",
    "image_url": "http://localhost:3000/uploads/banner2.jpg",
    "redirect_url": null,
    "sort_order": 2,
    "is_active": false,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-28T23:59:59Z",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-02-28T10:00:00Z"
  }
]
```

### 3. Get Banner by ID (Public)
**GET** `/banners/:id`

Lấy chi tiết của một banner cụ thể.

**Parameters:**
- `id` (path parameter, number): ID của banner

**Response:**
```json
{
  "id": 1,
  "title": "Khuyến mãi hè 2024",
  "description": "Giảm giá đến 50% cho tất cả sản phẩm",
  "image_url": "http://localhost:3000/uploads/banner1.jpg",
  "redirect_url": "http://localhost:3000/sale/summer-2024",
  "sort_order": 1,
  "is_active": true,
  "start_date": "2024-06-01T00:00:00Z",
  "end_date": "2024-08-31T23:59:59Z",
  "created_at": "2024-06-01T10:00:00Z",
  "updated_at": "2024-06-01T10:00:00Z"
}
```

### 4. Create Banner (Admin Only)
**POST** `/banners`

Tạo một banner mới bằng cách upload file ảnh lên server.

**Authorization:** JWT Token with Admin role required

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `title` (string, bắt buộc): Tiêu đề banner
- `description` (string, bắt buộc): Mô tả banner
- `image` (file, bắt buộc): File hình ảnh banner (hỗ trợ png, jpg, jpeg, webp tối đa 5MB)
- `redirect_url` (string, optional): Đường dẫn điều hướng khi click
- `sort_order` (number, optional): Thứ tự hiển thị
- `is_active` (boolean, optional): Trạng thái hoạt động (`true` hoặc `false`)
- `start_date` (ISO Date string, optional): Ngày bắt đầu hiển thị
- `end_date` (ISO Date string, optional): Ngày kết thúc hiển thị

**Response:**
```json
{
  "id": 1,
  "title": "Khuyến mãi hè 2024",
  "description": "Giảm giá đến 50% cho tất cả sản phẩm",
  "image_url": "http://localhost:3000/uploads/banner1.jpg",
  "redirect_url": "http://localhost:3000/sale/summer-2024",
  "sort_order": 1,
  "is_active": true,
  "start_date": "2024-06-01T00:00:00Z",
  "end_date": "2024-08-31T23:59:59Z",
  "created_at": "2024-06-01T10:00:00Z",
  "updated_at": "2024-06-01T10:00:00Z"
}
```

### 5. Update Banner (Admin Only)
**PUT** `/banners/:id`

Cập nhật thông tin banner, hỗ trợ upload đè hình ảnh mới (khi upload ảnh mới, hệ thống tự động xóa file ảnh cũ khỏi server).

**Authorization:** JWT Token with Admin role required

**Content-Type:** `multipart/form-data`

**Parameters:**
- `id` (path parameter, number): ID của banner

**Request Body (Form Data - tất cả fields optional):**
- `title` (string): Tiêu đề banner
- `description` (string): Mô tả banner
- `image` (file): File hình ảnh banner mới (nếu muốn thay đổi ảnh)
- `redirect_url` (string): Đường dẫn điều hướng
- `sort_order` (number): Thứ tự hiển thị
- `is_active` (boolean): Trạng thái hoạt động
- `start_date` (ISO Date string): Ngày bắt đầu hiển thị
- `end_date` (ISO Date string): Ngày kết thúc hiển thị

**Response:**
```json
{
  "message": "Banner updated successfully"
}
```

### 6. Delete Banner (Admin Only)
**DELETE** `/banners/:id`

Xóa một banner.

**Authorization:** JWT Token with Admin role required

**Parameters:**
- `id` (path parameter, number): ID của banner

**Response:**
```json
{
  "message": "Banner deleted successfully"
}
```

## Data Model

### BannerEntity
```typescript
{
  id: number;                    // Banner ID (auto-generated)
  title: string;                 // Banner title
  description: string;           // Banner description
  image_url: string;             // Banner image URL
  redirect_url?: string;         // URL to redirect when clicked
  sort_order: number;            // Sort order (0, 1, 2, ...)
  is_active: boolean;            // Whether banner is active
  start_date?: Date;             // Start date for displaying
  end_date?: Date;               // End date for displaying
  created_at: Date;              // Created timestamp
  updated_at: Date;              // Last updated timestamp
  deleted_at?: Date;             // Soft delete timestamp
}
```

## Features

### 1. Date Range Filtering
- Banners có thể được thiết lập với khoảng thời gian hiển thị
- Chỉ banners trong khoảng thời gian hiển thị mới được trả về khi call `/banners`

### 2. Sort Order
- Banners được sắp xếp theo `sort_order` tăng dần
- Cho phép kiểm soát thứ tự hiển thị trên frontend

### 3. Active/Inactive Status
- Có thể vô hiệu hóa banner mà không cần xóa
- Inactive banners chỉ hiển thị trong admin view

### 4. Soft Delete
- Banners được soft delete (không xóa vật lý khỏi database)
- Thông tin lịch sử được giữ lại

## Architecture

```
BannerController
    ↓
BannerUsecases (business logic)
    ↓
BannerRepository (data access)
    ↓
BannerEntity (database model)
```

## Implementation Details

### Files Created/Modified
- `/src/domain/repositories/banner-repository.interface.ts` - Repository interface
- `/src/infrastructure/repositories/banner.repository.ts` - Repository implementation
- `/src/infrastructure/entities/banner.entity.ts` - Updated with proper BaseEntity extension
- `/src/infrastructure/controllers/banner/banner.dto.ts` - Request/Response DTOs
- `/src/infrastructure/controllers/banner/banner.controller.ts` - Controller endpoints
- `/src/usecases/banner/banner.usecases.ts` - Business logic
- `/src/infrastructure/usecases-proxy/providers/banner-usecases.provider.ts` - DI provider
- `/src/infrastructure/usecases-proxy/modules/index.ts` - Added BANNER_USECASES
- `/src/infrastructure/repositories/repositories.module.ts` - Added BannerRepository
- `/src/infrastructure/controllers/controllers.module.ts` - Added BannerController

## Usage Examples

### Example 1: Get active banners
```bash
curl -X GET http://localhost:3000/banners
```

### Example 2: Create a banner (admin only)
```bash
curl -X POST http://localhost:3000/banners \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "title=Summer Sale 2024" \
  -F "description=Up to 50% off" \
  -F "image=@/path/to/your/image.jpg" \
  -F "redirect_url=http://localhost:3000/sale/summer" \
  -F "sort_order=1" \
  -F "is_active=true" \
  -F "start_date=2024-06-01T00:00:00Z" \
  -F "end_date=2024-08-31T23:59:59Z"
```

### Example 3: Update banner (admin only)
```bash
curl -X PUT http://localhost:3000/banners/1 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "is_active=false" \
  -F "image=@/path/to/new-image.png"
```

### Example 4: Delete banner (admin only)
```bash
curl -X DELETE http://localhost:3000/banners/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Error Handling

### Banner Not Found
**Status Code:** 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Banner not found",
  "error": "Bad Request"
}
```

## Authentication & Authorization

- Endpoints `/banners` (GET) and `/banners/:id` (GET) - **Public** (no auth required)
- Endpoint `/banners/admin/all` (GET) - **Admin only**
- Endpoints for POST, PUT, DELETE - **Admin only**

## Testing

Run tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```
