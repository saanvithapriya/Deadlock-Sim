# Research Summary: Deadlock Simulator

## Key Findings

### Technology Stack
- **Choice**: Vanilla JavaScript + D3.js + SVG.
- **Rationale**: SVG provides crisp high-detail visualization for RAGs (crucial for "dots" in multi-instance resources) and easy interactivity. D3.js offers powerful layout and animation capabilities.

### Standard Features
- **Interactive constructor**: Users build the RAG.
- **Cycle Detection**: DFS (Single-instance) and Banker's Safety Algorithm (Multi-instance).
- **Recovery Manager**: Manual/Auto termination and preemption.
- **Presets**: Circular Wait, Dining Philosophers, etc.

### Architecture
- **Modular Engines**: Decoupled Graph, Detection, Recovery, and Visualization logic.
- **Strict Data Flow**: UI mutation -> Graph Engine -> Re-detect -> Re-render.

### Common Pitfalls
- **State Inconsistency**: Ensure request/assignment edges never exceed declared resource capacity.
- **Ambiguity**: Clearly distinguish between "Unsafe State" (Potential Deadlock) and "Actual Deadlock".

---
*Last updated: 2026-03-19 after initialization*
