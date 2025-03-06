# ChezFlora Backend API

Backend API for ChezFlora, a flower shop e-commerce and custom floral arrangement service.

## Setup Instructions

### Prerequisites

- Node.js 14.x or higher
- MySQL 5.7 or higher

### Installation

1. Clone the repository
2. Navigate to the backend directory: `cd chezflora-project/backend`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`
5. Create a MySQL database
6. Run migrations: `npm run db:migrate`
7. Seed database (optional): `npm run db:seed`

### Development

- Start development server: `npm run dev`
- API will be available at: http://localhost:5000

### Production

- Build: `npm run build`
- Start production server: `npm start`
