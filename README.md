# 🛒 E-Commerce Microservices Platform
## Event-Driven Architecture with Kafka & Elasticsearch

<div align="center">

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen)
![Kafka](https://img.shields.io/badge/kafka-latest-red)
![Elasticsearch](https://img.shields.io/badge/elasticsearch-8.x-blue)

**A production-ready e-commerce platform demonstrating event-driven microservices architecture**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Services](#-services)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Microservices](#-microservices)
- [Event-Driven Communication](#-event-driven-communication)
- [Development](#-development)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

This **E-Commerce Microservices Platform** demonstrates a **production-grade event-driven architecture** using Apache Kafka for inter-service communication and Elasticsearch for advanced product search. Built with Node.js/Express, this platform showcases modern backend development practices including CQRS, event sourcing patterns, and polyglot persistence.

### Why This Project?

- ✅ **Event-Driven Architecture**: Kafka-based async communication
- ✅ **CQRS Pattern**: Separate read and write models
- ✅ **Elasticsearch Integration**: Full-text search and analytics
- ✅ **Microservices**: Independent, scalable services
- ✅ **Production Patterns**: Circuit breakers, retries, dead letter queues
- ✅ **Educational**: Clean code, comprehensive documentation

---

## ✨ Features

### Core E-Commerce Features
- 🛍️ **Product Catalog**: Browse, search, filter products
- 🔍 **Advanced Search**: Full-text search with Elasticsearch
- 🛒 **Shopping Cart**: Add, update, remove items
- 💳 **Order Management**: Create, track, cancel orders
- 👤 **User Management**: Registration, authentication, profiles
- 📊 **Analytics**: Real-time sales analytics with Elasticsearch

### Technical Features
- 🎯 **Event-Driven**: Kafka topics for service communication
- 🔄 **CQRS**: Command Query Responsibility Segregation
- 💾 **Polyglot Persistence**: MongoDB, PostgreSQL, Redis
- 🔍 **Full-Text Search**: Elasticsearch with custom analyzers
- 🚀 **High Performance**: Redis caching, async processing
- 📊 **Observability**: Logging, metrics, distributed tracing

---

## 🛠 Tech Stack

### Backend Services
| Service | Technology | Database | Purpose |
|---------|-----------|----------|---------|
| **Catalog Service** | Express.js | MongoDB | Product management |
| **Order Service** | Express.js | PostgreSQL | Order processing |
| **User Service** | Express.js | MongoDB | User management |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| **Apache Kafka** | 3.x | Event streaming platform |
| **Elasticsearch** | 8.x | Search and analytics |
| **MongoDB** | Latest | Document database |
| **PostgreSQL** | 15+ | Relational database |
| **Redis** | 7.x | Caching and sessions |
| **Docker** | Latest | Containerization |

### Libraries & Tools
- **Express.js** - Web framework
- **KafkaJS** - Kafka client for Node.js
- **@elastic/elasticsearch** - Elasticsearch client
- **Mongoose** - MongoDB ODM
- **Sequelize** - PostgreSQL ORM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Joi** - Request validation

---

## 🏗 Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│           (Load Balancer & Routing)                     │
└────────────┬───────────────┬────────────────┬───────────┘
             │               │                │
       ┌─────▼─────┐   ┌────▼────┐    ┌─────▼──────┐
       │  Catalog  │   │  Order  │    │    User    │
       │  Service  │   │ Service │    │  Service   │
       │ (MongoDB) │   │  (PG)   │    │ (MongoDB)  │
       └─────┬─────┘   └────┬────┘    └─────┬──────┘
             │              │               │
             └──────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │ Apache Kafka│
                    │  (Events)   │
                    └──────┬──────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
       ┌──────▼──────┐ ┌──▼────────┐ ┌──▼──────────┐
       │Elasticsearch│ │   Redis   │ │  Analytics  │
       │  (Search)   │ │  (Cache)  │ │   Service   │
       └─────────────┘ └───────────┘ └─────────────┘
```

### Event Flow Example: Order Creation

```
1. User creates order
   └─▶ Order Service receives HTTP POST /orders

2. Order Service processes
   ├─▶ Validates order data
   ├─▶ Creates order in PostgreSQL
   └─▶ Publishes "order.created" event to Kafka

3. Kafka distributes event
   ├─▶ Catalog Service consumes event
   │   └─▶ Updates product stock
   │
   ├─▶ User Service consumes event
   │   └─▶ Updates user order history
   │
   └─▶ Elasticsearch Consumer
       └─▶ Indexes order for analytics

4. Async responses
   ├─▶ Email Service sends confirmation
   └─▶ Notification Service pushes mobile notification
```

### CQRS Pattern Implementation

```
Command Side (Write Model):
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /products
       ▼
┌─────────────┐
│  Catalog    │
│  Service    │
└──────┬──────┘
       │ Write to MongoDB
       ▼
┌─────────────┐      ┌─────────────┐
│  MongoDB    │─────▶│    Kafka    │
│  (Source)   │      │   Events    │
└─────────────┘      └──────┬──────┘
                            │ product.created
                            ▼
Query Side (Read Model):
┌─────────────┐      ┌─────────────┐
│   Client    │      │Elasticsearch│
│GET /search  │◀─────│ (Optimized) │
└─────────────┘      └─────────────┘
```

---

## 🚀 Quick Start

Get the platform running locally in **10 minutes**:

### Prerequisites

- **Node.js** >= 20.x
- **Docker** & **Docker Compose**
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/hassonor/ecommerce-kafka-es-ms.git
cd ecommerce-kafka-es-ms

# 2. Start infrastructure (Kafka, Elasticsearch, MongoDB, PostgreSQL, Redis)
docker-compose up -d

# Wait for services to be healthy (check with docker-compose ps)

# 3. Install dependencies for all services
npm install --workspaces

# Or manually for each service:
cd catalog_service && npm install
cd ../order_service && npm install
cd ../user_service && npm install

# 4. Set up environment variables
# Copy .env.example to .env in each service directory
cp catalog_service/.env.example catalog_service/.env
cp order_service/.env.example order_service/.env
cp user_service/.env.example user_service/.env

# 5. Run database migrations (if any)
cd order_service
npm run migrate

# 6. Start all services
cd ..
npm run dev:all

# Or start individually:
cd catalog_service && npm run dev &
cd order_service && npm run dev &
cd user_service && npm run dev &
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Catalog Service** | http://localhost:3001 | Product catalog API |
| **Order Service** | http://localhost:3002 | Order management API |
| **User Service** | http://localhost:3003 | User management API |
| **Elasticsearch** | http://localhost:9200 | Search engine |
| **Kibana** | http://localhost:5601 | Elasticsearch UI |
| **Kafka UI** | http://localhost:8080 | Kafka management UI |

---

## 📁 Project Structure

```
ecommerce-kafka-es-ms/
├── catalog_service/           # Product catalog microservice
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── kafka/             # Kafka producers/consumers
│   │   │   ├── producers/
│   │   │   │   └── productProducer.js
│   │   │   └── consumers/
│   │   │       └── orderConsumer.js
│   │   ├── elasticsearch/     # ES indexing
│   │   └── app.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── order_service/             # Order management microservice
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/            # Sequelize models (PostgreSQL)
│   │   ├── routes/
│   │   ├── services/
│   │   ├── kafka/
│   │   │   ├── producers/
│   │   │   │   └── orderProducer.js
│   │   │   └── consumers/
│   │   │       └── inventoryConsumer.js
│   │   └── app.js
│   ├── migrations/            # Database migrations
│   ├── package.json
│   └── .env.example
│
├── user_service/              # User management microservice
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/            # Mongoose models
│   │   ├── routes/
│   │   ├── services/
│   │   ├── kafka/
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── shared/                    # Shared utilities (future)
│   ├── kafka-config/
│   ├── logger/
│   └── validators/
│
├── docker-compose.yml         # Infrastructure services
├── .cursorrules              # AI coding standards
└── README.md
```

---

## 🔧 Microservices

### Catalog Service (Port 3001)
**Manages product catalog**

**Endpoints**:
```bash
GET    /api/products              # List all products (paginated)
GET    /api/products/search       # Search products (Elasticsearch)
GET    /api/products/:id          # Get product details
POST   /api/products              # Create product (admin)
PUT    /api/products/:id          # Update product (admin)
DELETE /api/products/:id          # Delete product (admin)
```

**Events Published**:
- `product.created`
- `product.updated`
- `product.deleted`
- `product.stock.updated`

**Events Consumed**:
- `order.created` → Update stock levels

### Order Service (Port 3002)
**Handles order processing**

**Endpoints**:
```bash
GET    /api/orders                # User's orders
GET    /api/orders/:id            # Order details
POST   /api/orders                # Create order
PATCH  /api/orders/:id/cancel     # Cancel order
```

**Events Published**:
- `order.created`
- `order.updated`
- `order.cancelled`
- `order.completed`

**Events Consumed**:
- `product.stock.updated` → Validate order availability

### User Service (Port 3003)
**User authentication & profiles**

**Endpoints**:
```bash
POST   /api/auth/register         # Register user
POST   /api/auth/login            # Login
GET    /api/users/me              # Current user profile
PUT    /api/users/me              # Update profile
```

**Events Published**:
- `user.created`
- `user.updated`

---

## 🔄 Event-Driven Communication

### Kafka Topics

| Topic | Producers | Consumers | Schema |
|-------|-----------|-----------|--------|
| `product.events` | Catalog Service | Order Service, ES Consumer | `{ id, name, price, stock }` |
| `order.events` | Order Service | Catalog Service, User Service | `{ orderId, userId, items[], total }` |
| `user.events` | User Service | Order Service, Analytics | `{ userId, email, createdAt }` |

### Event Schema Example

```json
{
  "eventType": "order.created",
  "eventId": "uuid-v4",
  "timestamp": "2026-02-11T10:30:00Z",
  "data": {
    "orderId": "ORDER123",
    "userId": "USER456",
    "items": [
      {
        "productId": "PROD789",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalAmount": 59.98,
    "status": "pending"
  },
  "metadata": {
    "version": "1.0",
    "source": "order-service"
  }
}
```

### Kafka Producer Example

```javascript
// orderProducer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function publishOrderCreated(order) {
  await producer.connect();

  await producer.send({
    topic: 'order.events',
    messages: [
      {
        key: order.orderId,
        value: JSON.stringify({
          eventType: 'order.created',
          eventId: generateUUID(),
          timestamp: new Date().toISOString(),
          data: order
        })
      }
    ]
  });

  await producer.disconnect();
}

module.exports = { publishOrderCreated };
```

### Kafka Consumer Example

```javascript
// inventoryConsumer.js
const { Kafka } = require('kafkajs');
const Product = require('../models/Product');

const kafka = new Kafka({
  clientId: 'catalog-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'catalog-group' });

async function consumeOrderEvents() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.eventType === 'order.created') {
        // Update product stock
        for (const item of event.data.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          });
        }
      }
    }
  });
}

module.exports = { consumeOrderEvents };
```

---

## 🔍 Elasticsearch Integration

### Product Search Index

```javascript
// elasticsearch/productIndex.js
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

async function createProductIndex() {
  await client.indices.create({
    index: 'products',
    body: {
      mappings: {
        properties: {
          name: {
            type: 'text',
            analyzer: 'standard'
          },
          description: {
            type: 'text'
          },
          category: {
            type: 'keyword'
          },
          price: {
            type: 'float'
          },
          stock: {
            type: 'integer'
          },
          tags: {
            type: 'keyword'
          }
        }
      }
    }
  });
}

async function searchProducts(query, filters = {}) {
  const { body } = await client.search({
    index: 'products',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['name^3', 'description', 'tags']
              }
            }
          ],
          filter: [
            filters.category && { term: { category: filters.category } },
            filters.minPrice && { range: { price: { gte: filters.minPrice } } },
            filters.maxPrice && { range: { price: { lte: filters.maxPrice } } }
          ].filter(Boolean)
        }
      },
      sort: [
        { _score: 'desc' },
        { price: 'asc' }
      ],
      size: 20
    }
  });

  return body.hits.hits.map(hit => hit._source);
}

module.exports = { createProductIndex, searchProducts };
```

---

## 💻 Development

### Running Services Individually

```bash
# Catalog Service
cd catalog_service
npm run dev

# Order Service
cd order_service
npm run dev

# User Service
cd user_service
npm run dev
```

### Environment Variables

Each service requires `.env` file:

```env
# Catalog Service (.env)
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ecommerce_catalog
KAFKA_BROKERS=localhost:9092
ELASTICSEARCH_NODE=http://localhost:9200
REDIS_URL=redis://localhost:6379

# Order Service (.env)
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce_orders
KAFKA_BROKERS=localhost:9092

# User Service (.env)
NODE_ENV=development
PORT=3003
MONGODB_URI=mongodb://localhost:27017/ecommerce_users
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-secret-key
```

---

## 🧪 Testing

```bash
# Run tests for all services
npm run test --workspaces

# Or individual services
cd catalog_service && npm test
cd order_service && npm test
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f catalog_service
```

---

## 🗺️ Roadmap

**Current Status**: ✅ Core services implemented

**TODO** (from original README):
1. ⏳ Create shared package for common utilities
2. ⏳ Secure inter-service communication (mTLS)
3. ⏳ Implement real auth middleware for cart and order routes
4. ⏳ Create centralized config loading (similar to Jobber pattern)
5. ⏳ Add API Gateway with rate limiting
6. ⏳ Implement circuit breakers for service resilience
7. ⏳ Add distributed tracing (Jaeger/Zipkin)
8. ⏳ Implement saga pattern for distributed transactions

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Or Hasson](https://github.com/hassonor)**

⭐ Star this repo if you're learning microservices!

</div>
