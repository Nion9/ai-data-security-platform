# AI-Powered Data Security Platform - Setup Instructions

## Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- npm or pnpm

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Download spaCy English model:
```bash
python -m spacy download en_core_web_sm
```

6. The `.env` file is already configured with SQLite. You can modify it if needed.

7. Create data directories (if they don't exist):
```bash
mkdir -p data/uploads data/processed
```

8. Run the backend server:
```bash
python -m app.main
```

The backend will start on http://localhost:8000

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```
or if you prefer pnpm:
```bash
pnpm install
```

3. The `.env` file is already configured. You can modify it if needed.

4. Start the development server:
```bash
npm start
```
or with pnpm:
```bash
pnpm start
```

The frontend will start on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Register a new account or use the test credentials:
   - Email: test@example.com
   - Password: Test@123
3. Upload CSV, Excel, or JSON files to detect PII
4. View statistics and manage your datasets

## Features

- User authentication with JWT tokens
- AI-powered PII detection using spaCy
- Support for CSV, Excel, and JSON files
- Data cleaning and redaction
- Comprehensive security features
- Audit logging

## Security Notes

- Change the SECRET_KEY in backend/.env for production
- Update CORS settings in backend/app/main.py for production
- Use HTTPS in production
- Set up a proper database (PostgreSQL) for production

## Troubleshooting

### Backend Issues

**Issue**: ModuleNotFoundError
**Solution**: Make sure you activated the virtual environment and installed all dependencies

**Issue**: spaCy model not found
**Solution**: Run `python -m spacy download en_core_web_sm`

**Issue**: Database errors
**Solution**: Delete the `backend/data/app.db` file and restart the backend

### Frontend Issues

**Issue**: Module not found errors
**Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Issue**: Can't connect to backend
**Solution**: Make sure the backend is running on port 8000 and check the REACT_APP_API_URL in frontend/.env

## Project Structure

```
AI-Powered Data Security Platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── security.py          # Security utilities
│   │   ├── pii_detector.py      # AI PII detection
│   │   └── routes/
│   │       ├── auth_routes.py   # Authentication endpoints
│   │       └── data_routes.py   # Data management endpoints
│   ├── requirements.txt
│   ├── .env
│   └── data/
│       ├── uploads/             # Uploaded files
│       └── processed/           # Processed files
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx    # Login/Register page
│   │   │   └── Dashboard.tsx    # Main dashboard
│   │   ├── components/          # Reusable components
│   │   └── services/
│   │       ├── api.ts           # API client
│   │       └── auth.tsx         # Auth context
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── README.md
```

## Support

For issues or questions, please refer to the project documentation or create an issue in the project repository.
