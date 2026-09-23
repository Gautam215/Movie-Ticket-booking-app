# Eventra Product Requirements

## Objective

Eventra is a mobile-first event marketplace for attendees, organizers, entry staff, and administrators. The MVP must make event discovery, ticket reservation, server-verified checkout, QR ticket access, and venue validation feel trustworthy and fast.

## MVP Boundaries

### Must Have

- Secure registration and login with role-aware protected routes.
- Searchable event discovery and event detail pages.
- Ticket quantity selection with expiring inventory holds.
- Server-side demo payment creation and verification with idempotent booking creation.
- Digital QR tickets and entry validation.
- Customer, organizer, and admin dashboard surfaces.
- Responsive, accessible UI with reduced-motion 3D fallback.

### Should Have

- Email verification and password reset provider integration.
- Favorites, richer analytics, refunds, and seat maps.

### Won't Have in MVP

- Dynamic pricing, social feeds, crypto payments, specialized venue editors, or AI event generation.

## Acceptance Criteria

- Given a valid account, when a user signs in, then the server sets an httpOnly session cookie and protected resources become available.
- Given an event with available inventory, when a user holds tickets, then the server decrements available inventory and assigns an expiry time.
- Given a valid active hold, when the demo payment is verified, then exactly one booking and one QR ticket are created.
- Given a valid ticket token, when authorized entry staff validate it, then the ticket is marked redeemed and cannot be redeemed again.
- Given a user without organizer or admin permissions, when they call a protected role endpoint, then the server returns 403 without leaking resource data.
