import { GraphEngine } from './GraphEngine.js';

const ge = new GraphEngine();

console.log("Testing GraphEngine...");

// Test Nodes
ge.addNode('process', 'P1', { name: 'Process 1' });
ge.addNode('resource', 'R1', { name: 'Resource 1', totalInstances: 1 });

console.log("Nodes added:", ge.nodes.size);

// Test Edges
try {
  ge.addEdge('P1', 'R1', 'request');
  console.log("Request edge added: P1 -> R1");
  
  ge.addEdge('R1', 'P1', 'assignment');
  console.log("Assignment edge added: R1 -> P1");
} catch (e) {
  console.error("Link error:", e.message);
}

// Test Validation
try {
  ge.addNode('process', 'P2');
  ge.addEdge('R1', 'P2', 'assignment'); // Should fail (totalInstances=1)
} catch (e) {
  console.log("Validation passed:", e.message);
}

// Test Snapshot
const snapshot = ge.getSnapshot();
console.log("Snapshot Nodes:", snapshot.nodes.length);
console.log("Snapshot Links:", snapshot.links.length);

if (snapshot.nodes.length === 3 && snapshot.links.length === 2) {
  console.log("GraphEngine implementation verified.");
} else {
  console.error("GraphEngine implementation failed verification.");
  process.exit(1);
}
