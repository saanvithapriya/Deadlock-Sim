# Pitfalls Research: Deadlock Simulator

## Domain Pitfalls
- **Banker's Algorithm Misconception**: Confusing "Unsafe State" with "Deadlock". Unsafe state means deadlock *could* happen, not that it *has*. v1.0 must be clear on this distinction.
- **Cycle Detection Performance**: DFS on a dense graph can be slow if not optimized with visited/recursion stacks (O(V+E)).
- **Edge Capacity Inconsistency**: Allowing more assignment edges than resource instances. Must have strict validation in the Graph Engine.
- **Recursive Terminations**: Terminating one process might break multiple cycles. Re-detection is expensive but necessary for accuracy.

## Implementation Pitfalls
- **SVG vs DOM Performance**: Too many SVG elements (e.g., 500+ nodes) can lag. v1.0 limit of 200 nodes is safe.
- **Undo/Redo State Size**: Storing full graph snapshots for 50+ actions can consume memory. Differential updates or compact JSON snapshots are better.
- **Layout Jitter**: Force-directed layouts can be unstable. Use alpha-decay or fixed positions for "Stable" mode.

---
*Confidence: High*
