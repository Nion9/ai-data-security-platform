<div align="center">

# 🔐 AI-Powered Data Security Platform

### Intelligent PII Detection & Data Sanitization System

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

A production-ready, full-stack security platform that automatically detects and sanitizes Personally Identifiable Information (PII) in datasets. Built with enterprise-grade security practices, this platform combines AI-powered NLP detection with robust data processing capabilities to help organizations maintain data privacy compliance.

### Why This Platform?

- **🛡️ Privacy-First Architecture**: Built with GDPR, CCPA, and HIPAA compliance considerations
- **🤖 AI-Powered Detection**: Leverages spaCy NLP models for accurate PII identification
- **⚡ High Performance**: Handles large datasets efficiently with optimized processing pipelines
- **🔒 Enterprise Security**: JWT authentication, SQL injection prevention, and comprehensive audit logging
- **📊 Multi-Format Support**: Process CSV, Excel, and JSON files seamlessly

---

## ✨ Features

### 🔐 Security & Compliance

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Secure token-based authentication with refresh token support |
| **Input Validation** | Comprehensive request validation using Pydantic models |
| **SQL Injection Protection** | Parameterized queries via SQLAlchemy ORM |
| **CORS Configuration** | Properly configured cross-origin resource sharing |
| **Security Headers** | HSTS, CSP, X-Frame-Options implementation |
| **Audit Logging** | Complete tracking of user actions and file operations |

### 🤖 AI-Powered PII Detection

Automatically identifies and processes sensitive information including:

- 📧 Email addresses
- 📱 Phone numbers (international formats)
- 👤 Personal names
- 🆔 Social Security Numbers (SSN)
- 💳 Credit card numbers
- 📍 Physical addresses
- 🎂 Dates of birth
- 🏥 Medical record numbers
- 🪪 Government-issued IDs

### 🎯 Data Processing Options

| Action | Description | Use Case |
|--------|-------------|----------|
| **Redact** | Replace sensitive data with `[REDACTED]` | Compliance reporting |
| **Anonymize** | Replace with realistic fake data | Testing & development |
| **Remove** | Delete rows containing PII | Data minimization |
| **Mask** | Partial masking (e.g., `***-**-1234`) | Display purposes |

### 📊 User Interface

- **Modern Dashboard**: Clean, intuitive Material-UI design
- **Drag & Drop**: Easy file upload interface
- **Real-Time Status**: Live processing progress indicators
- **Dataset Management**: View, download, and manage processed files
- **Responsive Design**: Works seamlessly on desktop and mobile

---

## 🛠️ Tech Stack

### Backend Infrastructure

```
FastAPI (Python 3.11+)    → High-performance async API framework
PostgreSQL 15+            → Robust relational database
SQLAlchemy                → Advanced ORM with connection pooling
spaCy                     → Production-grade NLP for PII detection
Pydantic                  → Data validation and settings management
JWT                       → Secure authentication mechanism
Alembic                   → Database migration management
```

### Frontend Stack

```
React 18+ (TypeScript)    → Type-safe component architecture
Material-UI (MUI)         → Professional UI component library
React Router v6           → Client-side routing
Axios                     → Promise-based HTTP client
React Query               → Server state management
Formik + Yup              → Form handling and validation
```

### DevOps & Deployment

```
Docker & Docker Compose   → Containerized deployment
Nginx                     → Reverse proxy and static file serving
PostgreSQL Container      → Persistent database storage
Multi-stage Builds        → Optimized production images
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Docker Desktop** 24.0+ with Docker Compose
- **Node.js** 18+ (for local development)
- **Python** 3.11+ (for local development)
- **Git** for version control

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Nion9/ai-data-security-platform.git
cd ai-data-security-platform
```

#### 2. Environment Configuration

Create environment files for both backend and frontend:

**Backend (.env)**
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/datasecurity
POSTGRES_USER=datauser
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=datasecurity

# Security
SECRET_KEY=your-secret-key-min-32-chars-long
JWT_SECRET_KEY=another-secret-key-for-jwt-tokens
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Data Security Platform"
```

#### 3. Launch with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

### Default Credentials

```
Email: admin@example.com
Password: admin123
```

> ⚠️ **Important**: Change default credentials immediately in production!

---

## 💻 Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## 📁 Project Structure

```
ai-data-security-platform/
├── backend/
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── datasets.py   # Dataset management
│   │   │   └── files.py      # File upload/download
│   │   ├── core/             # Core configurations
│   │   │   ├── config.py     # Application settings
│   │   │   ├── security.py   # Security utilities
│   │   │   └── database.py   # Database connection
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   └── dataset.py
│   │   ├── schemas/          # Pydantic schemas
│   │   │   ├── user.py
│   │   │   └── dataset.py
│   │   ├── services/         # Business logic
│   │   │   ├── pii_detector.py
│   │   │   └── data_processor.py
│   │   └── main.py           # Application entry point
│   ├── alembic/              # Database migrations
│   ├── tests/                # Test suite
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard/
│   │   │   ├── Upload/
│   │   │   └── Auth/
│   │   ├── pages/            # Page components
│   │   ├── services/         # API integration
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx
│   ├── public/               # Static assets
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml        # Docker orchestration
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔒 Security Considerations

### Authentication Flow

```
1. User Login → JWT Access Token (30 min) + Refresh Token (7 days)
2. Access Token in Authorization Header
3. Token Validation on Every Request
4. Automatic Token Refresh via Refresh Token
5. Logout → Token Blacklisting
```

### Data Security Best Practices

- All passwords hashed using bcrypt with salt
- SQL injection prevention through parameterized queries
- XSS protection via Content Security Policy
- CSRF protection for state-changing operations
- File upload validation (type, size, content)
- Rate limiting on authentication endpoints
- Secure session management
- Audit trail for all data operations

### Compliance Features

| Regulation | Implementation |
|------------|----------------|
| **GDPR** | Right to erasure, data minimization, consent management |
| **CCPA** | Data access rights, deletion requests, opt-out mechanisms |
| **HIPAA** | Audit logging, encryption at rest and in transit, access controls |

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register       # Create new user account
POST /api/auth/login          # Authenticate user
POST /api/auth/refresh        # Refresh access token
POST /api/auth/logout         # Invalidate tokens
GET  /api/auth/me             # Get current user info
```

### Dataset Management

```http
POST   /api/datasets/upload        # Upload file for processing
GET    /api/datasets               # List all datasets
GET    /api/datasets/{id}          # Get dataset details
DELETE /api/datasets/{id}          # Delete dataset
POST   /api/datasets/{id}/process  # Process uploaded file
GET    /api/datasets/{id}/download # Download processed file
```

### Interactive Documentation

Visit http://localhost:8000/docs after starting the backend for interactive API documentation with:
- Request/response schemas
- Authentication flows
- Try-it-out functionality
- Model definitions

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_pii_detector.py -v
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

---

## 🚢 Deployment

### Production Deployment Checklist

- [ ] Change all default passwords and secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure automated backups
- [ ] Review and minimize logged data
- [ ] Set up firewall rules
- [ ] Enable HTTPS enforcement
- [ ] Configure database connection pooling

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://localhost:8000/health
```

### Environment Variables (Production)

```bash
# Use strong secrets
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Production database
DATABASE_URL=postgresql://prod_user:strong_password@db:5432/prod_db

# Security settings
SECURE_SSL_REDIRECT=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint and Prettier for TypeScript/React
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

### Code Style

**Python**
```bash
# Format code
black app/

# Sort imports
isort app/

# Lint
flake8 app/
```

**TypeScript/React**
```bash
# Format and lint
npm run lint
npm run format
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Nion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [spaCy](https://spacy.io/) - Industrial-strength NLP
- [Material-UI](https://mui.com/) - React component library
- [PostgreSQL](https://www.postgresql.org/) - Advanced database system
- [Docker](https://www.docker.com/) - Containerization platform

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Nion9/ai-data-security-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Nion9/ai-data-security-platform/discussions)

---

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core PII detection functionality
- [x] Basic user authentication
- [x] File upload and processing
- [x] Docker deployment

### Phase 2 (In Progress)
- [ ] Advanced anonymization algorithms
- [ ] Batch processing support
- [ ] Custom PII pattern definitions
- [ ] Enhanced audit logging

### Phase 3 (Planned)
- [ ] Machine learning model training
- [ ] Real-time data streaming
- [ ] Multi-language support
- [ ] Enterprise SSO integration
- [ ] Comprehensive reporting dashboard
- [ ] API rate limiting
- [ ] Webhook notifications

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made for data privacy and security

[Report Bug](https://github.com/Nion9/ai-data-security-platform/issues) • [Request Feature](https://github.com/Nion9/ai-data-security-platform/issues) • [Documentation](https://github.com/Nion9/ai-data-security-platform/wiki)

</div>
