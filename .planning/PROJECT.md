# Deadlock Detection and Recovery System Simulator

## What This Is

An educational and analytical tool that models operating system deadlock scenarios using a Resource Allocation Graph (RAG). It allows users to construct graphs, detect deadlocks using standard algorithms (DFS, Banker's), and simulate recovery strategies (termination, preemption, rollback) in an interactive web environment.

## Core Value

Enable users to visualize and interact with complex deadlock scenarios to better understand OS theory and recovery mechanics.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive Resource Allocation Graph (RAG) construction (Processes, Resources, Edges)
- [ ] Multi-instance resource support (dots visualization)
- [ ] DFS-based cycle detection for single-instance resources
- [ ] Banker's Algorithm (simplified matrix analysis) for multi-instance resources
- [ ] Recovery strategies: Process Termination (Sequential & All-at-once)
- [ ] Recovery strategies: Resource Preemption (with victim selection)
- [ ] Recovery strategies: Rollback to checkpoint
- [ ] Visualization: Highlight cycles, step-through algorithm animation
- [ ] Scenario Management: JSON import/export and preset library
- [ ] Fully client-side execution with modern browser compatibility

### Out of Scope

- Real-time dynamic process simulation (v1.0 is static snapshots)
- Full Banker's Algorithm with need-matrix (deferred to v2.0)
- Cloud persistence or user accounts
- Mobile browser support (v1.0 is Desktop/Tablet only)

## Context

The project serves as a "CBP" (Computer Based Project) for an Operating Systems course. It needs to be visually "premium" (wow factor) while remaining strictly educational and functional.

## Constraints

- **Tech Stack**: HTML, Javascript, Vanilla CSS (as per Antigravity guidelines).
- **Architecture**: Modular design (Graph, Detection, Recovery, Visualization Engines).
- **Scale**: Max 100 processes + 100 resources.
- **Privacy**: 100% client-side; no data transmission.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla CSS | Maximum flexibility and control as per agent guidelines | — Pending |
| GSD Workflow | Systematic project management and tracking | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-19 after initialization*
