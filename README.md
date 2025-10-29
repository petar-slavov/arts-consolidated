# Arts Consolidated

A product catalog service built with Node.js, MySQL, and Elasticsearch, featuring data from DummyJSON API.

## Running Locally

### Prerequisites

- Docker Desktop

### Docker Setup

To start the infrastructure:
```bash
docker compose up
```

The application will be available at http://localhost:3000

## Architecture and Design Decisions

### Technology Choices

- **TypeScript**: Provides type safety and better IDE support
- **MySQL**: Offers ACID compliance and relational data modeling
- **Elasticsearch**: Enables full-text search and complex querying

### Trade-offs to simplify development

- Used a one-time sync with DummyJSON API. Changes to the source data will not be reflected.
- Secrets in plain text in .env
- Hardcoded pagination limits
- Limited error handling
- Basic input validation only
- Few tests
- Single instance deployment only
- No caching layer implemented

## API Endpoints

The Node.js application runs on `http://localhost:3000`

### Health Check

```bash
GET http://localhost:3000/health
```

### Get All Products
```bash
GET http://localhost:3000/products?q={search_query}&category={category}&brand={brand}&min_price={min_price}&max_price={max_price}&limit={limit}&offset={offset}
```
##### Examples:
```bash
# Basic - get all products
curl http://localhost:3000/products

# With filters and pagination
curl http://localhost:3000/products?category=beauty&limit=10&offset=0
curl http://localhost:3000/products?brand=Apple&min_price=500&max_price=2000
```

### Get Product by ID

```bash
GET http://localhost:3000/products/{id}
```
##### Examples:
```bash
curl http://localhost:3000/products/1
```

### Get All Categories

```bash
GET http://localhost:3000/categories
```

### Get Product Aggregations

```bash
GET http://localhost:3000/product-aggs?q={search_query}&category={category}&brand={brand}&min_price={min_price}&max_price={max_price}
```
##### Examples:
```bash
# Basic - get all product aggregations
curl http://localhost:3000/product-aggs

# With filters
curl http://localhost:3000/product-aggs?category=beauty
curl http://localhost:3000/product-aggs?brand=Apple&min_price=500&max_price=2000
```