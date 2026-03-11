# FoodShare Backend API

A clean, modular REST API for the FoodShare food donation platform built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

---

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB running locally on port `27017`

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and update values if needed:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodshare
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### Run the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

---

## Folder Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, get profile
│   ├── donationController.js  # Donation lifecycle
│   ├── verificationController.js  # Volunteer ID verification
│   ├── ratingController.js    # NGO rates volunteer
│   └── adminController.js     # Admin dashboard data
├── middleware/
│   ├── authMiddleware.js      # JWT verification (protect)
│   └── roleMiddleware.js      # Role-based access (restrictTo)
├── models/
│   ├── User.js                # Users (donor/volunteer/ngo/admin)
│   ├── Donation.js            # Food donations
│   ├── Verification.js        # Volunteer ID checks
│   └── Rating.js              # Volunteer ratings
├── routes/
│   ├── authRoutes.js
│   ├── donationRoutes.js
│   ├── verificationRoutes.js
│   ├── ratingRoutes.js
│   └── adminRoutes.js
├── utils/
│   └── helpers.js             # Shared utility functions
├── .env
├── .env.example
├── package.json
└── server.js                  # Entry point
```

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Auth Routes — `/api/auth`

| Method | Endpoint              | Access  | Description              |
|--------|-----------------------|---------|--------------------------|
| POST   | `/api/auth/register`  | Public  | Register a new user      |
| POST   | `/api/auth/login`     | Public  | Login and get JWT token  |
| GET    | `/api/auth/me`        | Private | Get current user profile |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "9876543210",
  "role": "donor"
}
```
> `role` must be one of: `donor`, `volunteer`, `ngo`, `admin`

---

### Donation Routes — `/api/donations`

| Method | Endpoint                        | Access              | Description                              |
|--------|---------------------------------|---------------------|------------------------------------------|
| POST   | `/api/donations`                | Donor               | Post a new food donation                 |
| GET    | `/api/donations`                | NGO, Volunteer, Admin | View available donations               |
| GET    | `/api/donations/my-donations`   | Donor               | View donor's own donations               |
| PATCH  | `/api/donations/accept`         | NGO                 | Accept a donation (optionally assign volunteer) |
| PATCH  | `/api/donations/picked-up`      | Volunteer           | Mark donation as picked up               |
| PATCH  | `/api/donations/delivered`      | NGO                 | Confirm food delivered                   |

**NGO Priority Logic:** When a donation is posted, it is visible to NGOs immediately. After **2 hours**, it becomes visible to independent volunteers as well.

**Donation status flow:** `posted` → `accepted` → `picked_up` → `delivered`

---

### Verification Routes — `/api/verifications`

| Method | Endpoint              | Access    | Description                   |
|--------|-----------------------|-----------|-------------------------------|
| POST   | `/api/verifications`  | Volunteer | Submit ID document for review |

**Body:**
```json
{
  "idDocument": "https://your-storage.com/id-doc.jpg"
}
```

---

### Rating Routes — `/api/ratings`

| Method | Endpoint                      | Access  | Description                      |
|--------|-------------------------------|---------|----------------------------------|
| POST   | `/api/ratings`                | NGO     | Rate a volunteer (1–5 stars)     |
| GET    | `/api/ratings/:volunteerId`   | Private | Get all ratings for a volunteer  |

**Body:**
```json
{
  "volunteerId": "<ObjectId>",
  "rating": 5,
  "review": "Very punctual and careful."
}
```

---

### Admin Routes — `/api/admin`

All admin routes require `role: admin`.

| Method | Endpoint                           | Access | Description                          |
|--------|------------------------------------|--------|--------------------------------------|
| GET    | `/api/admin/users`                 | Admin  | Get all users (filter: `?role=...`)  |
| GET    | `/api/admin/donations`             | Admin  | Get all donations (filter: `?status=...`) |
| GET    | `/api/admin/stats`                 | Admin  | Platform statistics summary          |
| GET    | `/api/admin/verifications`         | Admin  | Get all verification requests        |
| PATCH  | `/api/admin/verifications/:id`     | Admin  | Approve or reject a verification     |

**Review verification body:**
```json
{
  "status": "approved"
}
```

---

## Role Permissions Summary

| Action                      | Donor | Volunteer | NGO | Admin |
|-----------------------------|-------|-----------|-----|-------|
| Post donation               | ✅    |           |     |       |
| View own donations          | ✅    |           |     |       |
| View available donations    |       | ✅        | ✅  | ✅    |
| Accept donation             |       |           | ✅  |       |
| Mark picked up              |       | ✅        |     |       |
| Confirm delivery            |       |           | ✅  |       |
| Submit ID verification      |       | ✅        |     |       |
| Rate a volunteer            |       |           | ✅  |       |
| View all users/donations    |       |           |     | ✅    |
| Approve/reject verification |       |           |     | ✅    |
