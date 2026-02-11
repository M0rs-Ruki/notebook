# PipesHub OAuth Sample Client

A production-ready sample application demonstrating the OAuth 2.0 Authorization Code flow with PKCE for PipesHub.

## 🎯 Overview

This TypeScript sample client shows how to integrate OAuth authentication with PipesHub. It implements:

- ✅ **OAuth 2.0 Authorization Code flow** with full PKCE support
- ✅ **Type-safe TypeScript** with generic types (no `any` types!)
- ✅ **Production-ready structure** with separation of concerns
- ✅ **Token exchange and refresh** flow
- ✅ **API calls** using access tokens
- ✅ **Security best practices** (XSS protection, CSRF protection, rate limiting)

## 📁 Project Structure

```
src/
├── types/                      # Type Definitions
│   ├── index.ts               # Central export
│   ├── http.ts                # HTTP types (HttpResponse<T>, HttpRequestOptions)
│   └── oauth.ts               # OAuth types (TokenResponse, OAuthAppConfig, etc.)
│
├── utils/                      # Utility Functions
│   ├── index.ts               # Central export
│   ├── http.ts                # HTTP request helper (makeRequest<T>)
│   ├── crypto.ts              # PKCE & security utilities
│   └── env.ts                 # Environment loader
│
├── config/                     # Configuration Management
│   └── index.ts               # App configuration (loadConfig, validateConfig)
│
├── scripts/                    # CLI Scripts
│   ├── create-oauth-app.ts    # OAuth app creation script
│   └── cleanup.ts             # Cleanup & server management
│
└── server.ts                   # Main Express server
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create an OAuth Application

You need an admin JWT token from PipesHub to create the OAuth app:

```bash
ADMIN_JWT_TOKEN=your_jwt_token npm run create-app
```

This will:
- Register a new OAuth application with PipesHub
- Save the `CLIENT_ID` and `CLIENT_SECRET` to a `.env` file
- Display the client credentials

### 3. Start the Sample Client

```bash
# Development mode (with ts-node)
npm run dev

# Production mode (compile + run)
npm start
```

The client will run at `http://localhost:8888`.

### 4. Test the OAuth Flow

1. Open `http://localhost:8888` in your browser
2. Click **"Login with PipesHub"**
3. Log in to PipesHub (if not already logged in)
4. Approve the requested permissions
5. You'll be redirected back with your access token
6. Test the API endpoints:
   - **Get Organization** - `/api/org`
   - **Get User Info** - `/api/userinfo`

## ⚙️ Configuration

Configuration can be set via environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLIENT_ID` | OAuth client ID | Required |
| `CLIENT_SECRET` | OAuth client secret | Required |
| `BACKEND_URL` | PipesHub backend URL | `http://localhost:3000` |
| `PORT` | Sample client port | `8888` |
| `ADMIN_JWT_TOKEN` | Admin token for cleanup | Optional |

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Run with ts-node (auto-reload) |
| **Build** | `npm run build` | Compile TypeScript to JavaScript |
| **Start** | `npm start` | Build and run in production mode |
| **Create App** | `npm run create-app` | Create OAuth app in PipesHub |
| **Cleanup** | `npm run cleanup` | Delete OAuth app and stop server |
| **Stop** | `npm run stop` | Stop the server only |

## 🔐 OAuth Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   User/Browser  │     │  Sample Client  │     │    PipesHub     │
│                 │     │  (port 8888)    │     │  (port 3000)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Click Login       │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. Generate PKCE     │                       │
         │     code_challenge    │                       │
         │                       │                       │
         │  3. Redirect to /authorize with PKCE          │
         │<──────────────────────┴───────────────────────┤
         │                                               │
         │  4. User logs in and approves                 │
         │───────────────────────────────────────────────>│
         │                                               │
         │  5. Redirect to /callback with code           │
         │<───────────────────────────────────────────────┤
         │                       │                       │
         │──────────────────────>│                       │
         │                       │  6. Exchange code     │
         │                       │     + code_verifier   │
         │                       │     for tokens        │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │  7. Access Token +    │
         │                       │     Refresh Token     │
         │                       │<──────────────────────┤
         │  8. Show tokens       │                       │
         │<──────────────────────┤                       │
         │                       │                       │
```

## 🔑 Requested Scopes

The sample client requests the following scopes:

- `org:read` - Read organization information
- `user:read` - Read user information
- `openid` - OpenID Connect
- `profile` - User profile information
- `email` - User email address
- `offline_access` - Refresh tokens for offline access

## 🌐 API Endpoints (Sample Client)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page with login button or token display |
| `/login` | GET | Initiates OAuth flow with PKCE |
| `/callback` | GET | OAuth callback handler (exchanges code for tokens) |
| `/logout` | GET | Clears tokens and logs out |
| `/api/org` | GET | Test API: Get organization info using OAuth token |
| `/api/userinfo` | GET | Test API: Get user info via OIDC /userinfo endpoint |
| `/admin` | GET | Admin panel for app management |
| `/admin/delete-app` | POST | Delete the OAuth application |
| `/admin/shutdown` | POST | Stop the sample server |
| `/admin/full-cleanup` | POST | Delete app and stop server |

## 🧹 Cleanup

### Via Web Interface

1. Navigate to `http://localhost:8888/admin`
2. Enter your admin JWT token
3. Choose an action:
   - **Delete OAuth App** - Removes the app from PipesHub
   - **Stop Server** - Stops the sample client
   - **Full Cleanup** - Does both

### Via Command Line

```bash
# Delete app and stop server
ADMIN_JWT_TOKEN=your_token CLIENT_ID=your_client_id npm run cleanup

# Just stop the server
npm run stop
```

## 🏗️ Architecture Highlights

### Type Safety

All HTTP responses use generic types for full type safety:

```typescript
// Generic HTTP response
interface HttpResponse<T = unknown> {
  status: number
  data: T  // Properly typed!
}

// Usage with type safety
const response = await makeRequest<TokenResponse>(url, options)
// response.data is automatically typed as TokenResponse ✅
```

### Modular Design

- **Types** - Separated into `http.ts` and `oauth.ts` for clarity
- **Utils** - Reusable functions (HTTP, crypto, env loading)
- **Config** - Centralized configuration with validation
- **Scripts** - Standalone CLI tools
- **Server** - Clean Express application

### Security Features

- ✅ **PKCE** - Proof Key for Code Exchange
- ✅ **State parameter** - CSRF protection
- ✅ **HTML escaping** - XSS prevention
- ✅ **Rate limiting** - Admin endpoint protection
- ✅ **Secret masking** - Secure logging

## 🛠️ Development

### Prerequisites

- **Node.js** v14 or higher
- **TypeScript** 4.x or higher
- **PipesHub backend** running on `http://localhost:3000`
- **PipesHub frontend** running on `http://localhost:3001`

### Type Checking

```bash
# Check types without building
npx tsc --noEmit
```

### Building

```bash
# Compile TypeScript
npm run build

# Output will be in dist/ directory
```

## 🔒 Security Notes

- This is a **sample application** for demonstration purposes
- In production:
  - ❌ Never store tokens in memory
  - ❌ Never expose secrets in URLs or logs
  - ✅ Use secure session management (Redis, secure cookies)
  - ✅ Use proper token storage (encrypted database)
  - ✅ Implement token rotation
  - ✅ Use HTTPS in production
- The `.env` file should **never** be committed to version control
- PKCE is implemented to protect against authorization code interception
- Rate limiting is applied to admin endpoints

## 🐛 Troubleshooting

### Connection Refused

Make sure the PipesHub backend is running:
```
Error: Connection refused to http://localhost:3000
```
**Solution:** Start the PipesHub backend server

### Invalid Client

Check that `CLIENT_ID` and `CLIENT_SECRET` match the registered OAuth app:
```
Error: invalid_client
```
**Solution:** Verify credentials in `.env` file or re-create the OAuth app

### Invalid State

The state parameter didn't match. This could indicate a CSRF attack or an expired session.
```
Error: Invalid state parameter
```
**Solution:** Try logging in again (states expire after one use)

### TypeScript Errors

If you see TypeScript compilation errors:
```bash
# Clean build
rm -rf dist/
npm run build
```

## 📚 Learn More

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect](https://openid.net/connect/)

## 📄 License

MIT

---

**Built with TypeScript ❤️ for production-ready OAuth integration**
