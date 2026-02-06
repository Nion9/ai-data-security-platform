from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base, get_db
from app.models import User, Dataset
from app.routes import auth_routes, data_routes
from app.security import create_security_headers

load_dotenv()

# Security scheme
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    yield
    # Shutdown
    print("Shutting down")

app = FastAPI(
    title="AI-Powered Data Security Platform",
    description="Secure data cleaning and PII detection platform",
    version="1.0.0",
    lifespan=lifespan
)

# Security middleware - Enable in production
# app.add_middleware(HTTPSRedirectMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Content-Type-Options", "X-Frame-Options"]
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    security_headers = create_security_headers()
    for header, value in security_headers.items():
        response.headers[header] = value
    return response

# Include routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["authentication"])
app.include_router(data_routes.router, prefix="/api/data", tags=["data"])

@app.get("/")
async def root():
    return {
        "message": "AI-Powered Data Security Platform API",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "data-security-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        ssl_keyfile=os.getenv("SSL_KEYFILE", None),
        ssl_certfile=os.getenv("SSL_CERTFILE", None)
    )