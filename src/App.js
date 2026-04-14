import { GraphEngine } from './engine/GraphEngine.js';
import { VisualizationEngine } from './ui/VisualizationEngine.js';
import { DetectionEngine } from './engine/DetectionEngine.js';
import { RecoveryEngine } from './engine/RecoveryEngine.js';
import { CheckpointEngine } from './engine/CheckpointEngine.js';

console.log("App Module Loading...");

const PRESETS = {
  'dfs-safe': {
    label: 'DFS Safe Scenario',
    description: 'P1 requests R1 which is held by P2. No cycle exists — P2 can finish and release R1, allowing P1 to proceed.',
    nodes: [
      { id: 'R1', type: 'resource', data: { totalInstances: 1 } },
      { id: 'P1', type: 'process', data: {} },
      { id: 'P2', type: 'process', data: {} }
    ],
    links: [
      { from: 'R1', to: 'P2', type: 'assignment' },
      { from: 'P1', to: 'R1', type: 'request' }
    ]
  },
  'dfs-deadlock': {
    label: 'DFS Deadlock Scenario',
    description: 'P1 holds R2 and requests R1. P2 holds R1 and requests R2. This creates a circular wait: P1→R1→P2→R2→P1.',
    nodes: [
      { id: 'R1', type: 'resource', data: { totalInstances: 1 } },
      { id: 'R2', type: 'resource', data: { totalInstances: 1 } },
      { id: 'P1', type: 'process', data: {} },
      { id: 'P2', type: 'process', data: {} }
    ],
    links: [
      { from: 'R1', to: 'P2', type: 'assignment' },
      { from: 'R2', to: 'P1', type: 'assignment' },
      { from: 'P1', to: 'R1', type: 'request' },
      { from: 'P2', to: 'R2', type: 'request' }
    ]
  },
  'banker-safe': {
    label: "Banker's Safe Scenario",
    description: 'R1 has 3 instances. P1 and P2 each hold 1, with 1 available. P1 requests 1 more — the system can safely satisfy P1, then P2.',
    nodes: [
      { id: 'R1', type: 'resource', data: { totalInstances: 3 } },
      { id: 'P1', type: 'process', data: {} },
      { id: 'P2', type: 'process', data: {} }
    ],
    links: [
      { from: 'R1', to: 'P1', type: 'assignment' },
      { from: 'R1', to: 'P2', type: 'assignment' },
      { from: 'P1', to: 'R1', type: 'request' }
    ]
  },
  'banker-deadlock': {
    label: "Banker's Deadlock Scenario",
    description: 'R1 has 2 instances, both allocated. Both P1 and P2 request more — no available instances to satisfy either process.',
    nodes: [
      { id: 'R1', type: 'resource', data: { totalInstances: 2 } },
      { id: 'P1', type: 'process', data: {} },
      { id: 'P2', type: 'process', data: {} }
    ],
    links: [
      { from: 'R1', to: 'P1', type: 'assignment' },
      { from: 'R1', to: 'P2', type: 'assignment' },
      { from: 'P1', to: 'R1', type: 'request' },
      { from: 'P2', to: 'R1', type: 'request' }
    ]
  }
};

class App {
  constructor() {
    console.log("App Class Initializing...");
    try {
      this.graph = new GraphEngine();
      this.viz = new VisualizationEngine('#canvas-container');
      this.detector = new DetectionEngine(this.graph);
      this.recovery = new RecoveryEngine(this.graph);
      this.checkpoint = new CheckpointEngine();
    
      this.processCounter = 1;
      this.resourceCounter = 1;
      this.selectionMode = false;
      this.selectedNode = null;

      this.detectionSteps = [];
      this.currentStepIndex = 0;
      this.isStepping = false;
      this.isAutoPlaying = false;
      this.autoPlayTimer = null;
      this.deadlockedNodes = [];
      this.history = [];
      this.historyIndex = -1;
      this.maxHistory = 20;
      this.wfgVisible = false;
      this.wfgSimulation = null;
      this.lastDetectionResult = null; // store for WFG auto-update

      this.setupEventListeners();
    
      // Connect Visualization events
      this.viz.onLinkCreated = (from, to) => this.createEdge(from, to);
    
      this.updateUI();
      this.setPhase('BUILD');
      console.log("App Initialized Successfully.");
    } catch (e) {
      console.error("APP INITIALIZATION FAILED:", e);
    }
  }

  // ─── Speed helper ───
  getStepDelay() {
    const slider = document.getElementById('speed-slider');
    const speeds = [0.25, 0.5, 1, 1.5, 2, 3];
    const speedMultiplier = speeds[(slider ? slider.value : 3) - 1] || 1;
    return Math.max(200, 1200 / speedMultiplier);
  }

  // ─── Phase indicator ───
  setPhase(phase) {
    const badge = document.getElementById('status-badge');
    const statusEl = document.getElementById('system-status');
    
    badge.classList.remove('phase-analyzing', 'phase-safe', 'phase-deadlocked');
    
    switch (phase) {
      case 'BUILD':
        statusEl.innerText = 'Phase: BUILD';
        statusEl.style.color = '#94a3b8';
        break;
      case 'ANALYZING':
        statusEl.innerText = 'Phase: ANALYZING';
        statusEl.style.color = '#f6ad55';
        badge.classList.add('phase-analyzing');
        break;
      case 'SAFE':
        statusEl.innerText = 'Phase: SAFE';
        statusEl.style.color = '#48bb78';
        badge.classList.add('phase-safe');
        break;
      case 'DEADLOCKED':
        statusEl.innerText = 'Phase: DEADLOCKED';
        statusEl.style.color = '#f56565';
        badge.classList.add('phase-deadlocked');
        break;
      case 'UNSAFE':
        statusEl.innerText = 'Phase: UNSAFE';
        statusEl.style.color = '#f56565';
        badge.classList.add('phase-deadlocked');
        break;
    }
  }

  // ─── Explanation panel ───
  clearExplanation() {
    const panel = document.getElementById('explanation-panel');
    panel.innerHTML = '';
  }

  addExplanation(stepNum, message, type = '') {
    const panel = document.getElementById('explanation-panel');
    const step = document.createElement('div');
    step.className = `explanation-step ${type}`;
    step.innerHTML = `<span class="step-num">Step ${stepNum}:</span> ${message}`;
    panel.appendChild(step);
    // Auto-scroll to bottom
    panel.scrollTop = panel.scrollHeight;
  }

  setExplanationMessage(message, type = '') {
    const panel = document.getElementById('explanation-panel');
    panel.innerHTML = `<div class="explanation-step ${type}" style="animation: none; opacity: 1; transform: none;">${message}</div>`;
  }

  // ─── Banker's Matrix Display ───
  showBankerMatrix(stepData) {
    const container = document.getElementById('banker-matrix');
    if (!stepData || !stepData.processes || stepData.processes.length === 0) {
      container.style.display = 'none';
      return;
    }

    const { processes, resources, allocation, request, available } = stepData;
    let html = '<div class="matrix-label">Banker\'s Algorithm Matrices</div>';
    html += '<table>';
    html += '<tr><th>Process</th>';
    resources.forEach(r => { html += `<th>Alloc(${r})</th>`; });
    resources.forEach(r => { html += `<th>Need(${r})</th>`; });
    html += '</tr>';
    
    processes.forEach((p, i) => {
      html += `<tr><td style="color:#4fd1c5;font-weight:600;">${p}</td>`;
      allocation[i].forEach(v => { html += `<td>${v}</td>`; });
      request[i].forEach(v => { html += `<td>${v}</td>`; });
      html += '</tr>';
    });
    
    html += '</table>';
    html += `<div style="margin-top: 6px;color:var(--accent-amber);">Available: [${available.join(', ')}]</div>`;
    
    container.innerHTML = html;
    container.style.display = 'block';
  }

  hideBankerMatrix() {
    document.getElementById('banker-matrix').style.display = 'none';
  }

  setupEventListeners() {
    document.getElementById('add-process').addEventListener('click', () => this.addProcess());
    document.getElementById('add-resource').addEventListener('click', () => this.addResource());
    document.getElementById('add-edge').addEventListener('click', () => this.toggleEdgeMode());
    document.getElementById('run-detection').addEventListener('click', () => this.runDetection());
    document.getElementById('step-detection').addEventListener('click', () => this.startStepThrough());
    document.getElementById('reset-btn').addEventListener('click', () => this.reset());

    document.getElementById('preset-dfs-safe').addEventListener('click', () => this.loadPreset('dfs-safe'));
    document.getElementById('preset-dfs-dead').addEventListener('click', () => this.loadPreset('dfs-deadlock'));
    document.getElementById('preset-bank-safe').addEventListener('click', () => this.loadPreset('banker-safe'));
    document.getElementById('preset-bank-dead').addEventListener('click', () => this.loadPreset('banker-deadlock'));
    
    document.getElementById('rollback-btn').addEventListener('click', () => this.rollback());
    document.getElementById('redo-btn').addEventListener('click', () => this.redo());

    // Auto-play controls
    document.getElementById('auto-play-btn').addEventListener('click', () => this.startAutoPlay());
    document.getElementById('stop-play-btn').addEventListener('click', () => this.stopAutoPlay());

    // (toggle-recovery-info removed — element does not exist)

    // WFG toggle
    document.getElementById('wfg-toggle').addEventListener('click', () => this.toggleWFG());
    document.getElementById('wfg-close').addEventListener('click', () => this.closeWFG());

    this.viz.g.on('click', (event) => {
      const nodeData = window.d3.select(event.target.parentNode).datum();
      if (nodeData && nodeData.id) {
        this.handleNodeClick(nodeData);
      } else {
        this.cancelSelection();
      }
    });

    window.addEventListener('resize', () => {
      const boundingRect = document.getElementById('canvas-container').getBoundingClientRect();
      this.viz.width = boundingRect.width;
      this.viz.height = boundingRect.height;
      this.updateUI();
    });
  }

  addNode(type) {
    // Internal helper — callers handle saveState themselves
    const id = type === 'process' ? `P${this.processCounter++}` : `R${this.resourceCounter++}`;
    this.graph.addNode(type, id, { name: id });
    this.log(`Added ${type} ${id}`);
    this.updateUI();
  }

  addProcess() {
    this.saveState();
    const id = `P${this.processCounter++}`;
    this.graph.addNode('process', id, { name: id });
    this.log(`Added process ${id}`);
    this.updateUI();
  }

  addResource() {
    this.saveState();
    const input = document.getElementById('res-instances');
    const instances = parseInt(input.value) || 1;
    const id = `R${this.resourceCounter++}`;
    this.graph.addNode('resource', id, { name: id, totalInstances: instances });
    this.log(`Added resource ${id} with ${instances} instance${instances > 1 ? 's' : ''}`);
    this.updateUI();
  }

  toggleEdgeMode() {
    this.selectionMode = !this.selectionMode;
    this.selectedNode = null;
    this.viz.linkMode = this.selectionMode; // Sync with visualization
    
    if (this.selectionMode) {
      this.log("Link Mode: Drag from source to target OR click both nodes.");
      document.getElementById('add-edge').style.background = 'rgba(79, 209, 197, 0.2)';
    } else {
      this.cancelSelection();
    }
  }

  handleNodeClick(node) {
    if (!this.selectionMode) return;

    if (!this.selectedNode) {
      this.selectedNode = node;
      this.log(`Selected ${node.id}. Click target node...`);
    } else {
      this.createEdge(this.selectedNode.id, node.id);
      this.cancelSelection();
    }
  }

  createEdge(from, to) {
    this.saveState();
    const fromNode = this.graph.nodes.get(from);
    const type = fromNode.type === 'process' ? 'request' : 'assignment';
    
    try {
      this.graph.addEdge(from, to, type);
      const label = type === 'request' ? 'requests' : 'is allocated to';
      this.log(`${from} ${label} ${to} (${type} edge)`);
      this.updateUI();
    } catch (e) {
      this.log(`Error: ${e.message}`, 'error');
    }
  }

  cancelSelection() {
    this.selectionMode = false;
    this.selectedNode = null;
    this.viz.linkMode = false;
    document.getElementById('add-edge').style.background = '';
    this.updateUI();
  }

  // ─── Detection ───
  runDetection() {
    this.isStepping = false;
    this.stopAutoPlay();
    this.viz.restoreAll();
    this.viz.setAnalysisMode(true);
    this.setPhase('ANALYZING');
    this.clearExplanation();
    this.setExplanationMessage('🔍 Analyzing system state...', 'active');
    this.log("Starting deadlock analysis...", 'info');

    setTimeout(() => {
      const snapshot = this.graph.getSnapshot();
      const isMultiInstance = snapshot.nodes.some(n => n.type === 'resource' && (n.totalInstances || 1) > 1);

      if (isMultiInstance) {
        this.log("Using Banker's Algorithm (multi-instance resources detected)");
        const result = this.detector.detectMultiInstance(true);
        
        // Show Banker matrix
        if (result.steps && result.steps.length > 0) {
          const initStep = result.steps.find(s => s.type === 'banker-init');
          if (initStep) this.showBankerMatrix(initStep);
        }

        if (!result.isSafe) {
          this.clearExplanation();
          this.addExplanation(1, "Banker's Safety Algorithm detects UNSAFE state", 'error');
          this.addExplanation(2, `Deadlocked processes: <strong>${result.deadlockedProcesses.join(', ')}</strong>`, 'error');
          this.addExplanation(3, 'No safe sequence exists — all remaining processes are blocked', 'error');
          
          this.log(`SYSTEM UNSAFE! Deadlocked: ${result.deadlockedProcesses.join(', ')}`, 'error');
          this.deadlockedNodes = result.deadlockedProcesses;
          this.viz.showNodeResult(false, result.deadlockedProcesses);
          this.viz.showAnalysisResult(false, result.deadlockedProcesses);
          document.getElementById('recovery-section').style.display = 'block';
          this.buildRecoveryComparison(result.deadlockedProcesses, "Banker's");
          this.setPhase('UNSAFE');
          if (this.wfgVisible) this.renderWFG();
        } else {
          this.clearExplanation();
          this.addExplanation(1, "Banker's Safety Algorithm found a safe sequence", 'safe');
          this.addExplanation(2, `Safe sequence: <strong>${result.safeSequence.join(' → ')}</strong>`, 'safe');
          this.addExplanation(3, 'All processes can complete without deadlock', 'safe');
          
          this.log(`System SAFE! Sequence: ${result.safeSequence.join(' → ')}`);
          this.deadlockedNodes = [];
          document.getElementById('recovery-section').style.display = 'none';
          this._clearWFGBadge();
          this.viz.update(this.graph.getSnapshot());
          this.viz.showNodeResult(true);
          this.viz.animateSafeSequence(result.safeSequence);
          this.setPhase('SAFE');
        }
      } else {
        this.log("Using DFS for single-instance resources");
        const result = this.detector.detectSingleInstance(true);
        if (result.isDeadlocked) {
          this.clearExplanation();
          this.addExplanation(1, 'DFS cycle detection found a circular wait', 'error');
          this.addExplanation(2, `Cycle: <strong>${result.cycle.join(' → ')} → ${result.cycle[0]}</strong>`, 'error');
          this.addExplanation(3, 'DEADLOCK — processes are waiting in a circular chain', 'error');
          
          this.log(`DEADLOCK! Cycle: ${result.cycle.join(' → ')} → ${result.cycle[0]}`, 'error');
          this.deadlockedNodes = result.cycle;
          this.viz.showNodeResult(false, result.cycle);
          this.viz.showAnalysisResult(false, result.cycle);
          document.getElementById('recovery-section').style.display = 'block';
          this.buildRecoveryComparison(result.cycle, "DFS");
          this.setPhase('DEADLOCKED');
          if (this.wfgVisible) this.renderWFG();
        } else {
          this.clearExplanation();
          this.addExplanation(1, 'DFS traversal complete — no cycles found', 'safe');
          this.addExplanation(2, 'System is in a <strong>SAFE</strong> state', 'safe');
          this.addExplanation(3, 'All processes can proceed without circular wait', 'safe');
          
          this.log("No deadlock detected. System is safe.");
          this.deadlockedNodes = [];
          document.getElementById('recovery-section').style.display = 'none';
          this._clearWFGBadge();
          this.viz.update(this.graph.getSnapshot()); 
          this.viz.showNodeResult(true);
          this.viz.showAnalysisResult(true);
          this.setPhase('SAFE');
        }
      }
    }, 800);
  }

  // ─── Step-through ───
  startStepThrough() {
    // If already in stepping mode and steps remain, advance one step
    if (this.isStepping && this.currentStepIndex < this.detectionSteps.length) {
      this.runNextStep();
      return;
    }

    // Fresh start
    this.stopAutoPlay();
    this.isStepping = true;
    this.viz.restoreAll();
    this.viz.setAnalysisMode(true);
    this.setPhase('ANALYZING');
    this.clearExplanation();
    this.hideBankerMatrix();
    this.deadlockedNodes = [];
    document.getElementById('recovery-section').style.display = 'none';

    const snapshot = this.graph.getSnapshot();
    const isMultiInstance = snapshot.nodes.some(n => n.type === 'resource' && (n.totalInstances || 1) > 1);

    if (isMultiInstance) {
      this.log("Step-through: Banker's Algorithm — click 'Step-Through' to advance each step");
      const result = this.detector.detectMultiInstance(true);
      this.detectionSteps = result.steps;
      
      // Show matrices at start
      const initStep = result.steps.find(s => s.type === 'banker-init');
      if (initStep) this.showBankerMatrix(initStep);
    } else {
      this.log("Step-through: DFS Cycle Detection — click 'Step-Through' to advance each step");
      const result = this.detector.detectSingleInstance(true);
      this.detectionSteps = result.steps;
    }

    this.currentStepIndex = 0;
    this.setExplanationMessage('🔍 Step-through ready — click <strong>Step-Through</strong> to advance one step at a time, or <strong>Auto-Play</strong> to run automatically.', 'active');
  }

  runNextStep() {
    if (!this.isStepping || this.currentStepIndex >= this.detectionSteps.length) {
      this.isStepping = false;
      this.log("Step-through completed.");
      
      // Set final state
      if (this.deadlockedNodes.length > 0) {
        this.viz.animateCyclePulse(this.deadlockedNodes);
        this.setPhase('DEADLOCKED');
        document.getElementById('recovery-section').style.display = 'block';
      }
      
      // Update buttons
      document.getElementById('auto-play-btn').disabled = false;
      document.getElementById('stop-play-btn').disabled = true;
      return;
    }

    const step = this.detectionSteps[this.currentStepIndex++];
    this.visualizeStep(step);

    if (this.isAutoPlaying) {
      // Auto-play: schedule next step automatically
      this.autoPlayTimer = setTimeout(() => this.runNextStep(), this.getStepDelay());
    }
    // In manual mode, do NOT auto-advance — wait for next button click
  }

  visualizeStep(step) {
    const stepNum = step.stepNumber || this.currentStepIndex;

    switch (step.type) {
      case 'start':
        this.addExplanation(stepNum, step.message, 'active');
        this.log(step.message);
        break;

      case 'visit':
        // Highlight current node, dim others
        this.viz.dimAllExcept(step.stack || [step.nodeId]);
        this.viz.highlightNode(step.nodeId, '#ffd700', true);
        this.addExplanation(stepNum, step.message, 'active');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'explore-edge':
        // Highlight the edge being explored
        this.viz.highlightEdge(step.from, step.to, '#ffd700');
        this.viz.highlightNode(step.from, '#ffd700', false);
        this.viz.highlightNode(step.to, '#ffd700', true);
        this.viz.dimAllExcept([step.from, step.to]);
        this.addExplanation(stepNum, step.message, 'active');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'backtrack':
        this.viz.highlightNode(step.nodeId, '#64748b', false);
        this.addExplanation(stepNum, step.message, '');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'cycle-found':
        this.deadlockedNodes = step.cycle;
        this.viz.restoreAll();
        this.viz.animateCyclePulse(step.cycle);
        this.addExplanation(stepNum, step.message, 'error');
        this.log(step.message, 'error');
        this.setPhase('DEADLOCKED');
        document.getElementById('recovery-section').style.display = 'block';
        this.buildRecoveryComparison(step.cycle, "DFS");
        if (this.wfgVisible) this.renderWFG();
        break;

      case 'safe':
        this.viz.restoreAll();
        this.viz.showNodeResult(true);
        this.viz.showAnalysisResult(true);
        this.addExplanation(stepNum, step.message, 'safe');
        this.log(step.message);
        this.setPhase('SAFE');
        break;

      // ─── Banker's steps ───
      case 'banker-init':
        this.addExplanation(stepNum, step.message, 'active');
        this.log(step.message);
        break;

      case 'banker-can-proceed':
        this.viz.highlightNode(step.processId, '#48bb78', true);
        this.viz.dimAllExcept([step.processId]);
        this.addExplanation(stepNum, step.message, 'safe');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'banker-cannot-proceed':
        this.viz.highlightNode(step.processId, '#f56565', false);
        this.viz.dimAllExcept([step.processId]);
        this.addExplanation(stepNum, step.message, '');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'banker-reclaim':
        this.viz.highlightNode(step.processId, '#48bb78', true);
        this.addExplanation(stepNum, step.message, 'safe');
        this.log(`Step ${stepNum}: ${step.message}`);
        break;

      case 'banker-safe':
        this.viz.restoreAll();
        this.viz.showNodeResult(true);
        this.viz.animateSafeSequence(step.safeSequence);
        this.addExplanation(stepNum, step.message, 'safe');
        this.log(step.message);
        this.setPhase('SAFE');
        break;

      case 'banker-unsafe':
        this.deadlockedNodes = step.deadlockedProcesses;
        this.viz.restoreAll();
        this.viz.showNodeResult(false, step.deadlockedProcesses);
        this.addExplanation(stepNum, step.message, 'error');
        this.log(step.message, 'error');
        this.setPhase('UNSAFE');
        document.getElementById('recovery-section').style.display = 'block';
        this.buildRecoveryComparison(step.deadlockedProcesses, "Banker's");
        if (this.wfgVisible) this.renderWFG();
        break;
    }
  }

  // ─── Auto-play ───
  startAutoPlay() {
    if (this.detectionSteps.length === 0 || this.currentStepIndex >= this.detectionSteps.length) {
      // Start fresh step-through in auto mode
      this.isAutoPlaying = true;
      document.getElementById('auto-play-btn').disabled = true;
      document.getElementById('stop-play-btn').disabled = false;
      this.startStepThrough();
      return;
    }
    
    this.isAutoPlaying = true;
    document.getElementById('auto-play-btn').disabled = true;
    document.getElementById('stop-play-btn').disabled = false;
    this.runNextStep();
  }

  stopAutoPlay() {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    document.getElementById('auto-play-btn').disabled = false;
    document.getElementById('stop-play-btn').disabled = true;
  }

  // ─── Presets ───
  loadPreset(name) {
    this.saveState();
    this.stopAutoPlay();
    this.isStepping = false;
    this.detectionSteps = [];
    this.currentStepIndex = 0;
    this.deadlockedNodes = [];
    this.viz.restoreAll();
    this.clearExplanation();
    this.hideBankerMatrix();
    document.getElementById('recovery-section').style.display = 'none';
    this.graph.reset();
    this.processCounter = 1;
    this.resourceCounter = 1;
    this.setPhase('BUILD');

    const preset = PRESETS[name];
    if (preset) {
      this.log(`Loading preset: ${preset.label}`);
      
      preset.nodes.forEach(n => this.graph.addNode(n.type, n.id, n.data));
      preset.links.forEach(l => this.graph.addEdge(l.from, l.to, l.type));
      
      this.log(`${preset.label} loaded — ${preset.description}`);
      this.setExplanationMessage(`<strong>${preset.label}</strong><br><br>${preset.description}<br><br><em style="color:var(--accent-cyan);">Click Run Detection or Step-Through to analyze...</em>`);
      
      this.updateUI();

      // Auto-run detection after a brief pause to let the graph settle
      setTimeout(() => {
        this.runDetection();
      }, 1500);
    } else {
      this.log(`Preset "${name}" not found.`, 'error');
    }
  }

  // ─── Recovery Strategy Comparison ───
  buildRecoveryComparison(nodeIds, type) {
    const processIds = nodeIds.filter(id => {
      const node = this.graph.nodes.get(id);
      return node && node.type === 'process';
    });
    const victim = this.recovery.getVictim(nodeIds);

    // Compute per-process held resource counts
    const getHeld = (pid) =>
      Array.from(this.graph.edges.values()).filter(e => e.to === pid && e.type === 'assignment').length;

    const victimHeld = victim ? getHeld(victim) : 0;
    const totalHeld  = processIds.reduce((sum, pid) => sum + getHeld(pid), 0);

    // Waiting-for resources per process
    const getWaiting = (pid) =>
      Array.from(this.graph.edges.values()).filter(e => e.from === pid && e.type === 'request').length;
    const victimWaiting = victim ? getWaiting(victim) : 0;

    // ── Dynamic scoring: lower = better ──
    // Score = (processes_killed × 3) + (resources_freed × 1) + (work_lost_normalized × 2)
    const scores = {
      'kill-victim': (1 * 3) + (victimHeld * 1) + (1 * 2),
      'kill-all':    (processIds.length * 3) + (totalHeld * 1) + (processIds.length * 2),
      'preempt':     (0 * 3) + (victimHeld * 1) + (0.5 * 2)
    };
    const bestId = Object.entries(scores).reduce((a, b) => a[1] <= b[1] ? a : b)[0];
    this.log(`Best strategy selected: ${bestId === 'kill-victim' ? 'Kill Victim' : bestId === 'kill-all' ? 'Kill All' : 'Preemption'} (score: ${scores[bestId].toFixed(1)})`);

    // ── Strategy definitions ──
    const strategies = [
      {
        id: 'kill-victim',
        title: '🎯 Kill Victim Process',
        costBadge: `Score: ${scores['kill-victim'].toFixed(1)}`,
        badgeClass: bestId === 'kill-victim' ? 'badge-low' : 'badge-medium',
        isBest: bestId === 'kill-victim',
        metrics: [
          { label: 'Processes killed', val: 1,            max: processIds.length || 1, barClass: 'bar-green' },
          { label: 'Resources freed',  val: victimHeld,   max: Math.max(totalHeld, 1), barClass: 'bar-amber' },
          { label: 'Work lost',        val: 1,            max: processIds.length || 1, barClass: 'bar-green' }
        ],
        descHtml: `Terminates only <strong>${victim || '—'}</strong> (fewest resources held = ${victimHeld}). Least disruptive — all other processes continue normally once resources are freed.`,
        action: () => this.killVictim()
      },
      {
        id: 'kill-all',
        title: '💥 Kill All Deadlocked',
        costBadge: `Score: ${scores['kill-all'].toFixed(1)}`,
        badgeClass: bestId === 'kill-all' ? 'badge-low' : 'badge-high',
        isBest: bestId === 'kill-all',
        metrics: [
          { label: 'Processes killed', val: processIds.length, max: processIds.length || 1, barClass: 'bar-red' },
          { label: 'Resources freed',  val: totalHeld,          max: Math.max(totalHeld, 1), barClass: 'bar-red'  },
          { label: 'Work lost',        val: processIds.length,  max: processIds.length || 1, barClass: 'bar-red'  }
        ],
        descHtml: `Terminates all ${processIds.length} deadlocked process(es): <strong>${processIds.join(', ')}</strong>. Guaranteed resolution — but ALL work is lost.`,
        action: () => this.killAll()
      },
      {
        id: 'preempt',
        title: '🔄 Resource Preemption',
        costBadge: `Score: ${scores['preempt'].toFixed(1)}`,
        badgeClass: bestId === 'preempt' ? 'badge-low' : 'badge-medium',
        isBest: bestId === 'preempt',
        metrics: [
          { label: 'Processes killed', val: 0,           max: processIds.length || 1, barClass: 'bar-green' },
          { label: 'Resources freed',  val: victimHeld,  max: Math.max(totalHeld, 1), barClass: 'bar-amber' },
          { label: 'Work lost',        val: 0.5,         max: 1,                      barClass: 'bar-amber' }
        ],
        descHtml: `Forcibly reclaims resources from <strong>${victim || '—'}</strong> and rolls it back to a safe checkpoint. Process is <em>re-queued</em> — not terminated.`,
        action: () => this.preemptVictim()
      }
    ];

    // ── Render victim analysis card first ──
    const container = document.getElementById('recovery-comparison');
    container.innerHTML = '';

    if (victim && processIds.length > 0) {
      const processRows = processIds.map(pid => {
        const held = getHeld(pid);
        const waiting = getWaiting(pid);
        const isVictim = pid === victim;
        return `<div class="victim-process-row ${isVictim ? 'is-victim' : ''}">
          <span class="vp-name">${pid}</span>
          <span class="vp-stat">Holds: <strong>${held}</strong> · Waits: <strong>${waiting}</strong></span>
          ${isVictim ? '<span class="vp-badge selected">← Victim</span>' : ''}
        </div>`;
      }).join('');

      // Find the second-lowest for comparison
      const processHeldCounts = processIds.map(pid => ({ pid, held: getHeld(pid) }));
      processHeldCounts.sort((a, b) => a.held - b.held);
      const otherMax = processHeldCounts.length > 1 ? processHeldCounts[processHeldCounts.length - 1] : null;

      container.innerHTML += `
        <div class="victim-analysis-card">
          <div class="victim-analysis-header">
            <div class="victim-analysis-title">
              🎯 Victim Selected: <span class="victim-name">${victim}</span>
            </div>
          </div>
          <div class="victim-process-grid">${processRows}</div>
          <div class="victim-rationale">
            <strong>Rationale:</strong> ${victim} holds the fewest resources (${victimHeld})${otherMax && otherMax.pid !== victim ? ` compared to ${otherMax.pid}'s ${otherMax.held}` : ''}. Terminating it causes minimal disruption to the system.
          </div>
        </div>
      `;

      // Highlight victim on the canvas
      this.viz.highlightVictim(victim);
      this.log(`Victim selected: ${victim} — holds ${victimHeld} resource(s), waits for ${victimWaiting}`);
    }

    // ── Show WFG notification badge ──
    const notifBadge = document.getElementById('wfg-notif-badge');
    const wfgToggle = document.getElementById('wfg-toggle');
    if (notifBadge) notifBadge.classList.add('visible');
    if (wfgToggle) wfgToggle.classList.add('pulse-notif');

    // ── Render strategy cards ──
    strategies.forEach(s => {
      const card = document.createElement('div');
      card.className = 'recovery-card' + (s.isBest ? ' best-pick' : '');

      const metricsHtml = s.metrics.map(m => {
        const pct = Math.min(100, Math.round((m.val / m.max) * 100));
        const displayVal = Number.isInteger(m.val) ? m.val : (m.val === 0.5 ? 'Partial' : m.val);
        return `
          <div class="recovery-metric-row">
            <span class="recovery-metric-label">${m.label}</span>
            <div class="recovery-metric-bar-wrap">
              <div class="recovery-metric-bar ${m.barClass}" data-pct="${pct}" style="width:0%"></div>
            </div>
            <span class="recovery-metric-val">${displayVal}</span>
          </div>`;
      }).join('');

      card.innerHTML = `
        <div class="recovery-card-header">
          <span class="recovery-card-title">${s.title}</span>
          <span class="recovery-card-badge ${s.badgeClass}">${s.costBadge}</span>
        </div>
        <div class="recovery-metrics-grid">${metricsHtml}</div>
        <div class="recovery-card-desc">${s.descHtml}</div>
        <button class="recovery-apply-btn">Apply this strategy →</button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('recovery-apply-btn')) {
          s.action();
          return;
        }
        container.querySelectorAll('.recovery-card').forEach(c => c.classList.remove('selected'));
        card.classList.toggle('selected');
      });

      container.appendChild(card);
    });

    // Animate bars after render (needs a tick for layout)
    requestAnimationFrame(() => {
      container.querySelectorAll('.recovery-metric-bar').forEach(bar => {
        const pct = bar.dataset.pct;
        setTimeout(() => { bar.style.width = pct + '%'; }, 80);
      });
    });

    // ── Comparison summary table with scores ──
    const tableEl = document.getElementById('recovery-summary-table');
    if (tableEl) {
      tableEl.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Killed</th>
              <th>Freed</th>
              <th>Lost</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-strategy">Victim</td>
              <td>1</td>
              <td>${victimHeld}</td>
              <td>Min</td>
              <td class="${bestId === 'kill-victim' ? 'td-best' : ''}" style="color:${bestId === 'kill-victim' ? '#48bb78' : '#94a3b8'};">${scores['kill-victim'].toFixed(1)}${bestId === 'kill-victim' ? '★' : ''}</td>
            </tr>
            <tr>
              <td class="td-strategy">Kill All</td>
              <td>${processIds.length}</td>
              <td>${totalHeld}</td>
              <td>All</td>
              <td class="${bestId === 'kill-all' ? 'td-best' : ''}" style="color:${bestId === 'kill-all' ? '#48bb78' : '#f56565'};">${scores['kill-all'].toFixed(1)}${bestId === 'kill-all' ? '★' : ''}</td>
            </tr>
            <tr>
              <td class="td-strategy">Preempt</td>
              <td>0</td>
              <td>${victimHeld}</td>
              <td>Part</td>
              <td class="${bestId === 'preempt' ? 'td-best' : ''}" style="color:${bestId === 'preempt' ? '#48bb78' : '#f6ad55'};">${scores['preempt'].toFixed(1)}${bestId === 'preempt' ? '★' : ''}</td>
            </tr>
          </tbody>
        </table>
      `;
    }
  }

  // ─── Recovery Actions ───
  killVictim() {
    this.saveState();
    const victim = this.recovery.getVictim(this.deadlockedNodes);
    if (!victim) return;

    this.clearExplanation();
    this.addExplanation(1, `Strategy: Kill Victim — selected <strong>${victim}</strong> (fewest resources held)`, 'active');
    this.addExplanation(2, `Highlighting ${victim} for removal to break circular wait...`, 'error');
    this.viz.highlightVictim(victim);
    this.log(`Recovery [Kill Victim]: Terminating ${victim}...`);

    setTimeout(() => {
      this.viz.animateRemoval(victim, () => {
        this.recovery.terminateProcess(victim);
        this.log(`Recovery: ${victim} terminated — re-checking system state`);
        this.addExplanation(3, `${victim} removed — re-running detection to confirm resolution`, 'safe');
        if (this.wfgVisible) this.renderWFG();
        this.log('Pipeline: Recovery applied → Re-running detection...');
        setTimeout(() => this.runDetection(), 500);
      });
    }, 800);
  }

  killAll() {
    this.saveState();
    const processesToKill = this.deadlockedNodes.filter(id => {
      const node = this.graph.nodes.get(id);
      return node && node.type === 'process';
    });
    if (processesToKill.length === 0) return;

    this.clearExplanation();
    this.addExplanation(1, `Strategy: Kill All — terminating <strong>${processesToKill.join(', ')}</strong>`, 'error');
    this.addExplanation(2, 'All deadlocked processes will be removed simultaneously', 'error');
    this.log(`Recovery [Kill All]: Terminating ${processesToKill.join(', ')}`);

    let completed = 0;
    processesToKill.forEach(pid => {
      this.viz.animateRemoval(pid, () => {
        this.recovery.terminateProcess(pid);
        completed++;
        this.log(`Recovery: ${pid} terminated`);
        if (completed === processesToKill.length) {
          this.addExplanation(3, `All ${processesToKill.length} processes removed — re-running detection`, 'safe');
          this.log(`Recovery: System cleared — re-analyzing`);
          if (this.wfgVisible) this.renderWFG();
          this.log('Pipeline: Recovery applied → Re-running detection...');
          setTimeout(() => this.runDetection(), 500);
        }
      });
    });
  }

  preemptVictim() {
    this.saveState();
    const victim = this.recovery.getVictim(this.deadlockedNodes);
    if (!victim) return;

    // Find a resource held by victim to preempt
    const heldEdge = Array.from(this.graph.edges.values()).find(
      e => e.to === victim && e.type === 'assignment'
    );
    if (!heldEdge) {
      this.log('Preemption: No held resources found on victim.', 'error');
      return;
    }

    this.clearExplanation();
    this.addExplanation(1, `Strategy: Preemption — rolling back <strong>${victim}</strong>`, 'active');
    this.addExplanation(2, `Reclaiming <strong>${heldEdge.from}</strong> from ${victim} — converting allocation to request`, 'active');
    this.addExplanation(3, `${victim} rolls back to checkpoint; ${heldEdge.from} released to system`, 'safe');
    this.log(`Recovery [Preemption]: Reclaiming ${heldEdge.from} from ${victim}`);

    this.viz.highlightVictim(victim);
    setTimeout(() => {
      this.recovery.preemptResource(heldEdge.from, victim);
      this.log(`Recovery: ${heldEdge.from} preempted from ${victim} — process rolled back`);
      this.updateUI();
      if (this.wfgVisible) this.renderWFG();
      this.log('Pipeline: Recovery applied → Re-running detection...');
      setTimeout(() => this.runDetection(), 600);
    }, 900);
  }


  // History Management
  saveState() {
    // Remove future states if we are in the middle of history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Create deep snapshot
    const snapshot = this.checkpoint.createSnapshot(this.graph);
    this.history.push(snapshot);
    
    // Maintain max size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  rollback() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      this.checkpoint.restore(this.graph, previousState);
      this.viz.restoreAll();
      this.log(`Rolled back to state ${this.historyIndex + 1}/${this.history.length}`);
      this.setPhase('BUILD');
      this.clearExplanation();
      this.hideBankerMatrix();
      this.deadlockedNodes = [];
      document.getElementById('recovery-section').style.display = 'none';
      this._clearWFGBadge();
      this.updateUI();
    } else if (this.historyIndex === 0) {
      const firstState = this.history[0];
      this.checkpoint.restore(this.graph, firstState);
      this.viz.restoreAll();
      this.log("Already at the initial state.");
      this.updateUI();
    } else {
      this.log("No history to rollback.", 'info');
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      this.checkpoint.restore(this.graph, nextState);
      this.viz.restoreAll();
      this.log(`Restored state ${this.historyIndex + 1}/${this.history.length}`);
      this.setPhase('BUILD');
      this.clearExplanation();
      this.hideBankerMatrix();
      this.deadlockedNodes = [];
      document.getElementById('recovery-section').style.display = 'none';
      this._clearWFGBadge();
      this.updateUI();
    } else {
      this.log("No future states to redo.", 'info');
    }
  }

  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
  }

  reset() {
    this.saveState();
    this.stopAutoPlay();
    this.isStepping = false;
    this.detectionSteps = [];
    this.currentStepIndex = 0;
    this.graph.reset();
    this.processCounter = 1;
    this.resourceCounter = 1;
    this.deadlockedNodes = [];
    this.viz.restoreAll();
    this.clearExplanation();
    this.hideBankerMatrix();
    document.getElementById('recovery-section').style.display = 'none';
    this._clearWFGBadge();
    this.setPhase('BUILD');
    this.setExplanationMessage('<span style="color:var(--text-dim);font-style:italic;">Run detection or step-through to see live explanations...</span>');
    this.log("Canvas cleared — simulator reset");
    this.updateUI();
  }

  updateUI() {
    const snapshot = this.graph.getSnapshot();
    console.log(`Updating UI: Nodes=${snapshot.nodes.length}, Edges=${snapshot.links.length}`);
    this.viz.update(snapshot);
    
    document.getElementById('graph-stats').innerText = 
      `Nodes: ${snapshot.nodes.length} | Edges: ${snapshot.links.length}`;

    // Update Algorithm Mode Indicator
    const isMultiInstance = snapshot.nodes.some(n => n.type === 'resource' && (n.totalInstances || 1) > 1);
    const algoMode = document.getElementById('algo-mode');
    if (isMultiInstance) {
      algoMode.innerText = 'Banker\'s';
      algoMode.style.color = '#f6ad55'; // Amber
    } else {
      algoMode.innerText = 'DFS';
      algoMode.style.color = '#4fd1c5'; // Cyan
    }

    // Update History Buttons
    const rollbackBtn = document.getElementById('rollback-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (rollbackBtn) rollbackBtn.disabled = this.historyIndex < 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    
    const status = document.getElementById('checkpoint-status');
    if (status) {
      const count = this.history.length;
      status.innerText = count > 0 
        ? `History: ${this.historyIndex + 1} / ${count} states` 
        : 'No history items';
    }
  }

  log(message, type = 'info') {
    const log = document.getElementById('event-log');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = document.createElement('div');
    item.className = 'log-item';
    if (type === 'error') item.style.color = '#f56565';
    item.innerHTML = `<span class="log-time">${time}</span>${message}`;
    log.prepend(item);
  }

  // ─── WFG Badge Helper ───
  _clearWFGBadge() {
    const badge = document.getElementById('wfg-notif-badge');
    if (badge) badge.classList.remove('visible');
    const wfgToggle = document.getElementById('wfg-toggle');
    if (wfgToggle) wfgToggle.classList.remove('pulse-notif');
  }

  // ─── Wait-For Graph (WFG) Engine ───

  /**
   * Derives a Wait-For Graph from the RAG.
   * WFG has only process nodes; an edge Pi → Pj means
   * Pi is waiting for a resource currently held by Pj.
   */
  buildWFGData() {
    const snapshot = this.graph.getSnapshot();
    const processes = snapshot.nodes.filter(n => n.type === 'process');
    const edges = [];
    const cycleSet = new Set(this.deadlockedNodes.filter(id => {
      const n = this.graph.nodes.get(id);
      return n && n.type === 'process';
    }));

    // For each request edge P -> R, find who holds R (R -> P2)
    for (const reqEdge of snapshot.links) {
      if (reqEdge.type !== 'request') continue;
      const waitingProcess = reqEdge.from;   // Pi requesting
      const resource = reqEdge.to;            // resource wanted

      // Find all holders of that resource
      for (const allocEdge of snapshot.links) {
        if (allocEdge.type !== 'assignment') continue;
        if (allocEdge.from !== resource) continue;
        const holdingProcess = allocEdge.to; // Pj holding
        if (holdingProcess !== waitingProcess) {
          const inCycle = cycleSet.has(waitingProcess) && cycleSet.has(holdingProcess);
          edges.push({
            id: `${waitingProcess}-waitsfor-${holdingProcess}`,
            source: waitingProcess,
            target: holdingProcess,
            viaResource: resource,
            inCycle,
            reason: `${waitingProcess} waits for ${resource} held by ${holdingProcess} → edge ${waitingProcess} → ${holdingProcess}`
          });
        }
      }
    }

    return { nodes: processes, edges, cycleSet };
  }

  renderWFG() {
    const d3 = window.d3;
    const container = document.getElementById('wfg-canvas');
    if (!container) return;

    // Stop old simulation
    if (this.wfgSimulation) this.wfgSimulation.stop();
    // Preserve the legend element
    const legendEl = container.querySelector('#wfg-canvas-legend');
    // Remove only the SVG children (not the legend overlay)
    container.querySelectorAll('svg').forEach(s => s.remove());

    const { nodes, edges, cycleSet } = this.buildWFGData();
    const rect = container.getBoundingClientRect();
    const W = rect.width || 600;
    const H = rect.height || 300;

    const svg = d3.select(container).append('svg')
      .attr('width', '100%').attr('height', '100%');

    // Defs: markers
    const defs = svg.append('defs');
    ['normal','cycle'].forEach(t => {
      defs.append('marker')
        .attr('id', `wfg-arrow-${t}`)
        .attr('viewBox','0 -5 10 10').attr('refX', 28).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5')
        .attr('fill', t === 'cycle' ? '#f56565' : '#94a3b8');
    });

    // Empty state
    if (nodes.length === 0) {
      svg.append('text').attr('x', W/2).attr('y', H/2)
        .attr('text-anchor','middle').attr('fill','#94a3b8')
        .attr('font-size','0.8rem')
        .text('No processes in graph — add processes and connect them.');
      this._renderWFGInfo([], cycleSet);
      return;
    }

    if (edges.length === 0) {
      svg.append('text').attr('x', W/2).attr('y', H/2 - 12)
        .attr('text-anchor','middle').attr('fill','#94a3b8')
        .attr('font-size','0.8rem')
        .text('No wait-for dependencies.');
      svg.append('text').attr('x', W/2).attr('y', H/2 + 12)
        .attr('text-anchor','middle').attr('fill','#48bb78')
        .attr('font-size','0.75rem')
        .text('All processes are either running freely or holding resources with no contention.');
      this._renderWFGInfo(edges, cycleSet);
      return;
    }

    // Clone nodes for simulation
    const simNodes = nodes.map(n => ({ ...n }));
    const nodeById = new Map(simNodes.map(n => [n.id, n]));
    const simEdges = edges.map(e => ({
      ...e,
      source: nodeById.get(e.source) || e.source,
      target: nodeById.get(e.target) || e.target
    }));

    // Background annotation
    if (cycleSet.size > 0) {
      svg.append('text').attr('x', W/2).attr('y', 22)
        .attr('text-anchor','middle').attr('fill','rgba(245,101,101,0.6)')
        .attr('font-size','0.68rem').attr('font-style','italic')
        .text(`Cycle detected — ${[...cycleSet].join(' → ')} → ${[...cycleSet][0]}`);
    } else {
      svg.append('text').attr('x', W/2).attr('y', 22)
        .attr('text-anchor','middle').attr('fill','rgba(72,187,120,0.6)')
        .attr('font-size','0.68rem').attr('font-style','italic')
        .text('No cycle in wait-for graph — system is safe');
    }

    // Edges
    const linkG = svg.append('g');
    const linkSel = linkG.selectAll('line').data(simEdges).enter().append('line')
      .attr('stroke', d => d.inCycle ? '#f56565' : '#64748b')
      .attr('stroke-width', d => d.inCycle ? 2.5 : 1.5)
      .attr('stroke-dasharray', d => d.inCycle ? 'none' : '4,3')
      .attr('marker-end', d => `url(#wfg-arrow-${d.inCycle ? 'cycle' : 'normal'})`)
      .style('filter', d => d.inCycle ? 'drop-shadow(0 0 5px #f56565)' : 'none')
      .classed('wfg-cycle-edge', d => d.inCycle)
      .style('opacity', 0.85);

    // Edge labels (show via-resource)
    const labelG = svg.append('g');
    const labelSel = labelG.selectAll('text').data(simEdges).enter().append('text')
      .attr('class', d => `wfg-edge-label ${d.inCycle ? 'cycle' : ''}`)
      .text(d => `via ${typeof d.viaResource === 'object' ? d.viaResource.id : d.viaResource}`);

    // Nodes
    const nodeG = svg.append('g');
    const tooltip = document.getElementById('wfg-node-tooltip');
    const nodeSel = nodeG.selectAll('g').data(simNodes).enter().append('g')
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag',  (ev, d) => { d.fx=ev.x; d.fy=ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      )
      .on('mouseenter', (ev, d) => {
        if (!tooltip) return;
        const holds = Array.from(this.graph.edges.values())
          .filter(e => e.to === d.id && e.type === 'assignment').map(e => e.from);
        const waits = Array.from(this.graph.edges.values())
          .filter(e => e.from === d.id && e.type === 'request').map(e => e.to);
        document.getElementById('wfg-tt-title').textContent = d.id;
        document.getElementById('wfg-tt-status').textContent = cycleSet.has(d.id) ? 'Deadlocked' : 'Running';
        document.getElementById('wfg-tt-status').style.color = cycleSet.has(d.id) ? '#f56565' : '#48bb78';
        document.getElementById('wfg-tt-holds').textContent = holds.length > 0 ? holds.join(', ') : 'None';
        document.getElementById('wfg-tt-waits').textContent = waits.length > 0 ? waits.join(', ') : 'None';
        document.getElementById('wfg-tt-cycle').textContent = cycleSet.has(d.id) ? 'Yes' : 'No';
        document.getElementById('wfg-tt-cycle').style.color = cycleSet.has(d.id) ? '#f56565' : '#48bb78';
        tooltip.style.display = 'block';
        tooltip.style.left = (ev.clientX + 14) + 'px';
        tooltip.style.top = (ev.clientY - 10) + 'px';
      })
      .on('mouseleave', () => { if (tooltip) tooltip.style.display = 'none'; });

    nodeSel.append('circle')
      .attr('r', 26)
      .attr('fill', '#1e293b')
      .attr('stroke', d => cycleSet.has(d.id) ? '#f56565' : '#4fd1c5')
      .attr('stroke-width', d => cycleSet.has(d.id) ? 3 : 2)
      .style('filter', d => cycleSet.has(d.id) ? 'drop-shadow(0 0 10px #f56565)' : 'drop-shadow(0 0 4px #4fd1c5)');

    nodeSel.append('text')
      .attr('text-anchor','middle').attr('dy', 5)
      .attr('fill', d => cycleSet.has(d.id) ? '#f56565' : '#f8fafc')
      .attr('font-size','0.75rem').attr('font-weight','600')
      .style('pointer-events','none')
      .text(d => d.id);

    // Force simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(W/2, H/2))
      .force('collision', d3.forceCollide().radius(45))
      .on('tick', () => {
        linkSel
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        labelSel
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2 - 6);
        nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    this.wfgSimulation = sim;
    this._renderWFGInfo(edges, cycleSet);

    // Log WFG events
    this.log('WFG generated — showing process-to-process dependencies');
    if (cycleSet.size > 0) {
      this.log(`Cycle detected in WFG: ${[...cycleSet].join(' → ')} → ${[...cycleSet][0]}`, 'error');
    } else {
      this.log('WFG: System is SAFE — no cycle found');
    }
  }

  _renderWFGInfo(edges, cycleSet) {
    const infoEl = document.getElementById('wfg-info');
    if (!infoEl) return;

    const cycleProcesses = [...cycleSet];
    const statusClass = cycleProcesses.length > 0 ? 'deadlocked' : 'safe';
    const statusText  = cycleProcesses.length > 0
      ? `⚠️ Deadlock — ${cycleProcesses.length} process(es) in cycle`
      : '✅ No deadlock detected';

    // Build dependency explanation lines
    const depLines = edges.length > 0
      ? edges.map(e => {
          const src = typeof e.source === 'object' ? e.source.id : e.source;
          const tgt = typeof e.target === 'object' ? e.target.id : e.target;
          const via = typeof e.viaResource === 'object' ? e.viaResource.id : (e.viaResource || '?');
          const isCycle = e.inCycle;
          return `<div class="dep-line">
            <span class="dep-arrow ${isCycle ? 'cycle' : ''}">${isCycle ? '⚠' : '→'}</span>
            <span>${src} waits for <strong>${via}</strong> held by ${tgt}</span>
            <span class="dep-reason">${isCycle ? '(cycle edge)' : ''}</span>
          </div>`;
        }).join('')
      : '<div style="color:var(--text-dim);font-style:italic;">No wait-for dependencies</div>';

    infoEl.innerHTML = `
      <div class="wfg-info-card ${statusClass}">
        <strong>Cycle Status</strong>
        <div class="value" style="font-size:0.85rem;">${statusText}</div>
      </div>
      <div class="wfg-info-card">
        <strong>WFG Edges</strong>
        <div class="value">${edges.length}</div>
        <div style="font-size:0.6rem;margin-top:4px;">${
          edges.length > 0
            ? edges.map(e => `${typeof e.source==='object'?e.source.id:e.source} → ${typeof e.target==='object'?e.target.id:e.target}`).join(', ')
            : 'No wait dependencies'
        }</div>
      </div>
      <div class="wfg-info-card">
        <strong>Involved Processes</strong>
        <div class="value">${cycleProcesses.length > 0 ? cycleProcesses.join(', ') : 'None'}</div>
        <div style="font-size:0.6rem;margin-top:4px;">${
          cycleProcesses.length > 0
            ? 'These processes form a circular wait chain'
            : 'All processes can eventually proceed'
        }</div>
      </div>
      <div class="wfg-dep-explanation">
        <strong style="color:var(--accent-cyan);font-size:0.6rem;text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:6px;">Dependency Explanation</strong>
        ${depLines}
      </div>
      <div class="wfg-info-card">
        <strong>Why WFG?</strong>
        <div style="font-size:0.62rem;margin-top:4px;line-height:1.5;">
          The RAG shows resources too. WFG strips them out to reveal only <em>which process waits for which</em> — making cycles immediately visible.
        </div>
      </div>
    `;
  }

  toggleWFG() {
    const modal  = document.getElementById('wfg-modal');
    const toggle = document.getElementById('wfg-toggle');
    if (!this.wfgVisible) {
      this.wfgVisible = true;
      modal.classList.add('visible');
      toggle.classList.add('active');
      this._clearWFGBadge();
      this.renderWFG();
      this.log('Wait-For Graph opened — showing process-to-process dependencies');
    } else {
      this.closeWFG();
    }
  }

  closeWFG() {
    const modal  = document.getElementById('wfg-modal');
    const toggle = document.getElementById('wfg-toggle');
    this.wfgVisible = false;
    modal.classList.remove('visible');
    toggle.classList.remove('active');
    if (this.wfgSimulation) { this.wfgSimulation.stop(); this.wfgSimulation = null; }
  }
}
// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
