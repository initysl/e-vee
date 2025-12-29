# E-VEE — Customer Support Chatbot

E-VEE is an intelligent assistant designed to streamline the shopping experience

- Instant product information
- Product lookups powered by a Retrieval-Augmented Generation (RAG) engine
- Real-time cart status updates
- Direct checkout and order-flow assistance

**Technology Stack:** RAG Engine + LLM + API

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
- Rate limiting per endpoint type

**Performance**

- Redis caching (1-hour TTL for products)
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
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 --name redis redis:alpine

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

**Environment Variables**

```env
FAKE_STORE=https://fakestoreapi.com/products
REDIS_URL=redis://localhost:6379
PRODUCTS_CACHE_TTL=3600
OPENAI_API_KEY=your_key_here
```

---

## Running

```bash
# Start server
python -m app.main

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:** http://localhost:8000/docs  
**Health Check:** http://localhost:8000/health

---

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/
```

## Production Considerations

- Set `REDIS_URL` to production Redis instance
- Configure proper CORS origins in `main.py`
- Use environment-specific `.env` files
- Enable HTTPS/SSL
- Set up monitoring alerts for error logs
- Scale with multiple workers: `uvicorn app.main:app --workers 4`

---

## License

MIT

---

## Contact

For questions or support, open an issue or contact [your-email]
