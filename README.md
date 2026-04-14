# Deadlock Detection & Recovery System Simulator

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

An interactive, visual simulator for Operating System deadlock scenarios using Resource Allocation Graphs (RAG). Built with **D3.js** and modern **Vanilla JavaScript**.

![Demo Placeholder](https://via.placeholder.com/800x400?text=Deadlock+Simulator+UI+Demo)

## 🚀 Features

- **Interactive Graph Engine**: Create Processes and Resources with a single click.
- **Dynamic Visualization**: Force-directed layout with real-time updates using CSS Glassmorphism.
- **Deadlock Detection (DFS)**: 
  - One-click instant detection.
  - **Step-through Traversal**: Watch the algorithm visit and backtrack through nodes.
- **Event Logging**: Historical record of all simulator actions.
- **Local Dev Server**: Optimized for modern ES Modules.

## 🛠️ Tech Stack

- **Logic**: Vanilla JavaScript (ESM)
- **Visualization**: D3.js (Data-Driven Documents)
- **Styling**: Premium Glassmorphism UI (Pure CSS)
- **Engine**: Custom Graph & Detection Engines

## 🏃 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for serving the files)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/dheerajpatel56/Deadlock-Mech-Sim.git
   cd Deadlock-Mech-Sim
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗺️ Roadmap

- [x] **Phase 1**: Graph Foundation & Visualization.
- [x] **Phase 2**: Single-Instance Deadlock Detection (DFS).
- [ ] **Phase 3**: Multi-Instance Resources & Banker's Algorithm.
- [ ] **Phase 4**: Recovery Engine (Termination & Preemption).
- [ ] **Phase 5**: Scenario Save/Load & Undo/Redo.
- [ ] **Phase 6**: Rollback & Final Polish.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Developed for Educational & Analytical OS Simulation.*
## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
