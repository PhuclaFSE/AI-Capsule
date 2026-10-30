# AI Capsule

AI Capsule is a small full-stack web application developed for **CSE3CWA / CSE5006 Assignment 3**. It allows authenticated users to save, review, update, and delete useful AI prompts in a private prompt library.

The application uses **React** for the frontend, **Node.js + Express** for the backend, **GitHub OAuth** for sign-in, an **Express-issued JWT** stored in a `Secure`, `HttpOnly` cookie named `token`, and **SQLite** for data storage.

## Features

- Public landing page at `/`
- GitHub OAuth login through `/login`
- Protected dashboard at `/dashboard`
- Public health check at `GET /api/health`
- Authenticated CRUD for prompt records:
  - `GET /api/capsules`
  - `POST /api/capsules`
  - `PUT /api/capsules/:id`
  - `DELETE /api/capsules/:id`
- Each user can only access their own records
- Prompt records include project name, title, version, prompt text, response summary, category, usefulness, review status, improvement status, screenshot URL, notes, and creation time

## Technology Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Authentication:** GitHub OAuth
- **Application session:** JSON Web Token (`jsonwebtoken`)
- **JWT storage:** `HttpOnly` cookie named `token`
- **Database:** SQLite
- **Security:** Helmet, OAuth `state` validation, server-side JWT verification

## Project Structure

```text
ai-capsule/
├── client/
│   └── src/
│       ├── components/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── capsules.js
│   ├── app.js
│   ├── db.js
│   └── index.js
├── database/
│   └── schema.sql
├── data/
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

## Local Setup

### Requirements

- Node.js 18 or later
- npm
- A GitHub account
- A GitHub OAuth App

### Install dependencies

From the project root:

```bash
npm install
```

Create a `.env` file by copying `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Then add the required environment variables.

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=2h
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
FRONTEND_URL=http://localhost:5173
DB_FILE=./data/ai-capsule.db
```

Do not commit real secret values to GitHub.

## GitHub OAuth Setup

Create a GitHub OAuth App with the following local settings:

```text
Homepage URL:
http://localhost:5173

Authorization callback URL:
http://localhost:3000/auth/github/callback
```

Copy the generated GitHub Client ID and Client Secret into `.env`.

## Run Locally

```bash
npm run dev
```

This starts both parts of the application:

```text
React / Vite: http://localhost:5173
Express:      http://localhost:3000
```

During development, Vite forwards the application API and authentication routes to Express.

## Required Routes

| Method | Route               | Access    | Purpose                                          |
| ------ | ------------------- | --------- | ------------------------------------------------ |
| GET    | `/`                 | Public    | Landing page                                     |
| GET    | `/login`            | Public    | Starts GitHub OAuth login                        |
| GET    | `/dashboard`        | Protected | Displays the authenticated user's records        |
| GET    | `/api/health`       | Public    | Returns `{ "status": "ok" }`                     |
| GET    | `/api/capsules`     | Protected | Reads the authenticated user's records           |
| POST   | `/api/capsules`     | Protected | Creates a record for the authenticated user      |
| PUT    | `/api/capsules/:id` | Protected | Updates a record owned by the authenticated user |
| DELETE | `/api/capsules/:id` | Protected | Deletes a record owned by the authenticated user |

Additional authentication routes are used for the GitHub OAuth callback and logout process.

## OAuth and JWT Flow

The authentication flow is:

```text
User selects Login with GitHub
        ↓
Express redirects the user to GitHub OAuth
        ↓
GitHub redirects back to /auth/github/callback
        ↓
Express exchanges the authorization code for a GitHub access token
        ↓
Express requests the GitHub user's identity
        ↓
Express creates its own application JWT
        ↓
JWT is stored in the HttpOnly cookie named token
        ↓
Protected API requests verify the JWT before continuing
```

The GitHub OAuth access token is only used to communicate with GitHub. It is **not** used as the application's JWT session token.

The GitHub user ID is stored in the JWT `sub` claim and is used as the record owner identifier.

## JWT Protection and Record Ownership

All `/api/capsules` CRUD routes use JWT authentication middleware.

The backend reads the JWT from the `token` cookie and verifies it using `JWT_SECRET`.

If the token is missing or invalid, the backend returns:

```text
401 Unauthorized
```

The frontend does not provide `user_id` when creating or changing records. Instead, the backend gets the authenticated user ID from:

```js
req.user.sub;
```

This prevents a user from changing their browser request to access another user's records.

For example, UPDATE and DELETE operations use both the record ID and authenticated user ID in their database conditions.

## Database

SQLite is initialised when the server starts.

Default local database file:

```text
./data/ai-capsule.db
```

The main table is:

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  prompt_version TEXT,
  prompt_text TEXT NOT NULL,
  response_summary TEXT,
  category TEXT,
  usefulness TEXT,
  reviewed INTEGER DEFAULT 0,
  improved INTEGER DEFAULT 0,
  screenshot_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Each capsule record is associated with the authenticated GitHub user through `user_id`.

## Local Verification

The following functionality was checked locally before deployment:

- `GET /api/health` returns `{ "status": "ok" }`
- GitHub OAuth login completes successfully
- The dashboard is only usable after authentication
- CREATE saves a new capsule
- READ returns the signed-in user's records
- UPDATE modifies an existing record
- DELETE removes an existing record
- Requests without a JWT return `401 Unauthorized`
- Requests with an invalid JWT return `401 Unauthorized`
- Record ownership comes from the verified JWT rather than from browser input

## Required cURL Security Tests

The final submission requires these checks against the **deployed public URL**.

### Test 1 — No authentication

```bash
curl -i https://ai-capsule-wocy.onrender.com/api/capsules
```

Expected result:

```text
401 Unauthorized
```

### Test 2 — Invalid JWT

```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-wocy.onrender.com/api/capsules
```

Expected result:

```text
401 Unauthorized
```

Both deployed cURL security tests were performed successfully. The unauthenticated request and the request using `token=fake-token-123` both returned `401 Unauthorized`.

## Build and Production Start

Build the React frontend:

```bash
npm run build
```

Start the production Express server:

```bash
npm start
```

In production, Express serves both the built React frontend and the API from the same deployed application.

## Cloud Deployment

- **Platform:** Render
- **Public URL:** https://ai-capsule-wocy.onrender.com/
- **OAuth callback URL:** https://ai-capsule-wocy.onrender.com/auth/github/callback
- **Storage approach:** SQLite database stored on the Render service filesystem. Because Render free web services use an ephemeral filesystem, the database may be reset after a restart or redeployment.

The intended deployment uses one public application URL for both the React frontend and Express backend. This keeps the frontend and API on the same origin and simplifies the required JWT cookie configuration.

If SQLite is deployed on an ephemeral filesystem, the database may be reset after a restart or redeployment. This limitation will be documented based on the final deployment configuration.

## Environment Variables

The application uses the following environment variables:

```text
PORT
NODE_ENV
JWT_SECRET
JWT_EXPIRES_IN
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL
FRONTEND_URL
DB_FILE
```

Only the variable names should be shown in the repository and demonstration video. Secret values must not be committed or displayed.

## AI-Assisted Development

I used ChatGPT during development to assist with project scaffolding, React component structure, Express route design, SQLite queries, GitHub OAuth and JWT integration, CSS, testing, and debugging.

ChatGPT was also used to explain the authentication flow, including the purpose of the GitHub OAuth Client ID and Client Secret, the role of the application JWT, the difference between the GitHub access token and the Express-issued JWT, the purpose of JWT_SECRET, and how the protected API retrieves the authenticated user identity from `req.user.sub`.

These explanations were used to help me understand and verify the security flow rather than only relying on generated code.

### Problem identified and corrected

### Problem 1: JWT Cookie Configuration

During development, I identified an issue with the JWT cookie configuration. The cookie was initially configured with `secure: true` for all environments. This caused the authentication cookie to not work correctly during local development because the local application uses HTTP rather than HTTPS.

I corrected the configuration so that the cookie uses `secure: false` during local development and `secure: true` when `NODE_ENV=production`. This allowed local OAuth and JWT authentication to work correctly while still keeping the production cookie secure.

### Problem 2: GitHub Avatar Blocked by Content Security Policy

After deploying the application to Render, the GitHub profile avatar was not displayed even though the `/api/me` endpoint returned the correct `avatar_url`.

The issue was caused by Helmet's Content Security Policy in production. The default policy blocked images loaded from `https://avatars.githubusercontent.com`, while the same avatar worked locally because CSP was disabled during development.

I corrected the Helmet configuration by explicitly allowing GitHub avatar images in the `img-src` directive. After redeploying the application, the avatar displayed correctly while the Content Security Policy remained enabled.

### OAuth and JWT verification

OAuth and JWT behaviour were checked by confirming that:

- GitHub OAuth returns successfully to the application
- Express creates a separate application JWT after OAuth login
- The JWT is stored in the `token` HttpOnly cookie
- Missing JWT requests return `401 Unauthorized`
- Invalid JWT requests return `401 Unauthorized`
- Authenticated CRUD requests work after login

### CRUD and ownership verification

All four capsule CRUD routes use the same JWT authentication middleware.

- CREATE stores `req.user.sub` as the record owner
- READ filters records using the authenticated user ID
- UPDATE uses the record ID and authenticated user ID
- DELETE uses the record ID and authenticated user ID

The frontend does not send a `user_id` value.

### Implementation decision

I chose to serve the built React frontend and the Express API from the same deployed application. This will keep the frontend and backend on the same origin, which simplifies the OAuth callback and JWT cookie configuration. It also avoids unnecessary CORS and cross-origin cookie issues.

I chose SQLite because the assignment accepts it as the minimum relational database requirement, and the application only needs a small CRUD data model with per-user record ownership.

## Known Limitation

The application currently uses SQLite as its database. This works well for local development and satisfies the assignment requirements, but if the deployed application uses an ephemeral filesystem, the stored data may be lost after a service restart or redeployment.

The application also uses one simple `capsules` table and does not implement file upload. Screenshot evidence is stored as an optional URL instead. This keeps the application focused on the required authentication, CRUD, and deployment workflow.

Additional features such as advanced filtering, charts, and file upload were not prioritised because they are not required for the core assignment behaviour.
