## E-VEE — Enhanced Virtual E-Commerce Engine

E-VEE is an intelligent assistant designed to streamline the shopping experience

- Instant product information
- Product lookups powered by a Retrieval-Augmented Generation (RAG) engine
- Real-time cart status updates
- Direct checkout and order-flow assistance

**Technology Stack:** RAG+Sentence Tranformer+Python+Next.js

---

## Architecture

**Client:** Next.js 16.0.1  
**Server:** FastAPI + Python 3.11+  
**Vector Database:** ChromaDB (product embeddings)  
**Cache Layer:** Redis (products, cart, rate limiting)  
**Embedding Model:** sentence-transformers  
**External Data:** FakeStore API

---

## Features

**Chatbot Capabilities**

- Natural language product search
- Intent classification (product queries, cart status, checkout help)
- Context-aware conversations with session memory

**E-Commerce Core**

- Product browsing and search
- Shopping cart management
- Checkout with order generation

**Performance**

- Redis caching
- Async operations throughout
- Connection pooling and fallback strategies

---

## Setup

**Prerequisites**

- Python 3.11+
- Docker (for Redis)
- Git

**Installation**

```bash
# Clone repository
git clone <repository-url>
cd <project-directory>

# Create virtual environment
python -m venv .venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 --name redis redis:alpine

# Build and start docker
docker compose up --build

# Start without build
docker compose up

# Stop docker
docker compose down

# Configure environment
cp .env .env.production
# Edit .env with your settings
```

**Environment Variables**

```env
FAKE_STORE
REDIS_URL
PRODUCTS_CACHE_TTL
HF_TOKEN
```

---

## Running

```bash
# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:** http://localhost:8000/docs  
**Health Check:** http://localhost:8000/health

---

## License

MIT

---

## Contact

Kindly leave a start if you like this ⭐👊
