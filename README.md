# Shared Utility Scheduler (MERN)

A neighbourhood platform where residents fairly book shared utilities like parking slots, community hall, generator, EV charger, and water tanker.

## Tech Stack

- **Frontend:** React + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + JWT Auth
- **Database:** MongoDB + Mongoose
- **Payments:** Razorpay (optional)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (port 27017)

### Backend Setup
```bash
cd server
npm install
npm run seed    # Seeds database with sample data
npm run dev     # Starts server on port 5000
```

### Frontend Setup
```bash
cd client
npm install
npm run dev     # Starts frontend on port 5173
```

### Login Credentials (after seeding)
| Role  | Email              | Password |
|-------|-------------------|----------|
| Admin | admin@utility.com | admin123 |
| User  | rahul@test.com    | test123  |
| User  | priya@test.com    | test123  |
| User  | amit@test.com     | test123  |

## Features

- **JWT Authentication** with role-based access (user/admin)
- **Fair Booking Engine** with conflict detection & waitlist promotion
- **Calendar Booking** with real-time availability
- **Admin Dashboard** with analytics & charts
- **Glassmorphism + Neumorphism** UI design
- **Notifications** system
- **Audit Logging** for admin actions
- **Razorpay** payment integration

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Utilities
- `GET /api/utilities`
- `POST /api/utilities` (admin)
- `PUT /api/utilities/:id` (admin)
- `DELETE /api/utilities/:id` (admin)

### Bookings
- `POST /api/bookings/request`
- `GET /api/bookings/my`
- `GET /api/bookings/calendar`
- `POST /api/bookings/cancel/:id`
- `POST /api/bookings/admin/override` (admin)

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/verify`

### Analytics (admin)
- `GET /api/analytics/dashboard`
- `GET /api/analytics/most-used`
- `GET /api/analytics/bookings-per-week`
- `GET /api/analytics/conflict-rate`
- `GET /api/analytics/revenue`
