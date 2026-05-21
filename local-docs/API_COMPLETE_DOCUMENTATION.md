# E-Commerce Backend - Complete API Documentation

**Version:** 1.0.0  
**Last Updated:** May 18, 2026  
**Base URL:** `https://api.ecommerce.tmsherk.id.vn/api/v1`  
**Local Development:** `http://localhost:3000/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Global Response Format](#global-response-format)
3. [Error Handling](#error-handling)
4. [Auth Endpoints](#auth-endpoints)
5. [Product Endpoints](#product-endpoints)
6. [Category Endpoints](#category-endpoints)
7. [Cart Endpoints](#cart-endpoints)
8. [Order Endpoints](#order-endpoints)
9. [User Endpoints](#user-endpoints)
10. [Rate Limiting & Pagination](#rate-limiting--pagination)
11. [Common Query Parameters](#common-query-parameters)

---

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Refresh Strategy

- Access tokens expire after **15 minutes**
- Refresh tokens are sent as httpOnly cookies
- Use the `refresh-token` endpoint to get a new access token

### CORS Configuration

Supported origins:
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)
- `${process.env.FRONTEND_URL}` (production)

**Important:** OAuth2 endpoints (Google login) require browser navigation using `window.location.href`, not `fetch()` due to CORS restrictions.

---

## Global Response Format

### Success Response (200, 201)

```json
{
  "data": { /* response body */ },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response (4xx, 5xx)

```json
{
  "statusCode": 400,
  "message": "Validation error",
  "error": "BAD_REQUEST",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating resource |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic violation |
| 500 | Server Error | Internal server error |

### Common Error Messages

```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid token",
  "error": "UNAUTHORIZED"
}
```

```json
{
  "statusCode": 403,
  "message": "Forbidden - Admin role required",
  "error": "FORBIDDEN"
}
```

---

## Auth Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Access:** Public

**Description:** Register a new user account with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "USER",
      "created_at": "2024-01-15T10:30:00Z"
    }
  },
  "statusCode": 201,
  "message": "Registration successful"
}
```

**Validation Rules:**
- Email must be unique and valid format
- Password must be at least 8 characters
- Full name is optional

---

### 2. Login by Email

**Endpoint:** `POST /auth/login`

**Access:** Public

**Description:** Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200,
  "message": "Login successful"
}
```

**Cookies Set:**
- `Refresh`: Refresh token (httpOnly, secure)

**Error Response (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "UNAUTHORIZED"
}
```

---

### 3. Google OAuth2 Login

**Endpoint:** `GET /auth/google`

**Access:** Public

**Description:** Initiates Google OAuth2 login flow.

**⚠️ Important:** This endpoint must be called via browser navigation, NOT with fetch/AJAX.

**JavaScript Example:**

```javascript
// Correct way - use window.location.href
function loginWithGoogle() {
  window.location.href = '/api/v1/auth/google';
}

// Wrong way - do NOT use fetch
// fetch('/api/v1/auth/google') // ❌ Will cause CORS error
```

**Flow:**
1. User clicks "Login with Google"
2. Browser navigates to `GET /auth/google`
3. Passport redirects to Google's OAuth2 consent screen
4. User authorizes the app
5. Google redirects back to `/auth/google/call-back`
6. App creates/updates user and redirects to frontend with access token

**Callback URL Format:**

```
${FRONTEND_URL}/login/success?accessToken=<JWT_TOKEN>
```

**Environment Variables Required:**
```
OAUTH2_GOOGLE_CLIENT_ID=your_client_id
OAUTH2_GOOGLE_CLIENT_SECRET=your_client_secret
DOMAIN=https://api.ecommerce.tmsherk.id.vn (for callbackURL)
```

---

### 4. Refresh Token

**Endpoint:** `POST /auth/refresh-token`

**Access:** Public (requires refresh token cookie)

**Description:** Get a new access token using refresh token.

**Request:** No body required (refresh token sent as cookie)

**Response (200 OK):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200,
  "message": "Token refreshed successfully"
}
```

**Cookies Set:**
- `Refresh`: New refresh token (httpOnly, secure)

---

### 5. Check Authentication Status

**Endpoint:** `POST /auth/is-authenticated`

**Access:** Protected (requires valid JWT)

**Description:** Verify if user is authenticated and get user info.

**Request:** No body required

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "USER"
  },
  "statusCode": 200
}
```

---

### 6. Logout

**Endpoint:** `DELETE /auth/logout`

**Access:** Protected (requires valid JWT)

**Description:** Logout user and invalidate tokens.

**Request:** No body required

**Response (200 OK):**

```json
{
  "data": {
    "message": "Logout successful"
  },
  "statusCode": 200
}
```

---

## Product Endpoints

### Product Schema

```typescript
{
  id: number;
  name: string;
  description?: string;
  base_price: number;
  sale_price?: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
    path: string;
  };
  warranty?: string;
  specs?: object;
  color?: string[];
  images?: string[];
  stock: number;
  is_active: boolean;
  created_at: string (ISO 8601);
  updated_at: string (ISO 8601);
}
```

---

### 1. Get Products List

**Endpoint:** `GET /products`

**Access:** Public

**Description:** Retrieve paginated list of products with advanced filtering and sorting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max: 100) |
| `search` | string | - | Full-text search in product names |
| `name` | string | - | Exact product name match |
| `category_id` | number | - | Filter by category ID |
| `category_path` | string | - | Filter by category path (hierarchical) |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |
| `onSale` | boolean | - | Filter products on sale (true/false) |
| `sortBy` | enum | created_at | Sort field: `name`, `base_price`, `created_at`, `rating` |
| `sortOrder` | enum | DESC | Sort direction: `ASC`, `DESC` |

**Request Examples:**

```bash
# Get first page with default settings
curl -X GET "http://localhost:3000/api/v1/products"

# Filter by price range and category
curl -X GET "http://localhost:3000/api/v1/products?minPrice=100&maxPrice=1000&category_id=5&sortBy=base_price&sortOrder=ASC"

# Search and filter on sale products
curl -X GET "http://localhost:3000/api/v1/products?search=samsung&onSale=true&limit=20"

# Hierarchical category filtering
curl -X GET "http://localhost:3000/api/v1/products?category_path=electronics/smartphones"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Samsung Galaxy S23",
      "description": "Latest flagship smartphone",
      "base_price": 999.99,
      "sale_price": 899.99,
      "category_id": 5,
      "category": {
        "id": 5,
        "name": "Smartphones",
        "path": "electronics/smartphones"
      },
      "warranty": "12 months",
      "specs": {
        "ram": "8GB",
        "storage": "256GB",
        "display": "6.1 inch AMOLED"
      },
      "color": ["Black", "Silver", "Gold"],
      "images": ["https://example.com/img1.jpg"],
      "stock": 50,
      "is_active": true,
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "statusCode": 200
}
```

---

### 2. Get Product by ID

**Endpoint:** `GET /products/:id`

**Access:** Public

**Path Parameters:**
- `id` (number): Product ID

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/products/1"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "name": "Samsung Galaxy S23",
    "description": "Latest flagship smartphone",
    "base_price": 999.99,
    "sale_price": 899.99,
    "category_id": 5,
    "warranty": "12 months",
    "specs": {
      "ram": "8GB",
      "storage": "256GB",
      "display": "6.1 inch AMOLED",
      "processor": "Snapdragon 8 Gen 2"
    },
    "color": ["Black", "Silver", "Gold"],
    "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    "stock": 50,
    "is_active": true,
    "created_at": "2024-01-10T08:00:00Z"
  },
  "statusCode": 200
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "NOT_FOUND"
}
```

---

### 3. Create Product (Admin)

**Endpoint:** `POST /products`

**Access:** Admin only

**Description:** Create a new product.

**Request Body:**

```json
{
  "name": "Samsung Galaxy S24",
  "description": "Next generation flagship smartphone",
  "base_price": 1099.99,
  "sale_price": 999.99,
  "category_id": 5,
  "warranty": "12 months",
  "specs": "{\"ram\": \"12GB\", \"storage\": \"512GB\", \"display\": \"6.2 inch AMOLED\"}",
  "color": "[\"Black\", \"White\", \"Blue\"]",
  "images": "[\"https://example.com/s24-1.jpg\", \"https://example.com/s24-2.jpg\"]"
}
```

**Field Validations:**
- `name`: Required, max 255 characters
- `base_price`: Required, must be positive number
- `sale_price`: Optional, must be less than base_price
- `category_id`: Required, must exist
- `specs`, `color`, `images`: JSON strings
- `description`, `warranty`: Max 2000 characters

**Response (201 Created):**

```json
{
  "data": {
    "id": 251,
    "name": "Samsung Galaxy S24",
    "description": "Next generation flagship smartphone",
    "base_price": 1099.99,
    "sale_price": 999.99,
    "category_id": 5,
    "warranty": "12 months",
    "specs": {
      "ram": "12GB",
      "storage": "512GB",
      "display": "6.2 inch AMOLED"
    },
    "color": ["Black", "White", "Blue"],
    "images": ["https://example.com/s24-1.jpg"],
    "stock": 0,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201,
  "message": "Product created successfully"
}
```

**Error Response (403):**

```json
{
  "statusCode": 403,
  "message": "Forbidden - Admin role required",
  "error": "FORBIDDEN"
}
```

---

### 4. Update Product (Admin)

**Endpoint:** `PUT /products/:id`

**Access:** Admin only

**Path Parameters:**
- `id` (number): Product ID

**Request Body:** (all fields optional)

```json
{
  "name": "Samsung Galaxy S24 Updated",
  "base_price": 1089.99,
  "sale_price": 989.99,
  "stock": 100,
  "is_active": true
}
```

**Request:**

```bash
curl -X PUT "http://localhost:3000/api/v1/products/251" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price": 1089.99,
    "sale_price": 989.99,
    "stock": 100
  }'
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 251,
    "name": "Samsung Galaxy S24 Updated",
    "base_price": 1089.99,
    "sale_price": 989.99,
    "stock": 100,
    "updated_at": "2024-01-15T14:20:00Z"
  },
  "statusCode": 200,
  "message": "Product updated successfully"
}
```

---

### 5. Delete Product (Admin)

**Endpoint:** `DELETE /products/:id`

**Access:** Admin only

**Path Parameters:**
- `id` (number): Product ID

**Description:** Soft delete product (marks as inactive).

**Request:**

```bash
curl -X DELETE "http://localhost:3000/api/v1/products/251" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 251,
    "message": "Product deleted successfully"
  },
  "statusCode": 200
}
```

---

## Category Endpoints

### Category Schema

```typescript
{
  id: number;
  name: string;
  path: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  created_at: string;
  updated_at: string;
}
```

---

### 1. Get All Categories (Tree)

**Endpoint:** `GET /categories`

**Access:** Public

**Description:** Retrieve complete category hierarchy as tree structure.

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/categories"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "path": "electronics",
      "parent_id": null,
      "children": [
        {
          "id": 5,
          "name": "Smartphones",
          "path": "electronics/smartphones",
          "parent_id": 1,
          "children": [
            {
              "id": 15,
              "name": "Android Phones",
              "path": "electronics/smartphones/android",
              "parent_id": 5,
              "children": []
            },
            {
              "id": 16,
              "name": "iPhones",
              "path": "electronics/smartphones/iphone",
              "parent_id": 5,
              "children": []
            }
          ]
        },
        {
          "id": 6,
          "name": "Laptops",
          "path": "electronics/laptops",
          "parent_id": 1,
          "children": []
        }
      ]
    },
    {
      "id": 2,
      "name": "Fashion",
      "path": "fashion",
      "parent_id": null,
      "children": []
    }
  ],
  "statusCode": 200
}
```

---

### 2. Get Category by ID

**Endpoint:** `GET /categories/:id`

**Access:** Public

**Path Parameters:**
- `id` (number): Category ID

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/categories/5"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "name": "Smartphones",
    "path": "electronics/smartphones",
    "parent_id": 1,
    "parent": {
      "id": 1,
      "name": "Electronics",
      "path": "electronics"
    }
  },
  "statusCode": 200
}
```

---

### 3. Create Category (Admin)

**Endpoint:** `POST /categories`

**Access:** Admin only

**Description:** Create a new category.

**Request Body:**

```json
{
  "name": "Gaming Laptops",
  "parent_id": 6
}
```

**Field Validations:**
- `name`: Required, max 255 characters, unique
- `parent_id`: Optional, must be valid category ID

**Response (201 Created):**

```json
{
  "data": {
    "id": 17,
    "name": "Gaming Laptops",
    "path": "electronics/laptops/gaming",
    "parent_id": 6,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201,
  "message": "Category created successfully"
}
```

---

### 4. Update Category (Admin)

**Endpoint:** `PATCH /categories/:id`

**Access:** Admin only

**Path Parameters:**
- `id` (number): Category ID

**Request Body:**

```json
{
  "name": "Gaming & Performance Laptops",
  "parent_id": 6
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 17,
    "name": "Gaming & Performance Laptops",
    "path": "electronics/laptops/gaming-performance",
    "updated_at": "2024-01-15T14:20:00Z"
  },
  "statusCode": 200,
  "message": "Category updated successfully"
}
```

---

### 5. Delete Category (Admin)

**Endpoint:** `DELETE /categories/:id`

**Access:** Admin only

**Description:** Delete category and its subcategories.

**Response (200 OK):**

```json
{
  "data": {
    "id": 17,
    "message": "Category deleted successfully"
  },
  "statusCode": 200
}
```

---

## Cart Endpoints

### Cart Item Schema

```typescript
{
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
  added_at: string;
}
```

### Cart Schema

```typescript
{
  id: number;
  user_id: number;
  items: CartItem[];
  total_items: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}
```

---

### 1. Get Cart

**Endpoint:** `GET /cart`

**Access:** Protected (requires valid JWT)

**Description:** Get current user's cart with all items.

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/cart" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [
      {
        "id": 101,
        "product_id": 1,
        "product": {
          "id": 1,
          "name": "Samsung Galaxy S23",
          "base_price": 999.99,
          "sale_price": 899.99,
          "images": ["https://example.com/img1.jpg"]
        },
        "quantity": 2,
        "price": 899.99,
        "added_at": "2024-01-15T09:00:00Z"
      },
      {
        "id": 102,
        "product_id": 5,
        "product": {
          "id": 5,
          "name": "iPhone 15 Pro",
          "base_price": 1099.99,
          "sale_price": null,
          "images": ["https://example.com/iphone.jpg"]
        },
        "quantity": 1,
        "price": 1099.99,
        "added_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total_items": 3,
    "total_price": 2799.97,
    "created_at": "2024-01-14T15:00:00Z"
  },
  "statusCode": 200
}
```

---

### 2. Add Item to Cart

**Endpoint:** `POST /cart/items`

**Access:** Protected

**Description:** Add product to cart or increment quantity.

**Request Body:**

```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Field Validations:**
- `product_id`: Required, must be valid product
- `quantity`: Required, must be positive integer, cannot exceed stock

**Response (201 Created):**

```json
{
  "data": {
    "id": 101,
    "product_id": 1,
    "quantity": 2,
    "price": 899.99,
    "added_at": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201,
  "message": "Item added to cart"
}
```

**Error Response (409):**

```json
{
  "statusCode": 409,
  "message": "Insufficient stock. Available: 10",
  "error": "CONFLICT"
}
```

---

### 3. Remove Item from Cart

**Endpoint:** `DELETE /cart/items/:itemId`

**Access:** Protected

**Path Parameters:**
- `itemId` (number): Cart item ID

**Query Parameters:**
- `quantity` (optional, number): Quantity to remove. If not provided, removes entire item.

**Request Examples:**

```bash
# Remove entire item
curl -X DELETE "http://localhost:3000/api/v1/cart/items/101" \
  -H "Authorization: Bearer <TOKEN>"

# Remove only 1 unit (decrement quantity)
curl -X DELETE "http://localhost:3000/api/v1/cart/items/101?quantity=1" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 101,
    "message": "Item removed from cart"
  },
  "statusCode": 200
}
```

---

### 4. Clear Cart

**Endpoint:** `DELETE /cart`

**Access:** Protected

**Description:** Remove all items from cart.

**Response (200 OK):**

```json
{
  "data": {
    "message": "Cart cleared successfully"
  },
  "statusCode": 200
}
```

---

## Order Endpoints

### Order Item Schema

```typescript
{
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
```

### Order Schema

```typescript
{
  id: number;
  user_id: number;
  total_amount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  payment_status: "UNPAID" | "PAID";
  payment_url?: string;
  items: OrderItem[];
  shipping_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

### 1. Get User Orders

**Endpoint:** `GET /orders`

**Access:** Protected

**Description:** Get all orders for current user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (enum): Filter by status (PENDING, COMPLETED, CANCELLED)

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/orders?page=1&limit=20&status=COMPLETED" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "total_amount": 1799.98,
      "status": "COMPLETED",
      "payment_status": "PAID",
      "items": [
        {
          "id": 1,
          "product_id": 1,
          "product_name": "Samsung Galaxy S23",
          "quantity": 2,
          "unit_price": 899.99,
          "subtotal": 1799.98
        }
      ],
      "shipping_address": "123 Main St, New York, NY 10001",
      "notes": "Please deliver before 5 PM",
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T15:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "statusCode": 200
}
```

---

### 2. Get Order by ID

**Endpoint:** `GET /orders/:id`

**Access:** Protected

**Path Parameters:**
- `id` (number): Order ID

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/orders/1" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "total_amount": 1799.98,
    "status": "COMPLETED",
    "payment_status": "PAID",
    "payment_url": "https://payment.gateway.com/pay/abc123",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Samsung Galaxy S23",
        "quantity": 2,
        "unit_price": 899.99,
        "subtotal": 1799.98
      }
    ],
    "shipping_address": "123 Main St, New York, NY 10001",
    "notes": "Please deliver before 5 PM",
    "created_at": "2024-01-15T09:00:00Z"
  },
  "statusCode": 200
}
```

---

### 3. Create Order

**Endpoint:** `POST /orders`

**Access:** Protected

**Description:** Create new order from cart items (cart will be cleared).

**Request Body:**

```json
{
  "shipping_address": "123 Main St, New York, NY 10001",
  "notes": "Please deliver before 5 PM"
}
```

**Field Validations:**
- `shipping_address`: Required, max 500 characters
- `notes`: Optional, max 2000 characters
- Cart must have at least 1 item
- All products must have sufficient stock

**Response (201 Created):**

```json
{
  "data": {
    "id": 5,
    "user_id": 1,
    "total_amount": 2899.98,
    "status": "PENDING",
    "payment_status": "UNPAID",
    "payment_url": "https://payment.gateway.com/pay/xyz789",
    "items": [
      {
        "id": 3,
        "product_id": 1,
        "product_name": "Samsung Galaxy S23",
        "quantity": 2,
        "unit_price": 899.99,
        "subtotal": 1799.98
      },
      {
        "id": 4,
        "product_id": 5,
        "product_name": "iPhone 15 Pro",
        "quantity": 1,
        "unit_price": 1099.99,
        "subtotal": 1099.99
      }
    ],
    "shipping_address": "123 Main St, New York, NY 10001",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201,
  "message": "Order created successfully"
}
```

**Error Response (409):**

```json
{
  "statusCode": 409,
  "message": "Cart is empty",
  "error": "CONFLICT"
}
```

---

### 4. Cancel Order

**Endpoint:** `POST /orders/:id/cancel`

**Access:** Protected

**Path Parameters:**
- `id` (number): Order ID

**Description:** Cancel pending order and restore stock.

**Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "status": "CANCELLED",
    "message": "Order cancelled successfully"
  },
  "statusCode": 200
}
```

**Error Response (409):**

```json
{
  "statusCode": 409,
  "message": "Cannot cancel completed order",
  "error": "CONFLICT"
}
```

---

### 5. Regenerate Payment URL

**Endpoint:** `POST /orders/:id/regenerate-payment-url`

**Access:** Protected

**Path Parameters:**
- `id` (number): Order ID

**Description:** Generate new payment URL for pending order.

**Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "payment_url": "https://payment.gateway.com/pay/new123",
    "status": "PENDING"
  },
  "statusCode": 200,
  "message": "Payment URL regenerated"
}
```

---

### 6. Update Order (User)

**Endpoint:** `PUT /orders/:id`

**Access:** Protected (user's own order)

**Path Parameters:**
- `id` (number): Order ID

**Description:** Update order shipping address and notes.

**Request Body:**

```json
{
  "shipping_address": "456 New Avenue, New York, NY 10002",
  "notes": "Updated delivery instructions"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "shipping_address": "456 New Avenue, New York, NY 10002",
    "notes": "Updated delivery instructions",
    "updated_at": "2024-01-15T14:20:00Z"
  },
  "statusCode": 200,
  "message": "Order updated successfully"
}
```

---

### 7. Update Order (Admin)

**Endpoint:** `PUT /orders/admin/:id`

**Access:** Admin only

**Path Parameters:**
- `id` (number): Order ID

**Description:** Admin can update order status and payment status.

**Request Body:**

```json
{
  "status": "COMPLETED",
  "payment_status": "PAID",
  "shipping_address": "Updated address",
  "notes": "Shipped via Express"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "status": "COMPLETED",
    "payment_status": "PAID",
    "updated_at": "2024-01-15T14:20:00Z"
  },
  "statusCode": 200,
  "message": "Order updated successfully"
}
```

---

## User Endpoints

### User Schema

```typescript
{
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  role: "USER" | "ADMIN";
  created_at: string;
  updated_at: string;
}
```

---

### Update User Profile

**Endpoint:** `PATCH /users`

**Access:** Protected

**Description:** Update authenticated user's profile information.

**Request Body:** (all fields optional)

```json
{
  "full_name": "John Doe",
  "phone": "+1-555-0123",
  "address": "123 Main St, New York, NY 10001",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Field Validations:**
- `full_name`: Max 255 characters
- `phone`: Valid phone format
- `address`: Max 500 characters
- `avatar_url`: Valid URL format

**Request:**

```bash
curl -X PATCH "http://localhost:3000/api/v1/users" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone": "+1-555-0123"
  }'
```

**Response (200 OK):**

```json
{
  "data": {
    "message": "Update successful"
  },
  "statusCode": 200
}
```

---

## Rate Limiting & Pagination

### Pagination

All list endpoints support pagination with these query parameters:

```
GET /products?page=1&limit=20&sortBy=name&sortOrder=ASC
```

**Pagination Response:**

```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Default Limits

| Resource | Default Limit | Max Limit |
|----------|---------------|-----------|
| Products | 10 | 100 |
| Orders | 10 | 50 |
| Categories | 20 | N/A |

### Rate Limiting

Currently no rate limiting implemented. Production deployment should implement:

- **General API:** 100 requests/minute per IP
- **Auth endpoints:** 5 attempts/minute per IP
- **Payment endpoints:** 10 requests/minute per user

---

## Common Query Parameters

### Search & Filter

```bash
# Full-text search
GET /products?search=samsung

# Exact match
GET /products?name=Samsung Galaxy S23

# Category filter
GET /products?category_id=5

# Price range
GET /products?minPrice=100&maxPrice=1000

# Multiple filters combined
GET /products?search=samsung&category_id=5&minPrice=500&maxPrice=1500&onSale=true
```

### Sorting

```bash
# Sort by price ascending
GET /products?sortBy=base_price&sortOrder=ASC

# Sort by creation date descending
GET /products?sortBy=created_at&sortOrder=DESC

# Sort by name
GET /products?sortBy=name&sortOrder=ASC
```

### Pagination

```bash
# Get 50 items from page 3
GET /products?page=3&limit=50

# Specific page
GET /orders?page=2&limit=20
```

---

## Development Guidelines

### Environment Variables

```env
# Server
NODE_ENV=development
SERVER_PORT=3000
DOMAIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=900  # 15 minutes in seconds

# OAuth2 Google
OAUTH2_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH2_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# I18n
DEFAULT_LANGUAGE=en
```

### Running Locally

```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Seed data
npm run seed

# Start dev server
npm run start:dev

# Build
npm run build

# Production
npm run start:prod
```

---

## Support & Contact

For API issues or questions:

1. Check the error message and status code
2. Review this documentation
3. Verify all required fields are provided
4. Ensure valid JWT token for protected endpoints
5. Check CORS configuration for frontend

**Documentation Last Updated:** May 18, 2026  
**API Version:** 1.0.0
