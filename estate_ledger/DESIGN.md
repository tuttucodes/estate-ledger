# Design System Specification: Editorial Fintech & Property Management

## 1. Overview & Creative North Star: "The Architectural Curator"
This design system moves away from the rigid, boxed-in nature of traditional fintech. Our Creative North Star is **The Architectural Curator**. We treat the mobile screen not as a flat canvas, but as a three-dimensional space defined by light, layering, and editorial intent. 

By leveraging **Manrope** for structured, authoritative headlines and **Inter** for high-legibility data, we create a rhythmic "editorial" feel. We break the "template look" through intentional asymmetry—using generous white space and varying card heights to guide the eye, rather than forcing elements into a repetitive grid. This is property management reimagined as a premium concierge service.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a deep, authoritative Indigo (`primary`), balanced by an expansive suite of Surface tones that allow for sophisticated layering.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. 
*   *Example:* A `surface-container-low` section sitting on a `surface` background provides all the definition a user needs without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper.
*   **Base:** `surface` (#f7f9fb)
*   **Level 1 (Sections):** `surface-container-low` (#f2f4f6)
*   **Level 2 (Interactive Cards):** `surface-container-lowest` (#ffffff)
*   **Level 3 (Overlays/Popovers):** `surface-bright` (#f7f9fb)

### The Glass & Gradient Rule
To move beyond a "standard" feel, use **Glassmorphism** for floating elements (e.g., Bottom Navigation or Sticky Headers). 
*   **Implementation:** Use `surface` at 80% opacity with a `20px` backdrop blur.
*   **Signature Textures:** Main CTAs or Hero backgrounds should utilize a subtle linear gradient: `primary` (#24389c) to `primary_container` (#3f51b5) at a 135-degree angle. This adds "soul" and dimension that flat color cannot replicate.

---

## 3. Typography: Editorial Authority
We use a dual-font strategy to balance character with utility.

*   **Display & Headlines (Manrope):** These are your "Editorial" voices. Use `display-md` for portfolio balances and `headline-sm` for property names. The geometric nature of Manrope conveys modern stability.
*   **Body & Labels (Inter):** These are your "Utility" voices. `body-md` is the workhorse for lease terms and transaction details. `label-sm` should be used for metadata, always in `on_surface_variant` (#454652) to maintain hierarchy.

**Hierarchy Tip:** Always skip a weight or size to create "High Contrast." Pair a `headline-sm` (Manrope, Bold) with a `body-sm` (Inter, Regular) for a sophisticated, magazine-style layout.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are a last resort. Depth is achieved primarily through "Tonal Stacking."

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The shift in hex code creates a natural, soft lift.
*   **Ambient Shadows:** When an element must "float" (e.g., a "Pay Now" FAB), use a custom shadow:
    *   *Shadow:* `0px 12px 32px rgba(25, 28, 30, 0.06)` (A tinted version of `on_surface`).
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border": `outline-variant` (#c5c5d4) at **15% opacity**. Never use 100% opacity strokes.
*   **Glassmorphism:** Use for persistent mobile elements to let the vibrant status colors (Green/Orange/Red) bleed through the background, keeping the user grounded in their financial context.

---

## 5. Components

### Buttons & CTAs
*   **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (1.5rem) roundedness. No border.
*   **Secondary:** `surface-container-high` background with `on_primary_fixed_variant` text.
*   **Tertiary:** Ghost style, no background, `primary` text.

### Cards & Lists (The "No-Divider" Rule)
*   **Cards:** Use `lg` (1rem) or `xl` (1.5rem) corner radius. 
*   **Forbid Dividers:** Do not use lines to separate list items. Use **Vertical White Space** (16px or 24px) or a subtle shift from `surface-container-low` to `surface-container-lowest` for each item.
*   **Fintech Specifics:** Transaction lists should use `label-md` for timestamps and `title-sm` for amounts, using `tertiary` (#004e33) for "Paid" and `error` (#ba1a1a) for "Overdue."

### Input Fields
*   **Style:** Minimalist. No bottom line, no full border. Use a `surface-container-highest` background with `md` (0.75rem) corners.
*   **Active State:** Transition background to `surface-container-lowest` and add a 2px "Ghost Border" of `surface_tint`.

### Property-Specific Components
*   **Status Pills:** Use `tertiary_container` for "Paid" with `tertiary_fixed_dim` text. The low-contrast, tone-on-tone look is more premium than high-contrast badges.
*   **Occupancy Gauges:** Use thin, 4px height progress bars with `xl` rounding, avoiding chunky "loading bar" looks.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use asymmetrical margins. For example, a 24px left margin and 16px right margin on a card can create a unique, modern rhythm.
*   **Do** lean into the "Tonal Tiers." Use `surface_dim` for non-interactive background areas to make active content pop.
*   **Do** use `on_surface_variant` for secondary text to ensure AA accessibility while maintaining visual softness.

### Don’t
*   **Don't** use pure black (#000000). Use `on_surface` (#191c1e) to keep the "Fintech-Modern" softness.
*   **Don't** use standard 4px or 8px shadows. They look "cheap." Stick to the large, diffused 32px+ blurs defined in Section 4.
*   **Don't** use lines to separate content. If you feel you need a line, use 16px of empty space instead. If it still feels messy, your hierarchy (typography) is the problem, not the lack of a line.