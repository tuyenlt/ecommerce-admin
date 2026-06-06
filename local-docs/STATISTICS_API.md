# API Statistics Documentation

## Giới thiệu

API Statistics cung cấp các endpoint thống kê doanh thu, đơn hàng, sản phẩm bán chạy và tổng số sản phẩm. Tất cả endpoints đều yêu cầu authentication và chỉ admin mới có quyền truy cập.

## Yêu cầu

- **Authentication**: Cần token JWT hợp lệ
- **Authorization**: Chỉ user có role `ADMIN` mới có quyền truy cập
- **Header**: `Authorization: Bearer <token>`

## Base URL

```
http://localhost:3000/api/v1/stats
```

---

## Endpoints

### 1. Doanh Thu Theo Tháng

**GET** `/revenue-by-month`

Lấy thống kê doanh thu hàng tháng theo năm.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | number | No | Năm cần thống kê (mặc định: năm hiện tại) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/stats/revenue-by-month?year=2026" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
[
  {
    "month": 1,
    "revenue": 1250000,
    "order_count": 15
  },
  {
    "month": 2,
    "revenue": 2350000,
    "order_count": 22
  },
  {
    "month": 5,
    "revenue": 3100000,
    "order_count": 28
  }
]
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| month | number | Tháng (1-12) |
| revenue | number | Tổng doanh thu (đơn vị: VND) |
| order_count | number | Số lượng đơn hàng hoàn thành |

---

### 2. Đơn Hàng Theo Tháng

**GET** `/orders-by-month`

Lấy thống kê đơn hàng hàng tháng với các trạng thái khác nhau.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | number | No | Năm cần thống kê (mặc định: năm hiện tại) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/stats/orders-by-month?year=2026" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
[
  {
    "month": 1,
    "total_orders": 20,
    "completed_orders": 15,
    "cancelled_orders": 2,
    "unpaid_orders": 3
  },
  {
    "month": 2,
    "total_orders": 25,
    "completed_orders": 22,
    "cancelled_orders": 1,
    "unpaid_orders": 2
  }
]
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| month | number | Tháng (1-12) |
| total_orders | number | Tổng số đơn hàng |
| completed_orders | number | Số đơn hàng hoàn thành |
| cancelled_orders | number | Số đơn hàng bị hủy |
| unpaid_orders | number | Số đơn hàng chưa thanh toán |

---

### 3. Sản Phẩm Bán Chạy Theo Tháng

**GET** `/top-selling-products`

Lấy danh sách sản phẩm bán chạy nhất trong tháng.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | number | No | Năm (mặc định: năm hiện tại) |
| month | number | No | Tháng (mặc định: tháng hiện tại) |
| limit | number | No | Giới hạn số sản phẩm (mặc định: 10) |

#### Example Request

```bash
# Top 10 sản phẩm bán chạy tháng hiện tại
curl -X GET "http://localhost:3000/api/v1/stats/top-selling-products" \
  -H "Authorization: Bearer <token>"

# Top 20 sản phẩm tháng 6 năm 2026
curl -X GET "http://localhost:3000/api/v1/stats/top-selling-products?year=2026&month=6&limit=20" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
[
  {
    "product_id": 1,
    "product_name": "iPhone 14 Pro",
    "total_quantity": 45,
    "total_revenue": 45000000,
    "times_sold": 15
  },
  {
    "product_id": 2,
    "product_name": "Samsung Galaxy S24",
    "total_quantity": 38,
    "total_revenue": 38000000,
    "times_sold": 12
  },
  {
    "product_id": 3,
    "product_name": "iPad Air",
    "total_quantity": 28,
    "total_revenue": 28000000,
    "times_sold": 9
  }
]
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| product_id | number | ID sản phẩm |
| product_name | string | Tên sản phẩm |
| total_quantity | number | Tổng số lượng bán |
| total_revenue | number | Tổng doanh thu từ sản phẩm này |
| times_sold | number | Số lần sản phẩm được bán |

---

### 4. Tổng Số Sản Phẩm

**GET** `/total-products`

Lấy tổng số sản phẩm trong hệ thống.

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/stats/total-products" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
  "total_products": 150
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| total_products | number | Tổng số sản phẩm chưa xóa |

---

### 5. Dashboard Tổng Hợp

**GET** `/dashboard`

Lấy tất cả thống kê tổng hợp cho dashboard.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | number | No | Năm cần thống kê (mặc định: năm hiện tại) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/stats/dashboard?year=2026" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
  "summary": {
    "total_products": 150,
    "current_month_revenue": 3100000,
    "current_month_orders": 28
  },
  "revenue_by_month": [
    {
      "month": 1,
      "revenue": 1250000,
      "order_count": 15
    },
    {
      "month": 2,
      "revenue": 2350000,
      "order_count": 22
    }
  ],
  "orders_by_month": [
    {
      "month": 1,
      "total_orders": 20,
      "completed_orders": 15,
      "cancelled_orders": 2,
      "unpaid_orders": 3
    }
  ],
  "top_selling_products": [
    {
      "product_id": 1,
      "product_name": "iPhone 14 Pro",
      "total_quantity": 45,
      "total_revenue": 45000000,
      "times_sold": 15
    }
  ]
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| summary | object | Tóm tắt các chỉ số chính |
| summary.total_products | number | Tổng số sản phẩm |
| summary.current_month_revenue | number | Doanh thu tháng hiện tại |
| summary.current_month_orders | number | Số đơn hàng tháng hiện tại |
| revenue_by_month | array | Doanh thu theo từng tháng (xem #1) |
| orders_by_month | array | Đơn hàng theo từng tháng (xem #2) |
| top_selling_products | array | Sản phẩm bán chạy (xem #3) |

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

**Nguyên nhân**: User không có role `ADMIN`.

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid year parameter"
}
```

**Nguyên nhân**: Parameter không hợp lệ (ví dụ: year không phải số).

---

## Examples

### JavaScript/Axios

```javascript
import axios from 'axios';

const token = 'your_jwt_token_here';
const baseURL = 'http://localhost:3000/api/v1/stats';

// Get revenue by month
async function getRevenueStats() {
  try {
    const response = await axios.get(`${baseURL}/revenue-by-month?year=2026`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Revenue:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Get dashboard stats
async function getDashboard() {
  try {
    const response = await axios.get(`${baseURL}/dashboard?year=2026`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Dashboard:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Get top selling products with custom limit
async function getTopProducts() {
  try {
    const response = await axios.get(`${baseURL}/top-selling-products`, {
      params: {
        year: 2026,
        month: 6,
        limit: 20
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Top Products:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

getRevenueStats();
getDashboard();
getTopProducts();
```

### Python/Requests

```python
import requests

token = 'your_jwt_token_here'
base_url = 'http://localhost:3000/api/v1/stats'
headers = {
    'Authorization': f'Bearer {token}'
}

# Get revenue by month
response = requests.get(
    f'{base_url}/revenue-by-month?year=2026',
    headers=headers
)
print('Revenue:', response.json())

# Get dashboard
response = requests.get(
    f'{base_url}/dashboard?year=2026',
    headers=headers
)
print('Dashboard:', response.json())

# Get top products
params = {
    'year': 2026,
    'month': 6,
    'limit': 20
}
response = requests.get(
    f'{base_url}/top-selling-products',
    params=params,
    headers=headers
)
print('Top Products:', response.json())
```

---

## Lưu ý

1. **Chỉ số doanh thu**: Tính từ các đơn hàng có trạng thái `preparing`, `shipping`, hoặc `delivered`
2. **Thời gian**: Sử dụng `created_at` của đơn hàng để xác định tháng/năm
3. **Dữ liệu xóa mềm**: Không tính các bản ghi bị xóa mềm (deleted_at IS NOT NULL)
4. **Ngôn ngữ**: Tất cả phản hồi đều là tiếng Anh theo chuẩn API

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-02 | Initial release |
