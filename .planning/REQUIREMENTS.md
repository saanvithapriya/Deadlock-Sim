# Requirements: Deadlock Detection & Recovery Simulator

## Functional Requirements

### FR-GE: Graph Engine (Resource Allocation Graph Construction)
- [ ] **GE-01**: Add process nodes (ID, Name, Priority).
- [ ] **GE-02**: Add resource nodes (ID, Name, Total Instances).
- [ ] **GE-03**: Support Request edges (Process -> Resource) and Assignment edges (Resource -> Process).
- [ ] **GE-04**: Validate assignment edge count <= total instances for any resource.
- [ ] **GE-05**: Delete nodes/edges with automatic cleanup of connected links.
- [ ] **GE-06**: Undo/Redo for graph edits (min 50 actions).
- [ ] **GE-07**: Save/Load RAG state as JSON.

### FR-DE: Detection Engine (Deadlock Cycle Detection)
- [ ] **DE-01**: Detect cycles using DFS for single-instance resources.
- [ ] **DE-02**: Detect unsafe states using Banker's Safety Algorithm for multi-instance resources.
- [ ] **DE-03**: Identify all distinct cycles/deadlocked processes.
- [ ] **DE-04**: Display cycle path nodes (e.g., P1 -> R1 -> P2 -> R2 -> P1).
- [ ] **DE-05**: Show "Safe Sequence" when no deadlock is found.

### FR-RE: Recovery Engine (Deadlock Recovery Strategies)
- [ ] **RE-01**: Process Termination (Manual/Sequential/All-at-once).
- [ ] **RE-02**: Resource Preemption (Victim selection based on priority).
- [ ] **RE-03**: Re-run detection automatically after each recovery step.
- [ ] **RE-04**: Rollback to a safe checkpoint state.

### FR-UI: Visualization & Interaction
- [ ] **UI-01**: High-fidelity RAG rendering (Circles for Processes, Rectangles for Resources).
- [ ] **UI-02**: Visual indicator for resource instances (dots).
- [ ] **UI-03**: Highlight deadlocked nodes and cycles in RED.
- [ ] **UI-04**: Pan/Zoom and Drag-and-drop layout.
- [ ] **UI-05**: Step-by-step animation of detection/recovery.

## Non-Functional Requirements

### NFR-PF: Performance
- [ ] **PF-01**: Detection < 200ms for up to 100 nodes.
- [ ] **PF-02**: Continuous 60fps graph interaction.

### NFR-RL: Reliability
- [ ] **RL-01**: Deterministic results for given graph input.
- [ ] **RL-02**: Validated graph state (no illegal edges).

### NFR-PO: Portability
- [ ] **PO-01**: Fully client-side; no server needed.
- [ ] **PO-02**: Responsive design (Desktop/Tablet).

---
*Last updated: 2026-03-19 after research*
