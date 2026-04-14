/**
 * CheckpointEngine
 * Responsible for creating deep copies of the graph state
 * to allow for rollback and state persistence.
 */
export class CheckpointEngine {
  constructor() {
    this.history = [];
  }

  /**
   * Captures a deep copy of the current graph nodes and edges.
   */
  createSnapshot(graph) {
    const snapshot = {
      timestamp: new Date(),
      nodes: Array.from(graph.nodes.entries()).map(([id, node]) => [id, { ...node }]),
      edges: Array.from(graph.edges.entries()).map(([id, edge]) => [id, { ...edge }])
    };
    return snapshot;
  }

  /**
   * Restores the graph to a previously captured snapshot.
   */
  restore(graph, snapshot) {
    if (!snapshot) return false;

    graph.reset();
    
    // Restore nodes
    snapshot.nodes.forEach(([id, node]) => {
      graph.nodes.set(id, { ...node });
    });

    // Restore edges
    snapshot.edges.forEach(([id, edge]) => {
      graph.edges.set(id, { ...edge });
    });

    return true;
  }
}
