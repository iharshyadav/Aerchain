# Aerchain Frontend

Next.js frontend application for managing RFPs, vendors, and proposals.

## Features

- User and vendor dashboards
- Create and manage RFPs
- Send RFPs to multiple vendors
- View and compare vendor proposals
- Vendor management interface
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:
```bash
cd frontend
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, point this to your deployed backend URL.

### Running the app

Development mode:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

Build for production:
```bash
pnpm build
pnpm start
```

## Project Structure

```
app/
  auth/          - Login and signup pages
  user/          - User dashboard and features
  vendor/        - Vendor dashboard and features
components/
  ui/            - Reusable UI components (buttons, forms, etc.)
  dashboard/     - Dashboard-specific components
lib/
  api/           - API client functions
  utils.ts       - Utility functions
```

## Main Routes

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Sign up (user or vendor)
- `/user/dashboard` - User dashboard
- `/user/rfp` - RFP management
- `/user/vendors` - Vendor management
- `/vendor/dashboard` - Vendor dashboard
- `/vendor/proposals` - View received RFPs

## Deployment

This is a standard Next.js app and can be deployed on Vercel, Netlify, or any platform that supports Next.js.

Remember to set the `NEXT_PUBLIC_API_URL` environment variable to your production backend URL.
