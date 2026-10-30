# AI Capsule

**A private workspace for organising, reviewing, and improving AI prompts.**

AI Capsule is a full-stack web application that helps users build a searchable-by-review *personal collection* of prompts and the results they produce. Users sign in with GitHub, manage their prompt records, and track whether a prompt has been reviewed or improved. Each user's library is isolated through server-side authentication and record ownership checks.

**Live application:** [AI Capsule on Render](https://ai-capsule-wocy.onrender.com/)

> **Deployment note:** The app uses SQLite on a Render service filesystem. Data may be lost when the service restarts or redeploys if persistent storage is not configured. The public deployment may also take time to wake up.

## Features

- **GitHub sign-in:** OAuth-based authentication with an application-issued JWT stored in an `HttpOnly` cookie.
- **Private prompt library:** Create, view, edit, and delete prompt records associated with the signed-in user.
- **Prompt tracking:** Record the project, title, version, prompt content, response summary, category, usefulness, review status, and improvement status.
- **Supporting context:** Attach a screenshot URL and notes to individual records.
- **Protected dashboard:** Authenticated routes and API endpoints restrict access to private data.
- **Health endpoint:** A public endpoint provides a simple service health check.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express |
| Database | SQLite |
| Authentication | GitHub OAuth, JSON Web Tokens (JWT) |
| Security | `HttpOnly` cookies, Helmet, OAuth state validation, server-side JWT verification |
| Deployment | Render |

## Architecture

```text
                   ┌──────────────────┐
                   │   React + Vite   │
                   │  Web interface   │
                   └────────┬─────────┘
                            │ HTTP requests
                            ▼
                   ┌──────────────────┐
                   │ Node.js / Express│
                   │  REST API        │
                   └──┬───────────┬───┘
                      │           │
           OAuth flow │           │ Authenticated CRUD
                      ▼           ▼
                ┌──────────┐  ┌──────────┐
                │  GitHub  │  │  SQLite  │
                │  OAuth   │  │ Capsules │
                └──────────┘  └──────────┘
```

After a successful GitHub OAuth callback, Express creates its own JWT containing the GitHub user ID in the `sub` claim. The JWT is stored in a `token` cookie. Authentication middleware verifies the JWT on protected requests; database queries use the verified user ID to scope record access.

The GitHub access token used during OAuth is **not** the same token as the JWT issued by the application.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- GitHub account and a [GitHub OAuth App](https://github.com/settings/developers)

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file:

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Configure the values in `.env`:

```dotenv
PORT=3000
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=2h
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
FRONTEND_URL=http://localhost:5173
DB_FILE=./data/ai-capsule.db
```

In the GitHub OAuth App settings, use:

| Setting | Local development value |
| --- | --- |
| Homepage URL | `http://localhost:5173` |
| Authorization callback URL | `http://localhost:3000/auth/github/callback` |

Never commit `.env` or real credentials to the repository.

### 3. Run the application

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Express API | `http://localhost:3000` |

During development, Vite proxies application API and authentication requests to Express.

### Production build

```bash
npm run build
npm start
```

In production, Express serves the built frontend and API from the same application origin.

## API Reference

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Service health check |
| `GET` | `/api/capsules` | Required | List the current user's capsules |
| `POST` | `/api/capsules` | Required | Create a capsule |
| `PUT` | `/api/capsules/:id` | Required | Update an owned capsule |
| `DELETE` | `/api/capsules/:id` | Required | Delete an owned capsule |

Authentication endpoints also handle GitHub sign-in, the OAuth callback, and logout. The web interface provides a public landing page (`/login` initiates sign-in) and a protected dashboard (`/dashboard`).

### Capsule data model

Each record stores:

- `user_id`, `project_name`, `prompt_title`, `prompt_text`
- Optional metadata: `prompt_version`, `response_summary`, `category`, `usefulness`, `screenshot_url`, `notes`
- Workflow flags: `reviewed`, `improved`
- `created_at` timestamp

The SQLite database is initialised on server startup. The default local file is `./data/ai-capsule.db`.

## Security and Data Ownership

- GitHub OAuth includes `state` validation.
- Express issues and verifies its own signed JWT.
- JWTs are stored in `HttpOnly` cookies; the cookie's `Secure` attribute is enabled in production over HTTPS and disabled for local HTTP development.
- Protected endpoints reject missing or invalid JWTs with `401 Unauthorized`.
- The backend obtains the owner from the verified JWT (`req.user.sub`), never from client-supplied `user_id` data.
- Read, update, and delete queries are scoped to the authenticated user.
- Helmet configures security headers, including a Content Security Policy that permits GitHub avatar images.

### Security checks

The following requests were verified against the deployed application to return `401 Unauthorized`:

```bash
# No session cookie
curl -i https://ai-capsule-wocy.onrender.com/api/capsules

# Invalid session token
curl -i -H "Cookie: token=fake-token-123" \
  https://ai-capsule-wocy.onrender.com/api/capsules
```

Local testing also covered GitHub login, authenticated CRUD operations, protected dashboard access, and owner-scoped record handling.

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

## Engineering Highlights

**Authentication versus authorisation:** GitHub confirms identity, while the application's JWT authenticates API requests. User-scoped SQL operations enforce access boundaries between accounts.

**Environment-aware cookies:** Secure cookies protect production HTTPS sessions without breaking local HTTP development.

**Content Security Policy:** GitHub profile avatars initially failed to load in production because of CSP restrictions. The allowlist was adjusted for GitHub's avatar host while keeping CSP enabled.

**Single-origin deployment:** Serving the React build and Express API from one origin simplifies OAuth callbacks and session-cookie handling.

## Limitations and Potential Improvements

AI Capsule currently uses a small SQLite-backed data model and stores screenshot references as URLs rather than uploading files. Persistence on the current Render filesystem is not guaranteed across restarts or redeployments.

Potential future improvements include a managed persistent database, prompt search and filtering, file uploads, and automated tests for authentication and user-level access control.

## License

No license has been specified for this repository.
