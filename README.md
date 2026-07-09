# VyaaparBill

An AI-powered inventory and billing management system built for retailers and small businesses. VyaaparBill streamlines inventory, supplier, customer, purchase, and sales management while introducing intelligent invoice processing using OCR and Google's Gemini AI.

> Upload a GST invoice PDF → Extract supplier and product details → Preview changes → Confirm purchase → Automatically update inventory.

---

## Features

### Authentication
- JWT-based authentication
- Secure password hashing
- Protected API routes

### Product Management
- Add, update, delete products
- Search and pagination
- Inventory tracking
- GST support

### Supplier Management
- Supplier CRUD operations
- GST number tracking
- Contact information management

### Customer Management
- Customer CRUD operations
- Customer purchase history

### Purchase Management
- Record purchases
- Automatic inventory updates
- Purchase history
- Duplicate invoice protection

### Sales Management
- Create sales
- Automatic stock deduction
- Invoice number generation

### AI Invoice Processing
- Upload GST invoice PDF
- OCR-based text extraction
- Gemini AI converts invoice into structured JSON
- Purchase preview before import
- Detect existing suppliers/products
- Automatically create missing suppliers/products
- One-click purchase confirmation
- Automatic inventory update

---

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Axios

### AI Service
- Python
- FastAPI
- OCR
- Google Gemini API

### Database
- MongoDB Atlas

---

## Architecture

```
                   Frontend
                       │
                       ▼
               Express Backend
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
   MongoDB Atlas              Python AI Service
                                      │
                              OCR + Gemini AI
```

---

## AI Invoice Processing Workflow

```
Upload Invoice PDF
        │
        ▼
OCR extracts text
        │
        ▼
Gemini AI parses invoice
        │
        ▼
Structured Invoice JSON
        │
        ▼
Purchase Preview
        │
        ▼
User confirms import
        │
        ▼
Find/Create Supplier
        │
        ▼
Find/Create Products
        │
        ▼
Create Purchase
        │
        ▼
Update Inventory
```

---

## Project Structure

```
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
└── package.json

ai-service/
│
├── services/
│   ├── ocr.py
│   ├── ai_parser.py
│   └── validator.py
│
├── uploads/
├── app.py
└── requirements.txt
```

---

## API Endpoints

### Authentication

| Method | Endpoint |
|---------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |

### Products

| Method | Endpoint |
|---------|----------|
| GET | `/api/products` |
| POST | `/api/products` |
| PUT | `/api/products/:id` |
| DELETE | `/api/products/:id` |

### Suppliers

| Method | Endpoint |
|---------|----------|
| GET | `/api/suppliers` |
| POST | `/api/suppliers` |

### Customers

| Method | Endpoint |
|---------|----------|
| GET | `/api/customers` |
| POST | `/api/customers` |

### Purchases

| Method | Endpoint |
|---------|----------|
| GET | `/api/purchases` |
| POST | `/api/purchases` |

### Sales

| Method | Endpoint |
|---------|----------|
| GET | `/api/sales` |
| POST | `/api/sales` |

### AI Invoice Processing

| Method | Endpoint |
|---------|----------|
| POST | `/api/ai/process-invoice` |
| POST | `/api/ai/confirm-purchase` |

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/<your-username>/VyaaparBill.git
cd VyaaparBill
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### AI Service

```bash
cd ai-service

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn app:app --reload
```

---

## Environment Variables

### Backend

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret

AI_SERVICE_URL=http://127.0.0.1:8000/upload
```

### AI Service

```env
GEMINI_API_KEY=your_gemini_api_key
```

---


## Author

**Puranjay Kapoor**

B.Tech Computer Science | Backend Developer

GitHub: https://github.com/Puranjay10
LinkedIn: *(Add your LinkedIn URL here)*

---
