# Eventra App Flow

```mermaid
stateDiagram-v2
  [*] --> Public
  Public --> Authenticated: login/register
  Authenticated --> Discovery: browse events
  Discovery --> EventDetails: choose event
  EventDetails --> HoldPending: select tickets
  HoldPending --> Checkout: hold succeeds
  Checkout --> PaymentPending: create payment
  PaymentPending --> Confirmed: server verification succeeds
  PaymentPending --> CheckoutError: provider failure
  Confirmed --> Ticket: open QR ticket
  Ticket --> Redeemed: staff validates
  Authenticated --> OrganizerWorkspace: organizer role
  Authenticated --> AdminWorkspace: admin role
```

## Core State Rules

- Holds expire after 10 minutes and are released before availability is reported.
- A booking is created only once for an idempotency key and verified payment reference.
- A redeemed ticket cannot be redeemed again.
- Session expiry returns users to `/login` without exposing protected data.
