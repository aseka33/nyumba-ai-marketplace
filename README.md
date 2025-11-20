# NyumbaAI - AI-Powered Interior Design Marketplace

NyumbaAI is an AI-powered interior design marketplace platform for the Kenyan market. Users upload room videos, receive AI-generated furniture recommendations with before/after visualizations, and can purchase products from local vendors.

## Features

- **AI Room Analysis**: Upload room videos and get instant AI-powered design recommendations
- **Before/After Visualization**: See your room transformed with recommended furniture
- **Interactive Product Hotspots**: Click on products to view details, prices, and vendor information
- **Local Vendor Integration**: Connect with verified Kenyan furniture vendors
- **Anti-Bypass Protection**: QR code system ensures platform commission on all sales
- **Budget-Based Recommendations**: Products matched to your budget tier (Economy, Mid-range, Premium, Luxury)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend**: Node.js + Express + tRPC + Drizzle ORM
- **Database**: MySQL
- **AI**: OpenAI Vision API for room analysis
- **Video Processing**: FFmpeg for frame extraction
- **Storage**: AWS S3
- **Payment**: M-Pesa (Safaricom Daraja API)

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `pnpm db:push`
5. Seed the database: `node seed-database.mjs`
6. Start development server: `pnpm dev`

## Deployment

- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway MySQL

## Deployment

- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway MySQL

## License

MIT
