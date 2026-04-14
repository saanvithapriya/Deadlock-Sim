# Architecture Research: Deadlock Simulator

## Component Boundaries

### 1. Graph Engine (M-01)
- **Responsibility**: Maintain the RAG data structure (Adjacency List).
- **State**: Nodes, Edges, Instance Counts, Process Status.
- **Methods**: `addNode()`, `addEdge()`, `removeNode()`, `getSnapshot()`.

### 2. Detection Engine (M-02)
- **Responsibility**: Pure logic for identifying deadlocks.
- **Inputs**: Graph Snapshot.
- **Algorithms**: DFS (Cycle Finding), Banker's (Safety Check).
- **Outputs**: `DeadlockResult` (isDeadlocked, cyclePaths, affectedNodes).

### 3. Recovery Engine (M-03)
- **Responsibility**: Strategy implementation for breaking deadlocks.
- **Strategies**: `terminate()`, `preempt()`, `rollback()`.
- **Integrity**: Must re-trigger detection after every mutation.

### 4. Visualization Engine (M-04)
- **Responsibility**: Render state using D3.js/SVG.
- **Logic**: Force-directed layout, zoom/pan handler, highlight layers.
- **Animation**: Step-by-step playback of algorithm events.

### 5. Controller & State (M-05)
- **Responsibility**: Orchestration and state machine (BUILD -> DETECT -> RECOVER).
- **History**: Undo/Redo stack manager.

## Data Flow
1. **User Action** → Graph Engine (Mutates)
2. **Graph Engine** → Visualization Engine (Re-renders)
3. **Trigger Detection** → Detection Engine (Calculates) → Result
4. **Result** → Visualization Engine (Highlights)
5. **Apply Recovery** → Recovery Engine (Mutates Graph) → Cycle back to (1)

---
*Confidence: High*
