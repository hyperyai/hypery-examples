# Hypery Integration Patterns

This workspace demonstrates **two standard OAuth integration patterns** for the Hypery.

---

## 📱 Pattern 1: Frontend Direct Access (chat app)

**Best for:** SPAs, mobile apps, quick prototypes, real-time chat

### Architecture
```
User Browser → Chat Frontend → Core Hypery API
                              ↑ (OAuth + PKCE)
```

### Security: PKCE (Proof Key for Code Exchange)
- No `client_secret` needed
- Code verifier generated client-side
- Secure for public clients (browsers, mobile)

### Implementation
See: `chat/`

**Key file:** `chat/src/lib/oauth.ts`
```typescript
// Direct API call from frontend
const response = await fetch(`${AUTH_URL}/api/oauth/token`, {
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,  // PKCE verifier
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    // NO client_secret - public client
  })
});
```

### Pros ✅
- Lower latency (no middleware hop)
- Simpler architecture
- Lower cost (no backend processing)
- Industry standard for AI APIs (OpenRouter, Replicate, etc.)

### Cons ⚠️
- Limited backend control
- Access token visible in browser (mitigated by short expiry)

### Use When
- Building end-user applications
- Real-time chat/streaming apps
- Cost optimization is important
- Low latency is critical

---

## 🏢 Pattern 2: Backend Proxy (imagine app)

**Best for:** Enterprise apps, third-party integrations, apps needing custom logic

### Architecture
```
User Browser → Imagine Frontend → Imagine Backend → Core Hypery API
                                 ↑ (stores client_secret)
```

### Security: Confidential Client
- `client_secret` stored server-side
- Frontend only gets short-lived tokens
- Refresh tokens never exposed to browser

### Implementation
See: `imagine/`

**Key files:**
- Frontend: `imagine/src/lib/oauth.ts`
- Backend: `imagine/src/app/api/auth/token/route.ts`

```typescript
// Frontend calls own backend
const response = await fetch('/api/auth/token', {
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier
  })
});

// Backend forwards to core with client_secret
export async function POST(request: NextRequest) {
  const { code, code_verifier } = await request.json();
  
  return fetch(`${CORE_APP_URL}/api/oauth/token`, {
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,  // Securely stored
      redirect_uri: REDIRECT_URI
    })
  });
}
```

### Pros ✅
- Client secret never exposed
- Can add rate limiting, caching, business logic
- Better monitoring and control
- Refresh tokens stored server-side
- Standard for enterprise OAuth

### Cons ⚠️
- Extra network hop (higher latency)
- More infrastructure to maintain
- Higher costs (backend processing)

### Use When
- Building third-party integrations
- Enterprise/B2B customers
- Need custom backend logic (rate limiting, analytics)
- Maximum security required
- Managing multiple AI providers in backend

---

## 🔧 Core API Support

The Hypery core supports **both patterns simultaneously**:

### Token Endpoint: `/api/oauth/token`

**Accepts:**
1. **Public Client (PKCE)** - `code_verifier` present, `client_secret` optional
2. **Confidential Client** - `client_secret` present

```typescript
// Schema validation (src/app/api/oauth/token/route.ts)
{
  grant_type: 'authorization_code',
  code: string,
  redirect_uri: string,
  client_id: string,
  client_secret?: string,      // Optional for public clients
  code_verifier?: string,       // Required for PKCE
}
```

---

## 🚀 Quick Start

### For Frontend Developers (Pattern 1)
```bash
cd chat
npm install
npm run dev
# Visit http://localhost:3002
```

### For Backend Developers (Pattern 2)
```bash
cd imagine
npm install
npm run dev
# Visit http://localhost:3007
```

---

## 📊 Comparison Table

| Feature | Frontend (chat) | Backend (imagine) |
|---------|----------------|-------------------|
| **Latency** | Lower (direct) | Higher (extra hop) |
| **Cost** | Lower | Higher (backend processing) |
| **Security** | PKCE | Client Secret |
| **Complexity** | Simple | Moderate |
| **Backend Logic** | Limited | Full control |
| **Token Storage** | Browser | Server |
| **Best For** | End users | Enterprise |
| **Industry Examples** | OpenRouter, Replicate | Stripe, Twilio |

---

## 🔐 Security Notes

### Pattern 1 (Frontend)
- Uses PKCE to prevent authorization code interception
- Access tokens are short-lived (recommended: 15-60 min)
- Refresh tokens can be stored in `httpOnly` cookies or not used
- Suitable for trusted first-party apps

### Pattern 2 (Backend)
- Client secret never exposed to browser
- Refresh tokens stored securely server-side
- Can implement additional security layers (IP allowlisting, etc.)
- Required for third-party OAuth apps

---

## 📚 References

- **OAuth 2.0 RFC 6749**: https://tools.ietf.org/html/rfc6749
- **PKCE (RFC 7636)**: https://tools.ietf.org/html/rfc7636
- **OAuth 2.0 for Browser-Based Apps**: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps

---

## 💡 Recommendations

**Choose Pattern 1 (Frontend) if:**
- Building your own apps
- Cost and latency matter
- Real-time features needed
- Following modern AI API patterns

**Choose Pattern 2 (Backend) if:**
- Third-party integration
- Enterprise customers
- Need custom middleware logic
- Maximum security required
- Managing secrets for multiple services

**Most developers should start with Pattern 1** and only add Pattern 2 when specific requirements demand it.

