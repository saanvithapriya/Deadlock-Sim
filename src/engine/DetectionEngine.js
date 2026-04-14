/**
 * DetectionEngine.js
 * Implements deadlock detection algorithms.
 * - DFS for Single-Instance Resources (Cycle Detection).
 * - Banker's Algorithm for Multi-Instance Resources (Safety Check).
 */

export class DetectionEngine {
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * Detects deadlock in a single-instance resource environment.
   * Uses Depth First Search (DFS) to find cycles in the RAG.
   * @param {boolean} getSteps - If true, records each traversal step for visualization.
   * @returns {object} { isDeadlocked: boolean, cycle: Array, steps: Array }
   */
  detectSingleInstance(getSteps = false) {
    const snapshot = this.graph.getSnapshot();
    const adj = this.buildAdjacencyList(snapshot);
    const visited = new Set();
    const stack = new Set();
    const parent = new Map();
    const steps = [];
    let deadlockCycle = null;
    let stepCounter = 0;

    // Build a lookup for edge types
    const edgeLookup = new Map();
    for (const link of snapshot.links) {
      edgeLookup.set(`${link.from}->${link.to}`, link.type);
    }

    const findCycle = (u) => {
      visited.add(u);
      stack.add(u);
      stepCounter++;

      const nodeType = this._getNodeType(u);
      if (getSteps) {
        steps.push({
          type: 'visit',
          nodeId: u,
          stack: Array.from(stack),
          stepNumber: stepCounter,
          message: `Visiting ${u} — ${nodeType === 'process' ? 'Checking which resources this process requests' : 'Checking which process holds this resource'}`
        });
      }

      for (const v of (adj.get(u) || [])) {
        const edgeType = edgeLookup.get(`${u}->${v}`) || 'unknown';
        const edgeLabel = edgeType === 'request' ? 'requests' : 'is allocated to';

        if (!visited.has(v)) {
          stepCounter++;
          if (getSteps) {
            steps.push({
              type: 'explore-edge',
              from: u,
              to: v,
              edgeType: edgeType,
              stepNumber: stepCounter,
              message: `${u} ${edgeLabel} ${v} — Following ${edgeType} edge`
            });
          }
          parent.set(v, u);
          if (findCycle(v)) return true;
        } else if (stack.has(v)) {
          // Back edge found — cycle detected!
          deadlockCycle = this.reconstructCycle(v, u, parent);
          stepCounter++;
          if (getSteps) {
            steps.push({
              type: 'explore-edge',
              from: u,
              to: v,
              edgeType: edgeType,
              stepNumber: stepCounter,
              message: `${u} ${edgeLabel} ${v} — Back edge found!`
            });
            steps.push({
              type: 'cycle-found',
              cycle: deadlockCycle,
              stepNumber: stepCounter + 1,
              message: `Cycle detected: ${deadlockCycle.join(' → ')} → ${deadlockCycle[0]} — DEADLOCK!`
            });
          }
          return true;
        }
      }

      stack.delete(u);
      stepCounter++;
      if (getSteps) {
        steps.push({
          type: 'backtrack',
          nodeId: u,
          stack: Array.from(stack),
          stepNumber: stepCounter,
          message: `Backtracking from ${u} — No cycle found through this path`
        });
      }
      return false;
    };

    // Add initial step
    if (getSteps) {
      steps.push({
        type: 'start',
        stepNumber: 0,
        message: 'Starting DFS-based cycle detection on the Resource Allocation Graph'
      });
    }

    for (const node of snapshot.nodes) {
      if (!visited.has(node.id)) {
        if (findCycle(node.id)) break;
      }
    }

    // Add completion step
    if (getSteps) {
      if (deadlockCycle) {
        // cycle-found step already added inside findCycle
      } else {
        steps.push({
          type: 'safe',
          stepNumber: stepCounter + 1,
          message: 'DFS traversal complete — No cycles found. System is in a SAFE state.'
        });
      }
    }

    return {
      isDeadlocked: !!deadlockCycle,
      cycle: deadlockCycle || [],
      steps: steps
    };
  }

  /**
   * Banker's Safety Algorithm for Multi-Instance Resources.
   * @param {boolean} getSteps - If true, records each iteration step for visualization.
   * @returns {object} { isSafe: boolean, safeSequence: Array, deadlockedProcesses: Array, steps: Array }
   */
  detectMultiInstance(getSteps = false) {
    const snapshot = this.graph.getSnapshot();
    const processes = snapshot.nodes.filter(n => n.type === 'process');
    const resources = snapshot.nodes.filter(n => n.type === 'resource');
    
    const pMap = new Map(processes.map((p, i) => [p.id, i]));
    const rMap = new Map(resources.map((r, i) => [r.id, i]));
    
    const n = processes.length;
    const m = resources.length;
    
    // Allocation[i][j]: instances of Rj allocated to Pi
    const allocation = Array.from({ length: n }, () => Array(m).fill(0));
    // Request[i][j]: instances of Rj requested by Pi
    const request = Array.from({ length: n }, () => Array(m).fill(0));
    // Available[j]: instances of Rj available
    const available = resources.map(r => r.totalInstances || 1);

    // Build matrices from edges
    for (const link of snapshot.links) {
      if (link.type === 'assignment') {
        const pIdx = pMap.get(link.to);
        const rIdx = rMap.get(link.from);
        if (pIdx !== undefined && rIdx !== undefined) {
          allocation[pIdx][rIdx]++;
          available[rIdx]--;
        }
      } else if (link.type === 'request') {
        const pIdx = pMap.get(link.from);
        const rIdx = rMap.get(link.to);
        if (pIdx !== undefined && rIdx !== undefined) {
          request[pIdx][rIdx]++;
        }
      }
    }

    const steps = [];
    let stepCounter = 0;

    if (getSteps) {
      // Show initial matrices
      steps.push({
        type: 'banker-init',
        stepNumber: stepCounter++,
        available: [...available],
        allocation: allocation.map(r => [...r]),
        request: request.map(r => [...r]),
        processes: processes.map(p => p.id),
        resources: resources.map(r => r.id),
        message: `Banker's Algorithm initialized — Available: [${available.join(', ')}]`
      });
    }

    const finish = Array(n).fill(false);
    const work = [...available];
    const safeSequence = [];

    // Main Banker's Safety Logic
    let progress = true;
    let round = 0;
    while (progress) {
      progress = false;
      round++;
      for (let i = 0; i < n; i++) {
        if (!finish[i]) {
          // Check if Request[i] <= Work
          let canProceed = true;
          for (let j = 0; j < m; j++) {
            if (request[i][j] > work[j]) {
              canProceed = false;
              break;
            }
          }

          if (getSteps) {
            const needStr = request[i].join(', ');
            const workStr = work.join(', ');
            steps.push({
              type: canProceed ? 'banker-can-proceed' : 'banker-cannot-proceed',
              stepNumber: stepCounter++,
              processId: processes[i].id,
              processIndex: i,
              need: [...request[i]],
              work: [...work],
              message: canProceed
                ? `${processes[i].id}: Need=[${needStr}] ≤ Work=[${workStr}] → Can proceed ✓`
                : `${processes[i].id}: Need=[${needStr}] > Work=[${workStr}] → Cannot proceed, skipping`
            });
          }

          if (canProceed) {
            // Reclaim resources
            for (let j = 0; j < m; j++) {
              work[j] += allocation[i][j];
            }
            finish[i] = true;
            safeSequence.push(processes[i].id);
            progress = true;

            if (getSteps) {
              steps.push({
                type: 'banker-reclaim',
                stepNumber: stepCounter++,
                processId: processes[i].id,
                work: [...work],
                allocation: [...allocation[i]],
                message: `${processes[i].id} completes — Resources reclaimed. Work=[${work.join(', ')}]`
              });
            }
          }
        }
      }
    }

    const deadlockedProcesses = processes
      .filter((_, i) => !finish[i])
      .map(p => p.id);

    // Final step
    if (getSteps) {
      if (deadlockedProcesses.length === 0) {
        steps.push({
          type: 'banker-safe',
          stepNumber: stepCounter++,
          safeSequence: [...safeSequence],
          message: `System is SAFE! Safe sequence: ${safeSequence.join(' → ')}`
        });
      } else {
        steps.push({
          type: 'banker-unsafe',
          stepNumber: stepCounter++,
          deadlockedProcesses: [...deadlockedProcesses],
          message: `System is UNSAFE! Deadlocked processes: ${deadlockedProcesses.join(', ')}`
        });
      }
    }

    return {
      isSafe: deadlockedProcesses.length === 0,
      safeSequence,
      deadlockedProcesses,
      steps
    };
  }

  buildAdjacencyList(snapshot) {
    const adj = new Map();
    for (const link of snapshot.links) {
      if (!adj.has(link.from)) adj.set(link.from, []);
      adj.get(link.from).push(link.to);
    }
    return adj;
  }

  reconstructCycle(start, end, parent) {
    const cycle = [start];
    let curr = end;
    while (curr !== start) {
      cycle.push(curr);
      curr = parent.get(curr);
    }
    return cycle.reverse();
  }

  /**
   * Helper to determine node type from ID convention.
   */
  _getNodeType(nodeId) {
    const node = this.graph.nodes.get(nodeId);
    return node ? node.type : (nodeId.startsWith('P') ? 'process' : 'resource');
  }
}
