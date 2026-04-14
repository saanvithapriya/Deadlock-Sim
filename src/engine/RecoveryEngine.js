/**
 * RecoveryEngine.js
 * Implements strategies to resolve deadlocks.
 */
export class RecoveryEngine {
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * Terminate a specific process.
   * Removes the process node and all its connected edges.
   */
  terminateProcess(processId) {
    this.graph.removeNode(processId);
    return { success: true, message: `Process ${processId} terminated.` };
  }

  /**
   * Preempt a resource from a process.
   * Converts an assignment edge (R -> P) into a request edge (P -> R).
   */
  preemptResource(resourceId, processId) {
    const edgeId = `${resourceId}-${processId}-assignment`;
    if (this.graph.edges.has(edgeId)) {
      this.graph.removeEdge(resourceId, processId, 'assignment');
      this.graph.addEdge(processId, resourceId, 'request');
      return { success: true, message: `Resource ${resourceId} preempted from ${processId}.` };
    }
    return { success: false, message: `No assignment link found between ${resourceId} and ${processId}.` };
  }

  /**
   * Heuristic to select a 'victim' process from a deadlocked set.
   * Criteria: Minimum number of resources held (simplest heuristic).
   */
  getVictim(deadlockedNodeIds) {
    if (!deadlockedNodeIds || deadlockedNodeIds.length === 0) return null;
    
    // Filter to only include processes
    const processIds = deadlockedNodeIds.filter(id => {
      const node = this.graph.nodes.get(id);
      return node && node.type === 'process';
    });

    if (processIds.length === 0) return null;

    let victim = null;
    let minResources = Infinity;

    for (const pid of processIds) {
      const heldResources = Array.from(this.graph.edges.values()).filter(
        e => e.to === pid && e.type === 'assignment'
      ).length;

      if (heldResources < minResources) {
        minResources = heldResources;
        victim = pid;
      }
    }

    return victim;
  }
}
