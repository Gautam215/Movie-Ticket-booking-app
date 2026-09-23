# Eventra UI/UX Specification

## Design Contract

Eventra is a dark editorial event marketplace: midnight navy canvas, warm paper surfaces, electric lime for action, and coral for urgency. The 3D hero uses CSS perspective and floating event tiles rather than making WebGL the only way to understand the product.

## Tokens

- Canvas: `--color-ink-950`, elevated surfaces: `--color-ink-900` and `--color-paper-50`.
- Action: `--color-lime-400`; focus: `--color-cyan-300`; danger: `--color-coral-400`.
- Spacing: 4px base scale, named CSS variables.
- Radius: compact controls use `--radius-sm`; cards use `--radius-lg`; hero art uses `--radius-xl`.
- Type: display serif for editorial headlines, geometric sans for UI, monospace for metadata.

## Required States

- Loading: skeleton blocks with `aria-busy`.
- Empty: explicit explanation and next action.
- Error: concise message with retry action.
- Success: confirmation state with booking reference and QR ticket.
- Reduced motion: disable floating/tilt animation while keeping content and hierarchy intact.

## Responsive Rules

- 320px: single-column content, bottom action bar, no horizontal overflow.
- 768px: two-column event and checkout layouts.
- 1024px+: full navigation, analytics rail, and multi-column discovery.
