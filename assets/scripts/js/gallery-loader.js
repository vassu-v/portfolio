/**
 * gallery-loader.js
 * Fetches data from JSON files and renders the Highlights and Projects galleries.
 */

(async function () {
  "use strict";

  const PROJECT_COLORS = ["#A6D8A3", "#C4E0C1", "#A7D8A1", "#A0C7A4", "#A4D3B1", "#FFB3A6", "#7FBFFF", "#F4C074", "#F29AC1", "#66C28E"];

  /**
   * Injects the dynamic CSS required for the galleries.
   */
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
        /* Highlights (formerly Experience) Gallery Styles */
        .explore-gallery-wrapper { 
          font-family: sans-serif; 
          color: #fff; 
          overflow: hidden; 
          box-sizing: border-box;
        }
        
        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 20px;
          padding: 10px 0;
          box-sizing: border-box;
        }

        .highlight-card {
          position: relative;
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          min-height: 220px; /* Ensure enough height for text */
          height: auto;
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }

        .highlight-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }

        .highlight-card img {
          width: 100%;
          height: 100%;
          min-height: 220px;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .highlight-card:hover img {
          transform: scale(1.1);
        }

        .highlight-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 15px;
          /* Deeper gradient for better text isolation */
          background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7) 40%, transparent); 
          transition: all 0.3s ease;
        }

        .highlight-card:hover .highlight-overlay {
          background: rgba(0, 0, 0, 0.7); /* Solidify on hover for text clarity */
        }

        .highlight-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .highlight-desc {
          font-size: 0.8rem; /* Slightly smaller for better fit */
          color: #ddd;
          opacity: 0;
          transition: opacity 0.3s ease 0.1s;
          max-height: 0;
          overflow: hidden;
          line-height: 1.4;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }

        .highlight-card:hover .highlight-desc {
          opacity: 1;
          max-height: 200px; /* Allow more text */
        }

        /* Reusing Project Gallery Styles (Insta-style) */
        /* Note: .insta-explore-wrapper styles are likely in CSS file, but we ensure grid here */
        .insta-explore-grid {
             /* Inherits from existing CSS or defaults */
        }
      `;
    document.head.appendChild(style);
  }

  /**
   * Fetches JSON data from a given URL.
   */
  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Could not fetch data from ${url}:`, error);
      return [];
    }
  }

  /**
   * Renders the Highlights Gallery.
   */
  async function renderHighlights() {
    const data = await fetchData("./assets/data/highlights.json");
    const wrapper = document.querySelector(".explore-gallery-wrapper");
    if (!wrapper || data.length === 0) return;

    const grid = document.createElement("div");
    grid.className = "highlight-grid";
    wrapper.appendChild(grid);

    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "highlight-card";

      card.innerHTML = `
        <img src="${item.img}?auto=format&fit=crop&w=600&q=80" alt="${item.title}" loading="lazy" />
        <div class="highlight-overlay">
            <div class="highlight-title">${item.title}</div>
            <div class="highlight-desc">${item.description || ""}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * Renders the Projects Gallery (formerly Side-Projects).
   * Now fetches from Index -> Individual Files for modularity.
   */
  async function renderProjects() {
    // 1. Fetch the Index
    const projectIndex = await fetchData("./assets/data/projects-index.json");
    const wrapper = document.querySelector(".insta-explore-wrapper");
    if (!wrapper || projectIndex.length === 0) return;

    const grid = document.createElement("div");
    grid.className = "insta-explore-grid";
    wrapper.appendChild(grid);

    // 2. Fetch each project data
    // We use Promise.all to fetch them in parallel for speed
    const projectPromises = projectIndex.map(id => fetchData(`./assets/data/projects/${id}.json`));
    const projects = await Promise.all(projectPromises);

    projects.forEach((project) => {
      if (!project || !project.title) return; // Skip failed loads

      const card = document.createElement("div");
      card.className = "insta-card";
      const randomHeight = Math.floor(Math.random() * (300 - 180) + 180);

      card.innerHTML = `
        <img src="${project.img}" alt="${project.title}" style="height:${randomHeight}px;" loading="lazy" />
        <div class="insta-title">${project.title}</div>
      `;

      // 3. Link to generic project page with ID param
      card.onclick = () => {
        // Open in new tab or same tab? User said "makes a new page". 
        // Typically same tab is better for SPA feel, but new tab is safer for "preview".
        // Let's go same tab for "integration".
        window.location.href = `project.html?id=${project.id}`;
      };

      grid.appendChild(card);
    });
  }

  // Initialize
  injectStyles();
  // We run these in parallel
  Promise.all([renderHighlights(), renderProjects()]);

})();
