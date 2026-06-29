---
name: Radium Cinematic
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#baccb0'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#95d3ba'
  on-secondary: '#003829'
  secondary-container: '#0b513d'
  on-secondary-container: '#83c2a9'
  tertiary: '#eafff0'
  on-tertiary: '#003824'
  tertiary-container: '#69f6b9'
  on-tertiary-container: '#006f4c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-mono:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1440px
---

## Brand & Style

This design system targets high-end audio engineers, cinematic producers, and AI-driven sound designers. The personality is hyper-modern, technical, and immersive. 

The visual style is an aggressive evolution of **Glassmorphism**, characterized by extreme backdrop blurs and "hyper-glass" surfaces that feel like polished obsidian. The interface relies on the tension between a deep, ink-black void and high-energy "Radium Green" accents. It evokes the feeling of a futuristic cockpit or a professional studio environment where light is used as a functional indicator rather than just decoration.

## Colors

The palette is built on a "Dark Matter" foundation to maximize the luminosity of the accent colors.

- **Primary (Radium Green):** Used for critical actions, active states, and focus indicators. It should appear to "emit light" against the dark background.
- **Secondary (Dark Emerald):** Used for subtle grouping and less urgent interactive elements to provide depth without competing with the primary green.
- **Neutral:** A curated range of zinc-greys and deep blacks to maintain the "Pro-Tool" aesthetic.
- **Surface Containers:** Designed for high transparency. Use `surface_glass_base` with a minimum backdrop-blur of 20px to create the illusion of thick, translucent glass.

## Typography

This design system uses **Inter** exclusively to maintain a systematic and utilitarian feel. 

Large display sizes utilize tight letter spacing and heavy weights to create a "blocky" cinematic impact. For technical data and UI labels, use the `label-mono` style; while Inter is not a true monospaced font, the semi-bold weight and increased tracking at small sizes provide the legibility required for high-density audio metadata. Text color should stay primarily in the "Zinc" range (e.g., #E4E4E7) to prevent harsh contrast against the dark background.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a 12-column structure on desktop. 

- **Density:** High density is preferred for audio editing workflows. Use the 4px unit for internal component padding to keep the UI compact.
- **Margins:** Large outer margins on desktop create a "floating" effect for the central UI glass panels, emphasizing the depth against the background void.
- **Reflow:** On mobile, components stack vertically and glass panels lose their outer margins to maximize screen real estate, though the 20px backdrop-blur remains consistent to preserve the brand's material identity.

## Elevation & Depth

Depth is not achieved through shadows, but through **transparency and blur**. 

1.  **Background Layer:** Absolute black (#09090B) or very dark gradients.
2.  **Floating Elements:** Orbs or abstract shapes (as seen in the reference) can be placed behind glass surfaces to demonstrate the blur strength.
3.  **Glass Panels:** Use `surface_glass_base` with a 1px `surface_glass_border`. This border should have a "top-light" effect (linear gradient from more visible at the top to nearly invisible at the bottom).
4.  **Luminous Glow:** High-priority elements use an outer glow (`glow_primary`) instead of a traditional shadow to simulate light emission from the Radium Green.

## Shapes

The shape language is sophisticated and "smooth-tech." 

Standard components use a 0.5rem (8px) radius to feel approachable yet precise. Large glass cards and modal containers should use the `rounded-xl` (24px) setting to create the distinct "luxury glass" aesthetic seen in cinematic interfaces. Avoid sharp corners entirely to maintain the fluid, organic feel of the AI-driven brand.

## Components

- **Buttons:** Primary buttons are solid Radium Green with black text for maximum legibility. Ghost buttons use the `surface_glass_border` with a primary-colored glow on hover.
- **Input Fields:** Semi-transparent dark fills with a bottom-only border that illuminates to Radium Green when focused.
- **Glass Cards:** The signature component. High backdrop-blur (24px+), 1px subtle border, and a faint inner radial gradient to simulate light hitting the glass surface.
- **Audio Visualizers:** Should use the primary color with varying opacity levels. The peaks of the waveform should trigger a momentary glow effect.
- **Chips:** Small, pill-shaped indicators using the Secondary Dark Emerald with a low-opacity Radium Green border for "active" tags.