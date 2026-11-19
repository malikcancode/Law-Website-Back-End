# Law Website Back End

Express + MongoDB API for the law firm landing page and admin panel.

## Run locally

```bash
npm install
cp .env.example .env
# set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_ORIGINS
npm run dev
```

API: [http://localhost:5000](http://localhost:5000)

## Main routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/leads` | public | Landing page form |
| GET | `/api/leads` | admin | List leads |
| GET | `/api/settings` | public | Firm/site settings for the frontend |
| PUT | `/api/settings` | admin | Update firm, services, case types |
| POST | `/api/settings/logo` | admin | Upload logo |
| POST | `/api/auth/login` | public | Admin login |
| PATCH | `/api/auth/profile` | admin | Update name/email |
| PATCH | `/api/auth/password` | admin | Change password |

Uploaded logos are stored under `uploads/` (not committed).
