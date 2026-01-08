# Greedy Dice Game - Design System

A mobile-first, accessible design system serving diverse user personas from 8 to 78 years old.

## Design Philosophy

### Principles
1. **Mobile-first** - Design for 320px first, enhance for larger screens
2. **Large touch targets** - Minimum 44px (prefer 48px) for all interactive elements
3. **Clear typography** - 18px minimum body text, high contrast
4. **Progressive disclosure** - Simple by default, details on demand
5. **Immediate feedback** - Every action has visible response
6. **Accessibility first** - WCAG 2.1 AA compliant

### User Personas Served
- **Harold (78)**: Large text, high contrast, simple interactions
- **Maya (8)**: Visual feedback, learning support, forgiving UX
- **Derek (50)**: Polished, efficient, responsive
- **Jennifer (50)**: Consistent, accessible, intentional design

---

## Typography

### Scale (1.25 ratio, 18px base)
```css
--font-size-xs:   14px  /* Legal text only */
--font-size-sm:   16px  /* Secondary text */
--font-size-base: 18px  /* Body text (minimum for accessibility) */
--font-size-lg:   22px  /* Emphasized text */
--font-size-xl:   28px  /* Section headers */
--font-size-2xl:  36px  /* Page titles */
--font-size-3xl:  44px  /* Hero text */
--font-size-4xl:  64px  /* Splash/logo */
```

### Weights
```css
--font-weight-normal:   400
--font-weight-medium:   500
--font-weight-semibold: 600
--font-weight-bold:     700
```

### Line Heights
```css
--line-height-tight:   1.2   /* Headings */
--line-height-normal:  1.5   /* Body text */
--line-height-relaxed: 1.75  /* Long-form */
```

---

## Spacing

### Scale (4px base unit)
```css
--space-0: 0
--space-1: 4px   /* Tight gaps */
--space-2: 8px   /* Default gap */
--space-3: 12px  /* Comfortable gap */
--space-4: 16px  /* Section padding */
--space-5: 24px  /* Major sections */
--space-6: 32px  /* Page margins */
--space-7: 48px  /* Hero spacing */
--space-8: 64px  /* Extra large */
```

---

## Color Palette

### Semantic Colors
```css
/* Primary - Success, positive actions */
--color-primary: #22c55e
--color-primary-hover: #16a34a
--color-primary-light: rgba(34, 197, 94, 0.15)

/* Secondary - Information, navigation */
--color-secondary: #3b82f6
--color-secondary-hover: #2563eb
--color-secondary-light: rgba(59, 130, 246, 0.15)

/* Accent - AI, special states */
--color-accent: #8b5cf6
--color-accent-hover: #7c3aed
--color-accent-light: rgba(139, 92, 246, 0.15)

/* Warning - Banking, caution */
--color-warning: #f59e0b
--color-warning-hover: #d97706
--color-warning-light: rgba(245, 158, 11, 0.15)

/* Danger - Bust, errors */
--color-danger: #ef4444
--color-danger-hover: #dc2626
--color-danger-light: rgba(239, 68, 68, 0.15)
```

### Surface Colors
```css
--color-background: #1a1a2e
--color-background-alt: #16213e
--color-surface: rgba(255, 255, 255, 0.05)
--color-surface-hover: rgba(255, 255, 255, 0.08)
--color-surface-active: rgba(255, 255, 255, 0.12)
```

### Text Colors
```css
--color-text-primary: #ffffff
--color-text-secondary: rgba(255, 255, 255, 0.7)
--color-text-tertiary: rgba(255, 255, 255, 0.5)
--color-text-muted: rgba(255, 255, 255, 0.4)
```

---

## Border Radius

```css
--radius-sm:   6px   /* Small elements */
--radius-md:   8px   /* Buttons, inputs */
--radius-lg:   12px  /* Cards */
--radius-xl:   16px  /* Major cards */
--radius-2xl:  24px  /* Modal, overlays */
--radius-full: 9999px /* Pills, circles */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2)
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.25)
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3)

/* Glow effects for interactive elements */
--shadow-glow-primary: 0 0 20px rgba(34, 197, 94, 0.4)
--shadow-glow-secondary: 0 0 20px rgba(59, 130, 246, 0.4)
--shadow-glow-accent: 0 0 20px rgba(139, 92, 246, 0.4)
```

---

## Touch Targets

```css
--touch-target-min: 44px  /* WCAG minimum */
--touch-target: 48px      /* Comfortable */
--touch-target-lg: 56px   /* Large/primary actions */
```

---

## Responsive Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| Mobile | < 600px | Single column, stacked layout |
| Tablet | 600-1023px | Two columns, sidebar visible |
| Desktop | 1024px+ | Full layout, generous spacing |
| Large Desktop | 1440px+ | Maximum content width |

---

## Component Patterns

### Buttons

```jsx
/* Primary action */
<button className="btn btn-primary">Roll Dice</button>

/* Secondary action */
<button className="btn btn-secondary">Start Game</button>

/* Warning/banking action */
<button className="btn btn-warning">Bank Points</button>

/* Ghost/subtle action */
<button className="btn btn-ghost">Cancel</button>

/* Sizes */
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
<button className="btn btn-xl">Extra Large</button>
```

### Cards

```jsx
/* Basic card */
<div className="card">Content</div>

/* Raised card */
<div className="card card-raised">Important content</div>

/* Highlighted card */
<div className="card card-highlight">Active item</div>
```

### Die Component

```jsx
<Die
  value={5}           // 1-6
  selected={false}    // Visual selection state
  disabled={false}    // Non-interactive
  dimmed={false}      // Placeholder style
  scoringHint={true}  // Highlight as scoring
  rolling={false}     // Animation state
  size="md"           // sm | md | lg
/>
```

---

## Accessibility

### Focus States
- All interactive elements have visible focus ring
- Focus uses `outline: 3px solid var(--color-secondary)`
- Outline offset of 2px for visibility

### ARIA Patterns
- Buttons use `aria-pressed` for toggle states
- Dialogs use `aria-modal="true"` and `aria-labelledby`
- Progress indicators use semantic HTML where possible
- Die buttons announce value and state to screen readers

### Motion
- All animations respect `prefers-reduced-motion`
- Essential state changes use minimal animation
- Decorative animations are optional

### Color Contrast
- All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large)
- High contrast mode increases border and text opacity
- Interactive elements never rely on color alone

---

## Future Considerations

### Sound Effects
- Dice roll: Satisfying clatter sound
- Score increase: Positive chime
- Bust: Negative buzz
- Victory: Celebration fanfare
- All sounds should be optional and respect device mute

### Haptics
- Light tap for die selection
- Medium tap for roll button
- Strong feedback for bust/score events
- Respect system haptic settings

### Multiplayer
- Player avatars/colors for distinction
- Turn notifications (push, sound, visual)
- Chat or quick reactions
- Spectator mode

### Theming
- Light mode option
- High contrast mode
- Custom color themes
- Seasonal themes (holidays)
