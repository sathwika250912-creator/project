# Backend (Express + MongoDB)

This directory contains a minimal Node/Express backend configured to connect to MongoDB with Mongoose.

## Setup

1. Open PowerShell in the `backend` folder:

```powershell
cd C:\Users\sathw\OneDrive\Desktop\project\project\backend
```

2. Install dependencies:

```powershell
npm install
```

3. Copy `.env.example` to `.env` and set `MONGO_URI`:

```powershell
copy .env.example .env
# Then edit .env and paste your MongoDB connection string
```

4. Start the server in development mode (auto-restart with changes):

```powershell
npm run dev
```

5. Quick test: open `http://localhost:5000/api/ping` (or the port you set) to verify the server responds.

## Files
- `server.js` - Express app and sample route
- `config/db.js` - Mongoose connection helper
- `seed.js` - Populate sample data (run with `npm run seed`)
- `.env.example` - Example environment variables

If you want, I can add authentication, ticket routes, or integrate with your frontend next.
