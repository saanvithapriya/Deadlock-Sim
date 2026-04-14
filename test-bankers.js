import { GraphEngine } from './src/engine/GraphEngine.js';
import { DetectionEngine } from './src/engine/DetectionEngine.js';

function testBankers() {
  const graph = new GraphEngine();
  const detector = new DetectionEngine(graph);

  // Scenario: 3 processes, 3 resources
  // R1 (3 units), R2 (2 units), R3 (2 units)
  graph.addNode('resource', 'R1', { totalInstances: 3 });
  graph.addNode('resource', 'R2', { totalInstances: 2 });
  graph.addNode('resource', 'R3', { totalInstances: 2 });

  graph.addNode('process', 'P1', {});
  graph.addNode('process', 'P2', {});
  graph.addNode('process', 'P3', {});

  // Current Allocation:
  // P1 uses 1 R1
  graph.addEdge('R1', 'P1', 'assignment');
  // P2 uses 1 R2, 1 R3
  graph.addEdge('R2', 'P2', 'assignment');
  graph.addEdge('R3', 'P2', 'assignment');
  // P3 uses 1 R1, 1 R2
  graph.addEdge('R1', 'P3', 'assignment');
  graph.addEdge('R2', 'P3', 'assignment');

  // Requests:
  // P1 needs 1 R2
  graph.addEdge('P1', 'R2', 'request');
  // P2 needs 1 R1
  graph.addEdge('P2', 'R1', 'request');
  // P3 needs 1 R3
  graph.addEdge('P3', 'R3', 'request');

  console.log("Running Banker's Algorithm...");
  const result = detector.detectMultiInstance();
  console.log("Is Safe:", result.isSafe);
  console.log("Safe Sequence:", result.safeSequence);
  console.log("Deadlocked Processes:", result.deadlockedProcesses);

  if (result.isSafe) {
    console.log("TEST PASSED: System is safe.");
  } else {
    console.log("TEST FAILED: This scenario should be safe.");
  }
}

testBankers();
