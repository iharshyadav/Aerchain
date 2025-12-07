# Aerchain

A supply chain management platform that makes vendor communication and procurement easier. Send RFPs via email, get proposals back, and compare them all in one place.

**GitHub**: [https://github.com/iharshyadav/Aerchain](https://github.com/iharshyadav/Aerchain)

## What it does

- Create and send RFPs to vendors through email
- Vendors can reply directly via email with their proposals
- AI-powered parsing of vendor responses
- Side-by-side comparison of proposals
- Track vendor communications and history

## Project Structure

This is a full-stack application with separate frontend and backend:

- **[Backend](./backend/README.md)** - Express API with Prisma ORM
- **[Frontend](./frontend/README.md)** - Next.js application

## Quick Start

1. Clone the repo
```bash
git clone https://github.com/iharshyadav/Aerchain.git
cd Aerchain
```

2. Set up the backend (see [backend README](./backend/README.md))
3. Set up the frontend (see [frontend README](./frontend/README.md))

## Tech Stack

**Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL  
**Frontend**: Next.js, React, TypeScript, Tailwind CSS  
**Email**: SendGrid for sending and receiving emails  
**Storage**: DigitalOcean Spaces for file uploads  
**AI**: Google Gemini for parsing proposals