// Home.js - Homepage for Deadlock Simulator

import { deadlockTopics } from './deadlock-details.js';

export function renderHome(containerId = 'main-content') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  console.log("Rendering Home Page..."); // Helpful debug log

  container.innerHTML = `
    <section class="home-section">
      <div style="text-align: center; width: 100%;">
        <h1 style="font-size: 3.5rem; font-weight: 900; background: linear-gradient(to right, #4fd1c5, #805ad5); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -2px; margin-bottom: 20px;">
          Deadlock Simulator
        </h1>
        
        <p style="color: #94a3b8; font-size: 1.25rem; max-width: 700px; margin: 0 auto 30px; line-height: 1.6;">
          An advanced interactive platform to learn, visualize, and experiment with 
          <span style="color: var(--accent-cyan); font-weight: 600;">DFS Cycle Detection</span> and 
          <span style="color: var(--accent-purple); font-weight: 600;">Banker's Algorithm</span>.
        </p>

        <div style="display: flex; justify-content: center; margin-bottom: 60px;">
          <button class="start-btn" onclick="gotoApp()">
            Start Simulator
          </button>
        </div>
      </div>

      <div class="topic-grid">
        ${deadlockTopics.map(topic => `
          <div class="topic-card">
            <h2>${topic.title}</h2>
            <div>${topic.content}</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 80px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; width: 100%;">
        <p style="color: #64748b; font-size: 0.95rem; font-style: italic;">
          Designed for academic excellence in Operating Systems education.
        </p>
      </div>
    </section>
  `;
}
