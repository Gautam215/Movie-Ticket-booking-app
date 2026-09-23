# Eventra

Eventra is a MERN event booking and ticketing MVP built from the supplied PRD. It includes a secure cookie session, role-aware Express API, event discovery, expiring inventory holds, server-side demo payment verification, QR ticket payloads, organizer/admin views, and a reduced-motion 3D landing experience.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`; the API runs at `http://localhost:4000`.

Demo mode is enabled by default and uses a seeded in-memory repository. The Mongoose schemas in `server/src/models.ts` define the persistence boundary; wiring a production repository still requires MongoDB credentials and deployment configuration.

The optional Eventra help section uses Gemini through the server. Set `GEMINI_API_KEY` in the server environment or GitHub Secrets; the key is never sent to the browser. `GEMINI_MODEL` defaults to `gemini-2.0-flash`.

The home and Discover views include the Halo Reel movie browser. Set `TMDB_API_KEY` in the server environment to load upcoming Bollywood, Tollywood, and Hollywood metadata and posters from The Movie Database (TMDB); without it, the API serves a deterministic demo catalog so the experience remains available locally. TMDB does not expose theater ticket prices, so Eventra displays an estimated starting ticket price by industry.

Google Sign-In uses the Firebase Web SDK. Copy `client/.env.example` to `client/.env.local` and fill in the `VITE_FIREBASE_*` values from the Firebase web app configuration; the values are read at build time and are never hardcoded in source. Enable Google under Firebase Authentication providers and add the local or deployed client domain to Firebase Authentication authorized domains. The Firebase popup authenticates the Google account, then Eventra establishes its existing server session for the demo marketplace.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

Demo accounts are seeded in memory:

- `demo@eventra.test` / `DemoPass123!` attendee
- `organizer@eventra.test` / `DemoPass123!` organizer
- `staff@eventra.test` / `DemoPass123!` entry staff
- `admin@eventra.test` / `DemoPass123!` administrator

## API Surface

The server exposes health, email/social auth, password-reset request, event and movie discovery, organizer event creation and publishing, inventory holds, idempotent demo payments, bookings, QR ticket access, ticket validation, admin event review, and admin summary routes under `/api`. All state-changing request bodies are validated with Zod and authentication uses an httpOnly cookie rather than browser storage.

The login page's Google button uses Firebase Authentication when configured; GitHub remains a server-backed demo social session. The Eventra server session handoff is demo-mode behavior and should verify Firebase ID tokens server-side before production use.

The demo UI includes attendee QR ticket access, an entry-staff scanner, an organizer create-event form, and an admin moderation queue. The help panel uses Gemini when configured and a deterministic local response layer in demo mode when it is not.
