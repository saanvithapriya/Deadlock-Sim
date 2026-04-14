/**
 * GraphEngine.js
 * Core data structure for the Resource Allocation Graph (RAG).
 * Manages processes, resources, and directed edges.
 */

export class GraphEngine {
  constructor() {
    this.nodes = new Map(); // id -> { id, name, type, data }
    this.edges = new Map(); // id -> { id, from, to, type }
  }

  /**
   * Add a node to the graph.
   * @param {string} type - 'process' or 'resource'
   * @param {string} id - Unique identifier
   * @param {object} data - Additional data (e.g., instances for resources, priority for processes)
   */
  addNode(type, id, data = {}) {
    if (this.nodes.has(id)) {
      throw new Error(`Node with ID ${id} already exists.`);
    }
    this.nodes.set(id, {
      id,
      type,
      name: data.name || id,
      ...data,
      status: 'active' // active, terminated, rolled-back
    });
    return this.nodes.get(id);
  }

  /**
   * Remove a node and all its connected edges.
   * @param {string} id
   */
  removeNode(id) {
    if (!this.nodes.has(id)) return;
    
    // Remove connected edges
    for (const [edgeId, edge] of this.edges) {
      if (edge.from === id || edge.to === id) {
        this.edges.delete(edgeId);
      }
    }
    
    this.nodes.delete(id);
  }

  /**
   * Add a directed edge.
   * @param {string} from - Source node ID
   * @param {string} to - Destination node ID
   * @param {string} type - 'request' (P -> R) or 'assignment' (R -> P)
   */
  addEdge(from, to, type) {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (!fromNode || !toNode) {
      throw new Error("Source or destination node does not exist.");
    }

    // Validation for assignment edges (Resource -> Process)
    if (type === 'assignment') {
      if (fromNode.type !== 'resource' || toNode.type !== 'process') {
        throw new Error("Assignment edge must go from Resource to Process.");
      }
      
      // Check total instances
      const currentAssignments = Array.from(this.edges.values()).filter(
        e => e.from === from && e.type === 'assignment'
      ).length;
      
      const totalInstances = fromNode.totalInstances || 1;
      if (currentAssignments >= totalInstances) {
        throw new Error(`Resource ${from} has no available instances.`);
      }
    }

    // Validation for request edges (Process -> Resource)
    if (type === 'request') {
      if (fromNode.type !== 'process' || toNode.type !== 'resource') {
        throw new Error("Request edge must go from Process to Resource.");
      }
    }

    const edgeId = `${from}-${to}-${type}`;
    if (this.edges.has(edgeId)) return this.edges.get(edgeId);

    const edge = { id: edgeId, from, to, type };
    this.edges.set(edgeId, edge);
    return edge;
  }

  /**
   * Remove an edge by ID or by from/to/type.
   */
  removeEdge(from, to, type) {
    const id = type ? `${from}-${to}-${type}` : from;
    this.edges.delete(id);
  }

  /**
   * Get a plain object snapshot of the graph for visualization/algorithms.
   */
  getSnapshot() {
    return {
      nodes: Array.from(this.nodes.values()),
      links: Array.from(this.edges.values())
    };
  }

  /**
   * Clear the entire graph.
   */
  reset() {
    this.nodes.clear();
    this.edges.clear();
  }
}
