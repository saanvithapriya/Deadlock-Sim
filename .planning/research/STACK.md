# Stack Research: Deadlock Simulator

## Recommendation: Modular Vanilla JS with SVG (D3.js/Cytoscape.js)

### Frontend Core
- **Language**: Vanilla JavaScript (ES6+).
- **Styling**: Vanilla CSS (Modern CSS variables, Flexbox/Grid).
- **Rendering**: SVG (Scalable Vector Graphics) is preferred over Canvas for RAGs because:
    - RAGs typically have < 200 nodes; SVG performance is excellent.
    - Crisp rendering at all zoom levels is critical for educational tools.
    - Easy to attach event listeners to individual nodes/edges for interaction.
    - CSS-based animations for highlighting cycles.

### Visualization Libraries
- **D3.js**: Best for custom, data-driven layouts and smooth transitions. High flexibility for "dots" in resource rectangles.
- **Cytoscape.js**: More specialized for graph theory; better built-in graph manipulation and analysis (though D3 is better for custom aesthetics).

### Data Management
- **State**: Simple JavaScript objects/classes for the Graph Engine.
- **Persistence**: Local browser storage or JSON file import/export.

### Complexity Considerations
- **Detection**: O(V+E) for DFS (Cycle detection).
- **Banker's Algorithm**: O(M * N^2) where M is resource types and N is processes.

---
*Confidence: High*
