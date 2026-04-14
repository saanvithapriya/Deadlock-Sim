// Detailed deadlock topics for homepage
export const deadlockTopics = [
  {
    title: 'What is Deadlock?',
    content: `A <b>deadlock</b> is a situation in operating systems where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process. Deadlocks are a classic problem in concurrent programming and resource allocation.`
  },
  {
    title: 'Necessary Conditions for Deadlock',
    content: `<ul>
      <li><b>Mutual Exclusion</b>: At least one resource must be held in a non-sharable mode.</li>
      <li><b>Hold and Wait</b>: A process is holding at least one resource and waiting to acquire additional resources held by other processes.</li>
      <li><b>No Preemption</b>: Resources cannot be forcibly removed from processes holding them.</li>
      <li><b>Circular Wait</b>: A set of processes are waiting for each other in a circular chain.</li>
    </ul>`
  },
  {
    title: 'Resource Allocation Graph (RAG)',
    content: `A RAG is a directed graph used to represent the allocation of resources to processes. Nodes represent processes and resources, and edges represent allocation and request relationships. Cycles in a RAG may indicate the possibility of a deadlock.`
  },
  {
    title: 'Wait-For Graph (WFG)',
    content: `A WFG is a simplified version of a RAG, showing only process-to-process dependencies. If a cycle exists in the WFG, a deadlock is present.`
  },
  {
    title: 'Deadlock Detection Algorithms',
    content: `<ul>
      <li><b>DFS Cycle Detection</b>: Uses Depth-First Search to detect cycles in the RAG.</li>
      <li><b>Banker\'s Algorithm</b>: Checks for safe and unsafe states in systems with multiple resource instances.</li>
    </ul>`
  },
  {
    title: 'Banker\'s Algorithm',
    content: `A resource allocation and deadlock avoidance algorithm that tests for safe states by simulating resource allocation for predetermined maximum possible amounts of all resources, then makes an "s-state" check to test for possible activities, before deciding whether allocation should be allowed to continue.`
  },
  {
    title: 'Deadlock Recovery',
    content: `<ul>
      <li><b>Process Termination</b>: Abort one or more processes to break the circular wait.</li>
      <li><b>Resource Preemption</b>: Temporarily take resources away from processes and give them to others until the deadlock is resolved.</li>
    </ul>`
  },
  {
    title: 'Deadlock Prevention & Avoidance',
    content: `Techniques to ensure that at least one of the necessary conditions for deadlock cannot hold, thus preventing deadlocks from occurring. Examples include ordering resources and requesting all resources at once.`
  }
];
