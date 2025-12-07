# Aerchain Backend

Express.js API server that handles RFP management, vendor communication, and proposal processing.

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

This backend is configured to deploy on Vercel. The `vercel.json` file is already set up.

Make sure to add all environment variables in your Vercel dashboard before deploying.

## Database Schema

Check `prisma/schema.prisma` to see the complete database structure. Main models:
- User
- Vendor
- RFP
- SentRFP
- Proposal
- Comparison
