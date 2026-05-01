# Project Structure Documentation

This document explains the folder organization and the role of each file in the project, helping you navigate and understand the codebase more easily.

---

## 📂 Root Directory

| File | Role |
|------|------|
| `package.json` / `package-lock.json` | Node.js configuration. Lists all dependencies (React, Three.js, Firebase, Tailwind, etc.) and defines scripts such as `npm run dev`. |
| `vite.config.js` | Configuration for Vite, the build tool used to run the application. |
| `tailwind.config.js` / `postcss.config.js` | Configuration for Tailwind CSS, which handles UI styling. |
| `eslint.config.js` | Linter configuration for syntax and code quality checks. |
| `index.html` | Main HTML entry point where the React application is mounted. |

---

## 📂 src/ (Source Code)

All application code lives here: logic, UI, and 3D rendering.

### Main Files

| File | Role |
|------|------|
| `main.jsx` | First file executed — mounts `App.jsx` into `index.html`. |
| `App.jsx` | Root component. Assembles the 3D canvas, all UI overlays, the `DraftPipe` drawing mode, and the `LeadTimePopup`. Also handles Firebase hydration on startup. |
| `index.css` | Global styles: Tailwind base, component classes (`.glass`, `.btn-toolbar`, etc.) and light mode overrides (`[data-theme="light"]`). |
| `App.css` | Secondary CSS file (minimal, mostly reset). |

---

## 📂 src/components/ (2D User Interface)

Standard UI elements rendered as HTML overlays on top of the 3D canvas.

| File | Role |
|------|------|
| `Toolbar.jsx` | Top navigation bar. Contains nav buttons (Warehouses, Customers, Supply Chain, Stock DB), a **Light/Dark mode toggle** (☀️/🌙), and Reset Game. |
| `InfoPanel.jsx` | Side panel showing details of the selected node (stock, name, history, etc.). |
| `Timeline.jsx` | Bottom timeline: play/pause, step forward/back, scrub slider, bucket selector, and period length. Each period lasts **5 seconds**. |
| `Modal.jsx` | Generic wrapper for pop-up windows (manager forms). |
| `LeadTimePopup.jsx` | Small centered popup that appears right after a pipe is drawn directly on the scene. Lets the user set the lead time before the connection is confirmed and saved to Firebase. |

### 📂 managers/ (CRUD Forms)

Forms for managing game entities. Lists are **filtered by the current period** — only entities that were added at or before the current period are shown.

| File | Role |
|------|------|
| `WarehouseManager.jsx` | Add / Delete warehouses. Shows the period each warehouse was added (`Added W3`). |
| `CustomerManager.jsx` | Add / Delete customers. Shows the period each customer was added. |
| `StockManager.jsx` | Edit initial stock levels for warehouses. |
| `SupplyManager.jsx` | Add / Delete supply connections (pipes). Dropdowns only show nodes that exist at the current period. |

---

## 📂 src/scene/ (3D Scene)

Everything related to 3D rendering via React Three Fiber (Three.js).

| File | Role |
|------|------|
| `SceneBackground.jsx` | Scene environment: lighting, ground plane, and grid. Colors adapt to **light/dark mode** (white ground + black grid in light mode). |
| `CameraController.jsx` | Lets the user rotate, zoom, and pan the 3D view. |
| `WarehouseNode.jsx` | Blue cube representing a warehouse. Shows a **"+" button on hover** (blue, same colour as the node) to start drawing a pipe directly on the scene. In drawing mode, acts as a valid drop target (green ring). |
| `CustomerNode.jsx` | Amber/gold sphere representing a customer. In pipe-drawing mode, acts as a drop target (green ring). Clicking it completes the connection and opens `LeadTimePopup`. |
| `PipeConnection.jsx` | Animated tube + arrow cone connecting two nodes. Colour adapts to node theme. |
| `DraftPipe.jsx` | **New.** Temporary amber/yellow line rendered while the user draws a pipe directly on the scene (from a warehouse "+" drag). Follows the mouse in real-time via raycasting on the ground plane. Cancelled with Escape or a click on empty space. |

---

## 📂 src/store/ (Global State — Zustand)

Shared state across components, no prop drilling.

| File | Role |
|------|------|
| `useGameStore.js` | Central game state: warehouses, customers, pipes, current period, time settings, projections cache. All entities carry a `createdAtPeriod` timestamp. Persistence calls go to Firebase (`_persist`). |
| `useUIStore.js` | UI state: selected node, open modal, light/dark mode (`lightMode`), pipe drawing mode (`pipeDrawing`), and the pending pipe waiting for lead time input (`pendingPipe`). |

---

## 📂 src/simulation/ (Business Logic)

Game rules and supply chain algorithms.

| File | Role |
|------|------|
| `weekAdvance.js` | Logic executed when advancing one period: stock flows, demand fulfillment, history recording. **Only processes entities that exist at the current period** (`createdAtPeriod <= currentWeek`). |
| `projections.js` | Computes 10-period rolling stock projections and safety stock requirements. Receives only the currently visible entities. |
| `topology.js` | Topological sort of warehouse nodes to determine execution order (upstream → downstream). |

---

## 📂 src/db/ (Cloud Database — Firebase)

| File | Role |
|------|------|
| `firebase.js` | **Replaces IndexedDB.** Connects to Firebase Firestore. Exports `saveStateToDB`, `loadFromDB`, and `resetDatabase` — the same interface as the old local DB, so the rest of the app required minimal changes. |
| `firebaseConfig.js` | Firebase project credentials (API key, project ID, etc.). **Do not commit this file publicly if the project becomes open source.** |

> The game state is stored as a single Firestore document at `games/default`. You can view and edit it live in the [Firebase Console](https://console.firebase.google.com).

---

## 📌 Quick Navigation Reference

| Goal | Where to look |
|------|---------------|
| Change a 2D UI element | `src/components/` |
| Change 3D visuals or interactions | `src/scene/` |
| Change game / supply chain logic | `src/simulation/` |
| Change shared state or add a new action | `src/store/` |
| Change how data is saved / loaded | `src/db/` |
| Add light mode styles | `src/index.css` → `[data-theme="light"]` section |
| Change simulation speed | `src/components/Timeline.jsx` → `PERIOD_DURATION_MS` |
