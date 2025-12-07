# API Pagination and Filters Documentation

## Overview

All list endpoints now support pagination and filtering. Responses with pagination have the following structure:

```json
{
  "data": ...,
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

## Endpoints

### 1. GET /sellers

**Pagination Parameters:**
- `page` (int, default: 1, min: 1) - Page number
- `page_size` (int, default: 20, min: 1) - Number of items per page

**Filter Parameters:**
- `status` (int, optional, min: 0) - Filter by seller status
- `verification_level` (int, optional, min: 0) - Filter by verification level

**Example:**
```
GET /sellers?page=1&page_size=20&status=1&verification_level=2
```

---

### 2. GET /shop-points

**Pagination Parameters:**
- `page` (int, default: 1, min: 1) - Page number
- `page_size` (int, default: 20, min: 1) - Number of items per page

**Filter Parameters:**
- `region` (string, optional) - Filter by region (exact match)
- `city` (string, optional) - Filter by city (exact match)
- `seller_id` (int, optional, min: 1) - Filter by seller ID
- `min_latitude` (float, optional) - Minimum latitude
- `max_latitude` (float, optional) - Maximum latitude
- `min_longitude` (float, optional) - Minimum longitude
- `max_longitude` (float, optional) - Maximum longitude

**Example:**
```
GET /shop-points?page=1&page_size=20&region=Московская область&city=Москва&min_latitude=55.0&max_latitude=56.0
```

---

### 3. GET /products

**Pagination Parameters:**
- `page` (int, default: 1, min: 1) - Page number
- `page_size` (int, default: 20, min: 1) - Number of items per page

**Filter Parameters:**
- `article` (string, optional) - Filter by article (exact match)
- `code` (string, optional) - Filter by code (exact match)
- `seller_id` (int, optional, min: 1) - Filter by seller ID

**Example:**
```
GET /products?page=1&page_size=20&article=ART123&seller_id=1
```

---

### 4. GET /offers

**Pagination Parameters:**
- `page` (int, default: 1, min: 1) - Page number
- `page_size` (int, default: 20, min: 1) - Number of items per page

**Filter Parameters:**
- `product_id` (int, optional, min: 1) - Filter by product ID
- `seller_id` (int, optional, min: 1) - Filter by seller ID (via product)
- `shop_id` (int, optional, min: 1) - Filter by shop point ID
- `min_expires_date` (datetime, optional) - Minimum expiration date
- `max_expires_date` (datetime, optional) - Maximum expiration date
- `min_original_cost` (float, optional, min: 0) - Minimum original cost
- `max_original_cost` (float, optional, min: 0) - Maximum original cost
- `min_current_cost` (float, optional, min: 0) - Minimum current cost
- `max_current_cost` (float, optional, min: 0) - Maximum current cost
- `min_count` (int, optional, min: 0) - Minimum product count

**Example:**
```
GET /offers?page=1&page_size=20&seller_id=1&min_current_cost=100&max_current_cost=500&min_count=5
```

---

### 5. GET /purchases

**Pagination Parameters:**
- `page` (int, default: 1, min: 1) - Page number
- `page_size` (int, default: 20, min: 1) - Number of items per page

**Filter Parameters:**
- `status` (string, optional) - Filter by purchase status (pending, confirmed, cancelled, completed)
- `user_id` (int, optional, min: 1) - Filter by user ID (defaults to current user if not specified)
- `min_created_at` (datetime, optional) - Minimum creation date
- `max_created_at` (datetime, optional) - Maximum creation date
- `min_updated_at` (datetime, optional) - Minimum update date
- `max_updated_at` (datetime, optional) - Maximum update date

**Example:**
```
GET /purchases?page=1&page_size=20&status=completed&min_created_at=2024-01-01T00:00:00&max_created_at=2024-12-31T23:59:59
```

**Note:** If `user_id` is not specified, the endpoint automatically filters by the current authenticated user's purchases.

---

## Response Format

All paginated endpoints return responses in the following format:

```json
{
  "data": ...,
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

### Pagination Fields

- `page` - Current page number
- `page_size` - Number of items per page
- `total_items` - Total number of items matching the filters
- `total_pages` - Total number of pages
- `has_next` - Whether there is a next page
- `has_previous` - Whether there is a previous page

---

## Notes

- All filter parameters are optional. If not specified, all items are returned (subject to pagination).
- Multiple filters can be combined - they are applied with AND logic.
- Date/time filters use ISO 8601 format (e.g., `2024-01-01T00:00:00`).
- All endpoints maintain backward compatibility - existing clients will continue to work, but will receive paginated responses.
