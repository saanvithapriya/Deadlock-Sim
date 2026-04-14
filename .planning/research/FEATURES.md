# Features Research: Deadlock Simulator

## Table Stakes (Must-Have)
- **Interactive Graph Constructor**: Add/remove process and resource nodes. Drag-and-drop layout.
- **Edge Direction**: Process → Resource (Request), Resource → Process (Assignment).
- **Multi-Instance Resources**: Resource nodes with internal "dots" representing capacity.
- **Cycle Detection**: DFS-based algorithm for single-instance resources.
- **Banker's Algorithm**: Safety algorithm for multi-instance resource deadlock detection.
- **Recovery Actions**: Manual/automatic process termination and resource preemption.
- **Visual Feedback**: Pulse/Red highlight for deadlocked nodes.

## Differentiators (Value-Add)
- **Step-Through Visualization**: Animate the detection algorithm (visited nodes, recursion stack).
- **Rollback Simulation**: Snapshots of graph state to revert to a "safe" state.
- **Scenario Presets**: Built-in common deadlock cases (Circular Wait, Dining Philosophers).
- **Undo/Redo**: History tracking for graph edits.
- **JSON Import/Export**: Save and share RAG states.

## Anti-Features (Not for v1.0)
- **Real-Time Requests**: No dynamic scheduling (static snapshots only).
- **Distributed Deadlocks**: Multi-machine/network simulation.
- **Cloud Sync**: No user accounts or server-side storage.

---
*Confidence: High*
