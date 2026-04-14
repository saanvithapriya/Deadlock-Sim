# Roadmap: Deadlock Detection & Recovery Simulator

## Milestone 1: v1.0 Core Simulator

### Phase 1: Graph Engine & Visualization Foundation
- [ ] Implement `GraphEngine` (Nodes, Edges, Validation).
- [ ] Set up `VisualizationEngine` with D3.js (Force layout, basic nodes/edges).
- [ ] Add Process/Resource creation UI.

### Phase 2: Single-Instance Detection (DFS)
- [ ] Implement `DetectionEngine` cycle finding for single-instance resources.
- [ ] Add visual highlighting for detected cycles.
- [ ] Implement step-through animation for DFS traversal.

### Phase 3: Multi-Instance & Banker's Algorithm
- [ ] Add support for multiple instances per resource (dot visualization).
- [ ] Implement Banker's Safety Algorithm in `DetectionEngine`.
- [ ] UI for configuring resource instances.

### Phase 4: Recovery Engine - Termination & Preemption
- [ ] Implement `RecoveryEngine` with Process Termination (Sequential/All).
- [ ] Implement Resource Preemption with priority-based victim selection.
- [ ] Recovery log UI.

### Phase 5: Scenario Management & Undo/Redo
- [ ] Implement Undo/Redo stack for graph edits.
- [ ] JSON Import/Export for RAG states.
- [ ] Built-in presets (Circular Wait, Dining Philosophers).

### Phase 6: Polish & Rollback
- [ ] Implement Rollback to safe checkpoint.
- [ ] Premium UI polish (animations, themes, icons).
- [ ] Final verification and performance audit.

---
*Last updated: 2026-03-19 after requirements*
