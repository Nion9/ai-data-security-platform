# AI-Powered Data Security Platform

A full-stack security-focused data cleaning platform with AI-powered PII detection, built with Python, React, and PostgreSQL.

## Features

### 🔒 Security Features
- **Secure API Design**: JWT authentication, input validation, SQL injection prevention
- **Data Sanitization**: Automatic PII detection and cleaning
- **HTTPS Enforcement**: Security headers and CORS configuration
- **Secure Session Management**: Token-based authentication with refresh tokens
- **Audit Logging**: Track all user actions and file operations

### 🤖 AI-Powered PII Detection
- Automatic detection of sensitive information (emails, phones, names, SSNs, etc.)
- Multiple cleaning actions: redact, anonymize, or remove
- CSV, Excel, and JSON file support

### 📊 User-Friendly Interface
- Modern React dashboard with Material-UI
- Drag-and-drop file upload
- Real-time processing status
- Dataset management and download

## Tech Stack

### Backend
- **Python** with FastAPI
- **PostgreSQL** database
- **SQLAlchemy** ORM
- **spaCy** for NLP-based PII detection
- **JWT** for authentication

### Frontend
- **React** with TypeScript
- **Material-UI** components
- **React Router** for navigation
- **Axios** for API calls

### Deployment
- **Docker** and Docker Compose
- **Nginx** (for production)
- **PostgreSQL** with persistent storage

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone <[repository-url](https://github.com/Nion9/ai-data-security-platform)>
   cd ai-data-security-platform
