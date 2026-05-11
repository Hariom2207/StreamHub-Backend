# StreamHub - Backend

A video streaming platform backend that I built while learning full stack development. It handles everything from auth to video uploads to subscriptions.

Still improving it as I learn more.

---

## What this does

- Users can register, login and stay logged in with refresh tokens
- Upload videos to Cloudinary
- Watch history gets saved automatically
- Subscribe to channels
- Like videos and comments
- Comment on videos
- Channel profiles with subscriber counts

---

## Stack

- Node.js + Express
- MongoDB with Mongoose
- JWT stored in HTTP-only cookies
- Cloudinary for videos and images
- Multer for handling file uploads

---

## Folder structure

```
src/
├── controllers/    business logic lives here
├── models/         mongodb schemas
├── routes/         api routes
├── middlewares/    auth + multer
├── utils/          helper functions
└── app.js
```

---

## Running locally

```bash
git clone https://github.com/hariom2207/streamhub-backend.git
cd streamhub-backend
npm install
cp .env.example .env
# fill in your values in .env
npm run dev
```

---

## Environment variables

Create a `.env` file using `.env.example` as reference:

```
PORT=8000
NODE_ENV=development

MONGODB_URI=             # MongoDB Atlas connection string
ACCESS_TOKEN_SECRET=     # any random string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=    # any random string
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CORS_ORIGIN=http://localhost:5173
```

---

## API routes

**Users** `/api/v1/users`
```
POST   /register
POST   /login
POST   /logout
GET    /current-user
PATCH  /update-account
PATCH  /change-password
PATCH  /avatar
PATCH  /cover-image
GET    /c/:username
GET    /history
POST   /history/:videoId
```

**Videos** `/api/v1/videos`
```
GET    /
POST   /
GET    /:id
PATCH  /:id
DELETE /:id
PATCH  /toggle/publish/:id
```

**Subscriptions** `/api/v1/subscriptions`
```
POST   /c/:channelId
GET    /c/:channelId
GET    /u/:subscriberId
```

---

## Things I learned building this

- How JWT auth actually works with refresh tokens
- Why HTTP-only cookies are safer than localStorage
- MongoDB aggregation pipelines for complex queries
- How to structure a backend project properly

---

## Frontend

The frontend repo is here → [streamhub-frontend](https://github.com/hariom2207/streamhub-frontend)