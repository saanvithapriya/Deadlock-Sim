/**
 * VisualizationEngine.js
 * Renders the Resource Allocation Graph (RAG) using D3.js.
 */

export class VisualizationEngine {
  constructor(containerId) {
    console.log("VisualizationEngine initializing for:", containerId);
    if (!window.d3) {
      console.error("D3 NOT FOUND! app will not render.");
      return;
    }
    const d3 = window.d3;
    this.container = d3.select(containerId);
    
    const boundingRect = this.container.node().getBoundingClientRect();
    this.width = boundingRect.width || window.innerWidth - 280;
    this.height = boundingRect.height || window.innerHeight;
    
    this.svg = this.container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('display', 'block')
      .call(d3.zoom().on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      }));

    this.g = this.svg.append('g'); 
    this.setupMarkers();
    
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(50));

    this.nodes = [];
    this.links = [];
    this.linkLayerG = this.g.append('g').attr('class', 'links');
    this.phantomLayerG = this.g.append('g').attr('class', 'phantom-layer');
    this.nodeLayerG = this.g.append('g').attr('class', 'nodes');
    
    this.linkMode = false;
    this.onLinkCreated = null;

    // Pulse animation timers
    this._pulseTimers = [];

    // Flow animation CSS + enhanced animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes flow { to { stroke-dashoffset: -20; } }
      @keyframes nodeGlow {
        0%   { filter: drop-shadow(0 0 4px currentColor); }
        50%  { filter: drop-shadow(0 0 16px currentColor); }
        100% { filter: drop-shadow(0 0 4px currentColor); }
      }
      @keyframes cyclePulse {
        0%   { stroke-opacity: 0.6; stroke-width: 3px; }
        50%  { stroke-opacity: 1;   stroke-width: 6px; }
        100% { stroke-opacity: 0.6; stroke-width: 3px; }
      }
      @keyframes safeComplete {
        0%   { filter: drop-shadow(0 0 0px #4fd1c5); }
        50%  { filter: drop-shadow(0 0 20px #48bb78); }
        100% { filter: drop-shadow(0 0 6px #48bb78); }
      }
      .link-flow { stroke-dasharray: 5,5; animation: flow 1s linear infinite; }
      .link-safe { stroke: #4fd1c5 !important; filter: drop-shadow(0 0 5px #4fd1c5); stroke-width: 4px !important; }
      .link-deadlock { stroke: #f56565 !important; filter: drop-shadow(0 0 8px #f56565); stroke-width: 4px !important; }
      .link-cycle-pulse { stroke: #f56565 !important; animation: cyclePulse 1.5s ease-in-out infinite; filter: drop-shadow(0 0 8px #f56565); }
      .node-active-glow { animation: nodeGlow 1.2s ease-in-out infinite; }
      .node-safe-complete { animation: safeComplete 1s ease-out forwards; }
    `;
    document.head.appendChild(style);

    // Ticker - fixed to use the group containers correctly
    this.simulation.on('tick', () => {
      this.linkLayerG.selectAll('.link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      this.nodeLayerG.selectAll('.node')
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  setupMarkers() {
    const defs = this.svg.append('defs');
    // Default markers
    defs.append('marker').attr('id', 'arrow-assignment').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#4fd1c5');
    defs.append('marker').attr('id', 'arrow-request').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#f6ad55');
    // Highlighted markers for step-through
    defs.append('marker').attr('id', 'arrow-highlight').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#ffd700');
    // Deadlock cycle markers
    defs.append('marker').attr('id', 'arrow-deadlock').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#f56565');
    // Safe markers
    defs.append('marker').attr('id', 'arrow-safe').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#48bb78');

    // Glow filter for active node
    const glowFilter = defs.append('filter').attr('id', 'glow-active');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  update(graphSnapshot) {
    const { nodes, links } = graphSnapshot;
    this.nodes = nodes.map(d => ({ ...d }));
    this.links = links.map(d => ({ ...d, source: d.from, target: d.to }));
    this.simulation.nodes(this.nodes);
    this.simulation.force('link').links(this.links);
    this.render();
    this.simulation.alpha(1).restart();
  }

  render() {
    const d3 = window.d3;
    
    // Render Links
    const link = this.linkLayerG.selectAll('.link').data(this.links, d => d.id);
    link.exit().remove();
    link.enter().append('line')
      .attr('class', 'link')
      .attr('stroke-width', 2)
      .attr('stroke', d => d.type === 'assignment' ? '#4fd1c5' : '#f6ad55')
      .attr('stroke-dasharray', d => d.type === 'request' ? '5,5' : 'none')
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Render Nodes
    const node = this.nodeLayerG.selectAll('.node').data(this.nodes, d => d.id);
    node.exit().remove();
    const self = this;
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', function(event, d) { self.onDragStarted(event, d, this); })
        .on('drag', function(event, d) { self.onDragged(event, d, this); })
        .on('end', function(event, d) { self.onDragEnded(event, d, this); }));

    nodeEnter.filter(d => d.type === 'process').append('circle').attr('r', 30).attr('fill', '#1e293b').attr('stroke', '#4fd1c5').attr('stroke-width', 2);
    const resNodes = nodeEnter.filter(d => d.type === 'resource');
    resNodes.append('rect').attr('width', 70).attr('height', 50).attr('x', -35).attr('y', -25).attr('rx', 6).attr('fill', '#1e293b').attr('stroke', '#f6ad55').attr('stroke-width', 2);
    resNodes.each(function(d) {
      const g = d3.select(this);
      const instances = d.totalInstances || 1;
      const cols = Math.ceil(Math.sqrt(instances));
      const spacing = 12;
      for (let i = 0; i < instances; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        g.append('circle').attr('cx', (col - (cols - 1) / 2) * spacing).attr('cy', (row - (Math.ceil(instances / cols) - 1) / 2) * spacing).attr('r', 3).attr('fill', '#f6ad55').attr('opacity', 0.6);
      }
    });
    nodeEnter.append('text').attr('dy', 5).attr('text-anchor', 'middle').attr('fill', '#fff').style('font-weight', '600').style('pointer-events', 'none').text(d => d.id);
  }

  // ─── New: Highlight a specific node with color and glow ───
  highlightNode(nodeId, color, addGlow = true) {
    const sel = this.nodeLayerG.selectAll('circle, rect')
      .filter(d => d.id === nodeId);
    
    sel.transition()
      .duration(300)
      .attr('stroke', color)
      .attr('stroke-width', 5)
      .attr('filter', `drop-shadow(0 0 12px ${color})`);
    
    if (addGlow) {
      sel.classed('node-active-glow', true)
        .style('color', color);
    }
  }

  // ─── New: Highlight a specific edge ───
  highlightEdge(from, to, color = '#ffd700') {
    this.linkLayerG.selectAll('.link')
      .filter(d => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return src === from && tgt === to;
      })
      .transition()
      .duration(300)
      .attr('stroke', color)
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', 'none')
      .attr('marker-end', 'url(#arrow-highlight)')
      .style('filter', `drop-shadow(0 0 6px ${color})`);
  }

  // ─── New: Dim all nodes except active ones ───
  dimAllExcept(activeNodeIds = []) {
    // Dim nodes
    this.nodeLayerG.selectAll('.node')
      .transition()
      .duration(400)
      .attr('opacity', d => activeNodeIds.includes(d.id) ? 1 : 0.25);

    // Dim edges
    this.linkLayerG.selectAll('.link')
      .transition()
      .duration(400)
      .attr('opacity', d => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return (activeNodeIds.includes(src) || activeNodeIds.includes(tgt)) ? 1 : 0.15;
      });
  }

  // ─── New: Restore all nodes/edges to default appearance ───
  restoreAll() {
    // Stop any pulse timers
    this._pulseTimers.forEach(t => clearInterval(t));
    this._pulseTimers = [];

    // Restore node opacity and remove glow classes
    this.nodeLayerG.selectAll('.node')
      .transition()
      .duration(400)
      .attr('opacity', 1);

    this.nodeLayerG.selectAll('circle, rect')
      .classed('node-active-glow', false)
      .classed('node-safe-complete', false)
      .transition()
      .duration(400)
      .attr('stroke', d => d.type === 'process' ? '#4fd1c5' : '#f6ad55')
      .attr('stroke-width', 2)
      .attr('filter', 'none')
      .style('color', null);

    // Restore link opacity and classes
    this.linkLayerG.selectAll('.link')
      .classed('link-flow', false)
      .classed('link-safe', false)
      .classed('link-deadlock', false)
      .classed('link-cycle-pulse', false)
      .transition()
      .duration(400)
      .attr('opacity', 1)
      .attr('stroke', d => d.type === 'assignment' ? '#4fd1c5' : '#f6ad55')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'request' ? '5,5' : 'none')
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .style('filter', 'none');
  }

  // ─── New: Animate cycle pulse (continuous red pulse on cycle edges/nodes) ───
  animateCyclePulse(cycleNodes) {
    // Highlight cycle nodes red
    cycleNodes.forEach(nodeId => {
      this.nodeLayerG.selectAll('circle, rect')
        .filter(d => d.id === nodeId)
        .transition()
        .duration(500)
        .attr('stroke', '#f56565')
        .attr('stroke-width', 5)
        .attr('filter', 'drop-shadow(0 0 10px #f56565)');
    });

    // Highlight and pulse cycle edges
    for (let i = 0; i < cycleNodes.length; i++) {
      const from = cycleNodes[i];
      const to = cycleNodes[(i + 1) % cycleNodes.length];
      this.linkLayerG.selectAll('.link')
        .filter(d => {
          const src = typeof d.source === 'object' ? d.source.id : d.source;
          const tgt = typeof d.target === 'object' ? d.target.id : d.target;
          return src === from && tgt === to;
        })
        .classed('link-cycle-pulse', true)
        .attr('marker-end', 'url(#arrow-deadlock)');
    }
  }

  // ─── New: Animate safe sequence (processes completing one by one in green) ───
  animateSafeSequence(sequence, callback) {
    const delay = 800;
    
    sequence.forEach((processId, index) => {
      setTimeout(() => {
        // Glow green
        this.nodeLayerG.selectAll('circle, rect')
          .filter(d => d.id === processId)
          .classed('node-safe-complete', true)
          .transition()
          .duration(600)
          .attr('stroke', '#48bb78')
          .attr('stroke-width', 6)
          .attr('filter', 'drop-shadow(0 0 15px #48bb78)');

        // Also highlight connected edges
        this.linkLayerG.selectAll('.link')
          .filter(d => {
            const src = typeof d.source === 'object' ? d.source.id : d.source;
            const tgt = typeof d.target === 'object' ? d.target.id : d.target;
            return src === processId || tgt === processId;
          })
          .transition()
          .duration(600)
          .attr('stroke', '#48bb78')
          .attr('stroke-width', 3)
          .attr('marker-end', 'url(#arrow-safe)')
          .style('filter', 'drop-shadow(0 0 4px #48bb78)');

        if (index === sequence.length - 1 && callback) {
          setTimeout(callback, delay);
        }
      }, index * delay);
    });
  }

  onDragStarted(event, d, nodeElement) {
    if (this.linkMode) {
      this.dragSource = d;
      this.phantomLayerG.append('line').attr('class', 'phantom-link').attr('x1', d.x).attr('y1', d.y).attr('x2', d.x).attr('y2', d.y).attr('stroke', 'var(--accent-cyan)').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
    } else {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
  }

  onDragged(event, d, nodeElement) {
    if (this.linkMode && this.dragSource) {
      this.phantomLayerG.select('.phantom-link').attr('x2', event.x).attr('y2', event.y);
    } else {
      d.fx = event.x; d.fy = event.y;
    }
  }

  onDragEnded(event, d, nodeElement) {
    if (this.linkMode) {
      this.phantomLayerG.selectAll('.phantom-link').remove();
      const element = document.elementFromPoint(event.sourceEvent.clientX, event.sourceEvent.clientY);
      if (element) {
        const targetG = element.closest('.node');
        const targetNode = targetG ? window.d3.select(targetG).datum() : null;
        if (targetNode && targetNode.id && targetNode.id !== d.id && this.onLinkCreated) {
          this.onLinkCreated(d.id, targetNode.id);
        }
      }
      this.dragSource = null;
    } else {
      if (!event.active) this.simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }
  }

  highlightVictim(nodeId) {
    this.nodeLayerG.selectAll('circle, rect').filter(d => d.id === nodeId).transition().duration(500).attr('stroke', '#f56565').attr('stroke-width', 8).attr('filter', 'drop-shadow(0 0 10px #f56565)');
  }

  animateRemoval(nodeId, callback) {
    this.nodeLayerG.selectAll('.node').filter(d => d.id === nodeId).transition().duration(500).attr('opacity', 0).attr('transform', d => `translate(${d.x},${d.y}) scale(0.5)`).remove().on('end', callback);
    this.linkLayerG.selectAll('.link').filter(d => d.from === nodeId || d.to === nodeId).transition().duration(300).attr('opacity', 0).remove();
  }

  setAnalysisMode(isActive) {
    this.linkLayerG.selectAll('.link').classed('link-flow', isActive);
    if (isActive) this.linkLayerG.selectAll('.link').classed('link-safe', false).classed('link-deadlock', false).classed('link-cycle-pulse', false);
  }

  showAnalysisResult(isSafe, cycleNodes = []) {
    this.setAnalysisMode(false);
    this.linkLayerG.selectAll('.link').classed('link-safe', false).classed('link-deadlock', false).classed('link-cycle-pulse', false);
    if (isSafe) {
      this.linkLayerG.selectAll('.link').classed('link-safe', true);
      setTimeout(() => this.linkLayerG.selectAll('.link').classed('link-safe', false), 2000);
    } else {
      this.animateCyclePulse(cycleNodes);
    }
  }

  showNodeResult(isSafe, nodeIds = []) {
    const nodes = this.nodeLayerG.selectAll('circle, rect');
    nodes.classed('node-active-glow', false).classed('node-safe-complete', false);
    nodes.transition().duration(500).attr('stroke', d => d.type === 'process' ? '#4fd1c5' : '#f6ad55').attr('stroke-width', 2).attr('filter', 'none');
    if (isSafe) {
      nodes.transition().duration(800).attr('stroke', '#4fd1c5').attr('stroke-width', 6).attr('filter', 'drop-shadow(0 0 8px #4fd1c5)').transition().duration(1200).attr('stroke', 'rgba(255,255,255,0.8)').attr('stroke-width', 2).attr('filter', 'none');
    } else {
      nodes.filter(d => nodeIds.includes(d.id)).transition().duration(500).attr('stroke', '#f56565').attr('stroke-width', 5).attr('filter', 'drop-shadow(0 0 10px #f56565)');
    }
  }
}
