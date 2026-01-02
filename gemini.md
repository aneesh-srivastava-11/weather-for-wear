# Weather for Wear (Agentic Context)

## Project Vision
A minimalist, zero-maintenance weather application that focuses on **decisions** (what to wear) rather than raw data.

### Core Values
1.  **Lightweight:** No build steps, no heavy frameworks.
2.  **Robust:** "Unbreakable" code. Uses standard web APIs that won't change in a year.
3.  **Aesthetic:** Minimalist, monochromatic, typography-driven.
4.  **USP:** "Decision-First" - Tells you what to wear/do based on weather.

## Tech Stack (Strict)
- **Frontend:** HTML5, Vanilla JavaScript (ES Modules `type="module"` enabled).
- **Runtime:** Local Dev Server (`npx serve` or `python -m http.server`).
- **Styling:** TailwindCSS (via CDN) + Custom CSS Variables for themes.
- **API:** Open-Meteo (No API key required).
- **Icons:** Phosphor Icons or Lucide (via CDN).

## Coding Conventions
- **No Node Modules:** Do not use `npm install` for runtime dependencies.
- **Single Directory:** Keep structure flat and simple (`index.html`, `style.css`, `app.js`).
- **Error Handling:** Aggressive. If the API fails, show cached data or a friendly "Offline" message.
- **Comments:** Explain *why*, not *what*.

## Agentic Operational Rules
- **YOLO Mode / Autonomous Verification:** Do not guess about the environment. If unsure (e.g., "Do they have Python?"), *run the check command* (`python --version`) immediately. You have permission to execute read-only checks without asking.
- **Context Awareness:** Monitor the token budget but prioritize Grounded Truth over brevity.
- **Documentation Duty:** Maintain `overview.md`. Whenever architecture or logic changes significantly, update this file. It serves as a high-level educational map for the user.
- **Vision Recipe:** To see the user's latest screenshot, run this:
  `Copy-Item (Get-ChildItem "C:\Users\Ankit\Pictures\Screenshots" | Sort-Object CreationTime -Descending | Select-Object -First 1).FullName -Destination "debug_screenshot.png"`
  Then `read_file("debug_screenshot.png")` -> `Remove-Item "debug_screenshot.png"`.

## Current State
- [x] Project Initialized
- [x] Skeleton (HTML/CSS) created
- [x] API integration (Open-Meteo)
- [x] "Clothing Logic" implementation
- [x] Fix: Display City Name instead of Coordinates
- [x] Feature: Manual Location Search
- [x] Feature: Outfit Timeline
- [x] Polish: Glassmorphism & Skeletons
- [x] Feature: Activity & Sunglasses Logic

