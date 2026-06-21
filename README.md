# Rural Automation

An educational incremental automation game where players program an autonomous drone to plant, harvest, and manage a grid-based farm.

👉 **[Live Demo](https://code-farm.vercel.app/)**

---

## 🎮 Game Concept

In **Rural Automation**, you control a farming drone using JavaScript code. The goal is to grow crops, gather resources, earn XP, and unlock upgrades in the tech tree to expand your grid.

### Features
*   **Programmable Drone**: Write scripts in a sandboxed Monaco Editor environment to control drone movement, scanning, tilling, planting, and harvesting.
*   **Real-time Stepping & Debugging**: Step through your script line-by-line or run it at up to 20x speed, watching execution line-markers and console logging.
*   **WebGL Rendering Engine**: Smooth, pixel-art tiles rendered via **PixiJS (v8)** running at 60 FPS, with interactive camera dragging and zooming.
*   **Interactive Tech Tree**: Unlock improvements, such as battery size, solar efficiency, and crop types, through an interactive node graph built with **React Flow**.
*   **Offline-first Asset Management**: Preloads assets and saves them to **IndexedDB** as Blobs, speeding up load times for web users.

---

## 🛠️ Tech Stack

*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
*   **Renderer**: [PixiJS v8](https://pixijs.com/) + `@pixi/react`
*   **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react`
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with local storage persistence)
*   **Tech Tree Graph**: [React Flow](https://reactflow.dev/) (`@xyflow/react`)
*   **Database / Cache**: IndexedDB for asset preloading

---

## 🚀 Running Locally

Follow these steps to set up and run the project locally on your machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rudrarathod/autoFarmJs.git
   cd autoFarmJs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/` (or the URL displayed in your terminal).

---

## 📁 Project Structure

```text
├── src
│   ├── components      # React UI components (common, sandbox, progress, splash)
│   ├── config          # Configurations for crops, base assets, and the skill tree
│   ├── engine          # Core game engine files:
│   │   ├── AssetCache.js      # IndexedDB cache helper
│   │   ├── AssetLoader.js     # Preloading & Blob URL mapper
│   │   └── DroneInterpreter.js# Sandboxed script runner
│   ├── pages           # Pages (HomePage, SandboxPage, ProgressTreePage)
│   ├── store           # Zustand global game store (gameStore.js)
│   ├── App.jsx         # App router and theme initializer
│   ├── index.css       # Core typography, themes, and styling
│   └── main.jsx        # App mount entry point
```

---

## 📝 Scripting API Reference

Your drone has access to two main global interfaces:

### `drone` Actions (Async)
*   `await drone.moveNext()`: Moves the drone to the next tile.
*   `await drone.moveTo(row, col)`: Moves the drone to the specified coordinate.
*   `await drone.till()`: Tills turf into soil.
*   `await drone.plant(cropName)`: Plants a crop (e.g. `'wheat'`).
*   `await drone.harvest()`: Harvests ripe crops or mines ores.
*   `await drone.charge()`: Recharges energy when on the charging pad at `(0, 0)`.
*   `await drone.wait(ms)`: Delays the next step by `ms` milliseconds.

### `sensor` Reads (Sync)
*   `sensor.isTurf()`: Returns `true` if the current tile is wild turf.
*   `sensor.isSoil()`: Returns `true` if the current tile is tilled soil.
*   `sensor.isRipe()`: Returns `true` if the current tile has a mature crop.
*   `sensor.isOre()`: Returns `true` if the current tile is an ore deposit.
*   `sensor.getEnergy()`: Returns the drone's current energy (0 - 100).
*   `sensor.position()`: Returns `{ row, col }` coordinates.
*   `sensor.gridSize()`: Returns the current grid dimensions.

### Console Logging
*   `log("message")`: Prints a custom message to the in-game console.
