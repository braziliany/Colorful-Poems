# 1 Scriptable Widget Development Rules

## 1.1 Project

This is an iOS Scriptable medium-size widget written in JavaScript.

Main source file:

- `src/widget.js`

## 1.2 Goals

- Keep the current visual design and feature set.
- Maintain compatibility with the latest Scriptable and iOS.
- Fix bugs without unexpectedly changing the UI.
- Ensure every image passed to `addImage()` is a Scriptable `Image`.
- Never use browser-only APIs such as `document`, `window`, HTML, CSS, or Font Awesome.
- Use `SFSymbol.named()` for system icons.

## 1.3 Current features

- Caiyun weather
- Weather warnings
- Current and high/low temperatures
- Humidity
- Comfort index
- Ultraviolet index
- Air quality
- Sunrise and sunset
- Lunar calendar
- Daily poetry
- Calendar events
- Reminders
- Battery percentage
- Photo background
- Transparent widget background

## 1.4 UI constraints

- Preserve the existing horizontal two-column layout.
- Preserve current colors, font sizes, spacing, and rounded background appearance.
- Target the medium Scriptable widget.
- Do not redesign the interface unless explicitly requested.
- Prevent important content from overflowing or being truncated unnecessarily.

## 1.5 Compatibility rules

- Add null and undefined protection for all remote API fields.
- Network failures must show fallback content instead of crashing.
- Invalid SF Symbol names must use a fallback symbol.
- Missing background images must use a fallback color.
- Do not use Node.js-only modules in the final Scriptable source.
- Keep the final `src/widget.js` as one directly runnable Scriptable script.

## 1.6 Workflow

Before editing:

1. Read the full source.
2. Identify the exact cause.
3. Explain the intended changes briefly.
4. Preserve unrelated code.

After editing:

1. Review the complete diff.
2. Check for undefined property access.
3. Check every `addImage()` input.
4. Check Scriptable API compatibility.
5. Update `README.md` when behavior changes.