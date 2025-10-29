# Arts Consolidated

A product catalog service built with Node.js, MySQL, and Elasticsearch, featuring data from DummyJSON API.

## Running Locally

### Prerequisites
- Docker Desktop
- Docker Compose

### Docker Setup

1. Start the infrastructure:
```bash
docker compose up
```


The application will be available at http://localhost:3000


## Architecture and Design Decisions

### Technology Choices
- **TypeScript**: Provides type safety and better IDE support
- **MySQL**: Offers ACID compliance and relational data modeling
- **Elasticsearch**: Enables full-text search and complex querying

### Trade-offs Made

1. Data Synchronization
- Used a simple periodic sync with DummyJSON API
- Trade-off: Eventual consistency vs real-time updates
- Rationale: Simplified implementation, reduced complexity

2. Docker Development
- Mounted source files for hot-reload
- Trade-off: Slightly slower startup vs easier development
- Rationale: Developer experience prioritized

3. Security
- Basic auth credentials in docker-compose
- Trade-off: Ease of setup vs production-ready security
- Rationale: Development environment focus

## Known Limitations

1. Performance
- No caching layer implemented
- Full table scans for complex filters
- Elasticsearch reindexing blocks API calls

2. Scalability
- Single instance deployment only
- No horizontal scaling support
- Data synchronization not distributed

3. Development
- No integration tests
- Limited error handling
- Basic input validation only

### API Endpoints

The Node.js application runs on `http://localhost:3000`

### Health Check
```bash
GET http://localhost:3000/health
```

### Get All Products
```bash
# Basic - get all products
GET http://localhost:3000/products

# With filters and pagination
GET http://localhost:3000/products?category=beauty&limit=10&offset=0
GET http://localhost:3000/products?brand=Apple&min_price=500&max_price=2000
```

### Get Product by ID
```bash
GET http://localhost:3000/products/1
```

### Get All Categories
```bash
GET http://localhost:3000/categories
```

### Search Products (Elasticsearch)
```bash
# Basic search
GET http://localhost:3000/search/products?q=phone

# Search with filters
GET http://localhost:3000/search/products?q=beauty&category=beauty&min_price=10&max_price=50
```

## 🧪 Testing the Setup

1. Start the services:
   ```bash
   docker compose up
   ```

2. Wait for all services to be healthy and products to be loaded (check logs for "Successfully loaded X products")

3. Test the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

4. Get all products:
   ```bash
   curl http://localhost:3000/products
   ```

5. Get a specific product:
   ```bash
   curl http://localhost:3000/products/1
   ```

6. Search for products:
   ```bash
   curl "http://localhost:3000/search/products?q=phone"
   ```

7. Get categories:
   ```bash
   curl http://localhost:3000/categories
   ```

8. Filter by category:
   ```bash
   curl "http://localhost:3000/products?category=beauty&limit=5"
   ```

## 📁 Project Structure

```
.
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Node.js application container
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
├── src/
│   └── index.ts           # Main application file (TypeScript)
├── dist/                  # Compiled JavaScript (generated)
├── init-db/
│   └── 01-init.sql        # MySQL initialization scripts
└── README.md              # This file
```
