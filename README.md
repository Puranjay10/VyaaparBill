# VyaaparBill

VyaaparBill is an AI-powered inventory and billing management system built for retailers and small businesses.

It manages products, suppliers, customers, purchases, sales, and GST invoices while providing an AI-assisted invoice import workflow using OCR and Google's Gemini API.

> Upload a GST invoice PDF → Extract invoice data → Preview changes → Confirm purchase → Automatically update inventory.

## Live Demo

Frontend: https://vyaapar-bill.vercel.app/

Backend API: https://vyaaparbill-backend.onrender.com/

## Features

### Authentication

- JWT-based authentication
- Secure password hashing
- Protected API routes
- User-specific data isolation

### Product Management

- Create, update, and delete products
- Product search and pagination
- Inventory quantity tracking
- Purchase and selling price management
- GST rate support

### Supplier Management

- Create, update, and delete suppliers
- GST number tracking
- Supplier contact information management

### Customer Management

- Create, update, and delete customers
- Customer contact and address management

### Purchase Management

- Record purchases
- Transaction-safe purchase creation
- Automatic inventory updates
- Purchase history
- Duplicate invoice protection

### Sales Management

- Create sales
- Atomic stock validation and deduction
- Transaction-safe sale creation
- Automatic GST invoice generation
- PDF invoice download
- Unique invoice number generation

### AI Invoice Processing

- Upload GST invoice PDFs
- OCR-based text extraction
- Gemini AI converts invoice text into structured data
- Validate extracted invoice data
- Preview inventory changes before import
- Detect existing suppliers and products
- Automatically create missing suppliers and products
- One-click purchase confirmation
- Automatic inventory updates

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Express Validator
- PDFKit
- Axios

### AI Service

- Python
- FastAPI
- OCR
- Google Gemini API

### Database

- MongoDB Atlas

### Deployment

- Vercel — Frontend
- Render — Backend API
- Render — AI microservice

## Architecture

```text
                         Frontend
                            │
                            ▼
                     Express Backend
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       MongoDB Atlas               FastAPI AI Service
                                          │
                                          ▼
                                   OCR + Gemini AI
```

The Express backend acts as the main application API and handles authentication, business logic, inventory operations, purchases, sales, and invoice generation.

AI invoice processing is isolated in a separate FastAPI microservice. The backend communicates with this service through HTTP APIs.

## AI Invoice Processing Workflow

```text
Upload GST Invoice PDF
          │
          ▼
OCR Extracts Invoice Text
          │
          ▼
Gemini Parses Structured Invoice Data
          │
          ▼
Validate Extracted Data
          │
          ▼
Generate Purchase Preview
          │
          ▼
User Confirms Import
          │
          ▼
Find or Create Supplier
          │
          ▼
Find or Create Products
          │
          ▼
Create Purchase
          │
          ▼
Update Inventory
```

## Data Integrity

VyaaparBill uses MongoDB transactions for inventory-sensitive operations.

During a sale:

1. The customer is validated.
2. Product stock is atomically checked and reduced.
3. The sale is created.
4. A GST invoice is generated.

If any step fails, the transaction is rolled back.

Purchase creation also runs inside a transaction so purchase records and inventory updates remain consistent.

Product prices and financial totals used during sales and purchases are calculated by the backend instead of trusting client-provided totals.

## Multi-User Data Isolation

Application data is scoped to the authenticated user.

Products, suppliers, customers, purchases, sales, and invoices are queried using the authenticated user's ID. This prevents users from accessing or modifying another user's business data.

## Project Structure

```text
VyaaparBill/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── invoices/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── server.js
│   │
│   └── package.json
│
├── ai-service/
│   ├── services/
│   │   ├── ocr.py
│   │   ├── ai_parser.py
│   │   └── validator.py
│   │
│   ├── app.py
│   └── requirements.txt
│
└── frontend/
    ├── css/
    ├── js/
    └── *.html
```

## API Endpoints

### Authentication

| Method | Endpoint |
| --- | --- |
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |

### Products

| Method | Endpoint |
| --- | --- |
| GET | `/api/products` |
| GET | `/api/products/search` |
| GET | `/api/products/:id` |
| POST | `/api/products` |
| PUT | `/api/products/:id` |
| DELETE | `/api/products/:id` |

### Suppliers

| Method | Endpoint |
| --- | --- |
| GET | `/api/suppliers` |
| GET | `/api/suppliers/:id` |
| POST | `/api/suppliers` |
| PUT | `/api/suppliers/:id` |
| DELETE | `/api/suppliers/:id` |

### Customers

| Method | Endpoint |
| --- | --- |
| GET | `/api/customers` |
| GET | `/api/customers/:id` |
| POST | `/api/customers` |
| PUT | `/api/customers/:id` |
| DELETE | `/api/customers/:id` |

### Purchases

| Method | Endpoint |
| --- | --- |
| GET | `/api/purchases` |
| POST | `/api/purchases` |

### Sales

| Method | Endpoint |
| --- | --- |
| GET | `/api/sales` |
| GET | `/api/sales/:id` |
| POST | `/api/sales` |

### Invoices

| Method | Endpoint |
| --- | --- |
| GET | `/api/invoices` |
| GET | `/api/invoices/:id` |
| GET | `/api/invoices/:id/download` |

### AI Invoice Processing

| Method | Endpoint |
| --- | --- |
| POST | `/api/ai/process-invoice` |
| POST | `/api/ai/confirm-purchase` |

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/Puranjay10/VyaaparBill.git
cd VyaaparBill
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://127.0.0.1:8000
```

### AI Service

```bash
cd ai-service

python -m venv venv
```

Activate the virtual environment.

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the AI service:

```bash
uvicorn app:app --reload
```

## Deployment

The application is deployed using three independently hosted components:

- Frontend on Vercel
- Express backend on Render
- FastAPI AI microservice on Render
- MongoDB Atlas for persistent database storage

The Express backend communicates with the AI microservice through the configured `AI_SERVICE_URL`.

## Author

**Puranjay Kapoor**

B.Tech Computer Science

GitHub: https://github.com/Puranjay10

LinkedIn: https://www.linkedin.com/in/puranjay-kapoor-06a3a52ab/
