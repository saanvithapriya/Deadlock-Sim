import { GraphEngine } from './src/engine/GraphEngine.js';
import { DetectionEngine } from './src/engine/DetectionEngine.js';

function testBankersDeadlock() {
  const graph = new GraphEngine();
  const detector = new DetectionEngine(graph);

  // Scenario: 3 processes, 3 resources
  // R1 (2 units), R2 (2 units), R3 (2 units)
  graph.addNode('resource', 'R1', { totalInstances: 2 });
  graph.addNode('resource', 'R2', { totalInstances: 2 });
  graph.addNode('resource', 'R3', { totalInstances: 2 });

  graph.addNode('process', 'P1', {});
  graph.addNode('process', 'P2', {});
  graph.addNode('process', 'P3', {});

  // Current Allocation (All units allocated)
  graph.addEdge('R1', 'P1', 'assignment');
  graph.addEdge('R2', 'P1', 'assignment');
  
  graph.addEdge('R2', 'P2', 'assignment');
  graph.addEdge('R3', 'P2', 'assignment');
  
  graph.addEdge('R1', 'P3', 'assignment');
  graph.addEdge('R3', 'P3', 'assignment');

  // Requests (No one can proceed)
  graph.addEdge('P1', 'R3', 'request'); // Needs R3, but both R3 are held by P2 and P3
  graph.addEdge('P2', 'R1', 'request'); // Needs R1, but both R1 are held by P1 and P3
  graph.addEdge('P3', 'R2', 'request'); // Needs R2, but both R2 are held by P1 and P2

  console.log("Running Banker's Algorithm (Deadlock Case)...");
  const result = detector.detectMultiInstance();
  console.log("Is Safe:", result.isSafe);
  console.log("Safe Sequence:", result.safeSequence);
  console.log("Deadlocked Processes:", result.deadlockedProcesses);

  if (!result.isSafe && result.deadlockedProcesses.length === 3) {
    console.log("TEST PASSED: Deadlock correctly detected.");
  } else {
    console.log("TEST FAILED: Deadlock detection failed.");
  }
}

testBankersDeadlock();
