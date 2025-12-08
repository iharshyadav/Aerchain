# Aerchain Backend

Express.js API server that handles RFP management, vendor communication, and proposal processing.

**🚀 Hosted on DigitalOcean VPS Server**  
Base URL: `https://157.245.106.211.sslip.io`

**📖 API Documentation**  
Postman Documentation: [View API Docs](https://documenter.getpostman.com/view/32672777/2sB3dQtp6H)

## What's inside

- User and vendor authentication with JWT
- RFP creation and distribution via email
- Inbound email parsing (SendGrid webhooks)
- AI-powered proposal extraction using Google Gemini
- File upload handling with DigitalOcean Spaces
- PostgreSQL database with Prisma ORM

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:
```bash
cd backend
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your actual credentials:
- Database connection string
- SendGrid API key and email settings
- DigitalOcean Spaces credentials
- Google Gemini API key
- JWT secret

3. Run database migrations:
```bash
pnpm prisma migrate dev
```

4. Generate Prisma client:
```bash
pnpm prisma generate
```

### Running the server

Development mode:
```bash
pnpm dev
```

Build for production:
```bash
pnpm build
```

The server runs on `http://localhost:5000` by default.

## API Endpoints

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/rfp` - Get all RFPs
- `POST /api/rfp` - Create new RFP
- `POST /api/email/send` - Send RFP to vendors
- `POST /api/email/inbound` - Webhook for incoming emails
- `GET /api/vendors` - Get all vendors
- `GET /api/proposals` - Get proposals for an RFP

## Deployment

This backend is deployed on a **DigitalOcean VPS server**.

**Production URL:** `https://157.245.106.211.sslip.io`

The server is configured with:
- Node.js runtime environment
- PM2 process manager for keeping the app running
- Nginx reverse proxy for SSL and routing
- PostgreSQL database
- DigitalOcean Spaces for file storage

Make sure all environment variables are properly configured on the VPS server.

## Database Schema

Check `prisma/schema.prisma` to see the complete database structure. Main models:
- User
- Vendor
- RFP
- SentRFP
- Proposal
- Comparison
