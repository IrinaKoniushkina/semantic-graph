const width = window.innerWidth;
const height = window.innerHeight;
const margin = 40;

const svg = d3.select("#graph")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const graphGroup = svg.append("g");
const linkGroup = graphGroup.append("g");
const nodeGroup = graphGroup.append("g");

const infoPanel = d3.select("#info");

const centerX = width / 2;
const centerY = height / 2;
const circleRadius = Math.min(width, height) * 0.35;

const categoryBackgrounds = {
  all: "url('images/графBG.png')",
  культура: "url('images/cultureBG.png')",
  молодежь: "url('images/youthBG.png')",
  туризм: "url('images/tourismBg.png')"
};

const bg1 = document.getElementById("bg1");
const bg2 = document.getElementById("bg2");

let activeBg = bg1;
let hiddenBg = bg2;

// ЗАГРУЗКА
fetch("http://localhost:5000/places")
  .then(res => res.json())
  .then(data => initGraph(data));

// ГРАФ
function initGraph(data) {

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.edges).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("collision", d3.forceCollide().radius(d => d.collisionRadius).strength(0.7))
    .force("radial", d3.forceRadial(circleRadius, centerX, centerY).strength(0.05))
    .force("center", d3.forceCenter(centerX, centerY))
    .force("alignY", d3.forceY(centerY).strength(0.03));

  simulation.alphaTarget(0.1).restart();

  // РЁБРА
  const edges = linkGroup
    .selectAll("line")
    .data(data.edges)
    .enter()
    .append("line")
    .attr("stroke", "#cccccc");

  // ВЕРШИНЫ
  const nodes = nodeGroup
    .selectAll("image")
    .data(data.nodes)
    .enter()
    .append("image")
    .attr("xlink:href", d => d.icon || "icons/default.png")
    .attr("width", 25)
    .attr("height", 25)
    .attr("x", -16)
    .attr("y", -16)
    .call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    )
    .on("click", nodeClicked);

  // ПОДПИСИ
  const labels = nodeGroup
    .selectAll("text")
    .data(data.nodes)
    .enter()
    .append("text")
    .text(d => d.name)
    .attr("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "-2.5em")
    .attr("pointer-events", "none");

  // ПОИСК
  const searchInput = d3.select("#search");
  const clearBtn = d3.select("#clear-search");

  searchInput.on("input", function () {
    clearBtn.style("display", this.value ? "block" : "none");
    updateFilters();
  });

  clearBtn.on("click", function () {
    searchInput.property("value", "");
    clearBtn.style("display", "none");
    updateFilters();
  });

  // DROPDOWN ФИЛЬТР
  const filterToggle = document.getElementById("filter-toggle");
  const filterMenu = document.getElementById("filter-menu");
  const filterCheckboxes = filterMenu.querySelectorAll("input");

  let selectedCategories = new Set(["all"]);
  let lastSelectedCategory = "all";

  filterToggle.onclick = () => {
    filterMenu.style.display =
      filterMenu.style.display === "block" ? "none" : "block";
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-dropdown")) {
      filterMenu.style.display = "none";
    }
  });

  filterCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {

      const value = cb.value;

      if (value === "all") {
        selectedCategories = new Set(["all"]);
        lastSelectedCategory = "all"
        filterCheckboxes.forEach(c => {
          c.checked = c.value === "all";
        });
      } else {

        selectedCategories.delete("all");
        filterCheckboxes[0].checked = false;

        if (cb.checked) {
          selectedCategories.add(value);
        } else {
          selectedCategories.delete(value);
        }

        const realCategories = ["культура", "молодежь", "туризм"];
        const allSelected = realCategories.every(cat =>
          selectedCategories.has(cat)
        );
        if (allSelected) {
          selectedCategories = new Set(["all"]);
          filterCheckboxes.forEach(c => {
            c.checked = c.value === "all";
          });
        }
        if (selectedCategories.size === 0) {
          selectedCategories = new Set(["all"]);
          filterCheckboxes[0].checked = true;
        }
      }

      if (cb.checked && cb.value !== "all") {
        lastSelectedCategory = cb.value;
      }
      if (!cb.checked && cb.value === lastSelectedCategory) {
        const remaining = Array.from(selectedCategories);
        lastSelectedCategory = remaining.length ? remaining[remaining.length - 1] : "all";
      }

      updateFilterLabel();
      updateFilters();
      updateBackground();
      filterMenu.style.display = "none";
    });
    filterToggle.addEventListener("click", () => {
      const isOpen = filterMenu.style.display === "block";
      filterMenu.style.display = isOpen ? "none" : "block";
      document.querySelector(".filter-dropdown")
        .classList.toggle("open", !isOpen);
    });
  });

  function updateFilterLabel() {
    if (selectedCategories.has("all")) {
      filterToggle.textContent = "Все";
      return;
    }
    const map = {
      культура: "Культура",
      молодежь: "Молодежь",
      туризм: "Туризм"
    };
    const names = Array.from(selectedCategories).map(c => map[c]);
    filterToggle.textContent = names.join(", ");
  }

  function updateBackground() {
    let bg = categoryBackgrounds["all"];
    if (!selectedCategories.has("all")) {
      bg = categoryBackgrounds[lastSelectedCategory] || bg;
    }
    hiddenBg.style.backgroundImage = bg;
    hiddenBg.classList.add("active");
    activeBg.classList.remove("active");
    [activeBg, hiddenBg] = [hiddenBg, activeBg];
  }

  // ФИЛЬТРАЦИЯ
  function isNodeActive(node, query) {

    const matchCategory = selectedCategories.has("all") ||
      node.category.some(cat => selectedCategories.has(cat));
    const matchText = node.name.toLowerCase().includes(query);
    return matchCategory && matchText;
  }

  function updateFilters() {
    const query = searchInput.property("value").toLowerCase();
    nodes.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);

    labels.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);

    edges.style("opacity", d => {
      const s = isNodeActive(d.source, query);
      const t = isNodeActive(d.target, query);
      return s && t ? 1 : 0.05;
    });
  }

  // ТИК
  simulation.on("tick", () => {

    edges
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodes
      .attr("x", d => d.x - 16)
      .attr("y", d => d.y - 16);

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  // КЛИК ПО ВЕРШИНЕ
  function nodeClicked(event, node) {

    event.stopPropagation();

    infoPanel
      .style("display", "block")
      .style("opacity", 0)
      .html(`
        <div class="info-header">
          <h2>${node.name}</h2>
        </div>

        <div class="tabs">
          <button class="tab active" data-tab="gallery">Галерея</button>
          <button class="tab" data-tab="description">Описание</button>
          <button class="tab" data-tab="related">Связанные места</button>
        </div>

        <div class="tab-content">

          <div class="tab-pane active" id="gallery">
            ${renderGallery(node.images)}
          </div>

          <div class="tab-pane" id="description">
            ${formatDescription(node.description)}
          </div>

          <div class="tab-pane" id="related">
            ${renderRelated(node)}
          </div>

        </div>
      `);
    setTimeout(() => infoPanel.style("opacity", 1), 10);
    shiftGraph(true);
    initTabs();
    document.querySelectorAll(".related-item").forEach(item => {
      item.onclick = (e) => {

        const id = item.dataset.id;

        const targetNode = data.nodes.find(n => n.id == id);

        if (targetNode) {
          nodeClicked(e, targetNode);
        }
      };
    });
  }

  // КЛИК ПО ФОНУ
  svg.on("click", () => {
    infoPanel
      .transition()
      .duration(300)
      .style("opacity", 0)
      .on("end", () => infoPanel.style("display", "none"));

    shiftGraph(false);

  });

  // ГАЛЕРЕЯ
  function renderGallery(images) {

    if (!images || images.length === 0) {
      return "<p>Нет изображений</p>";
    }

    return `
      <div class="image-gallery">
        ${images.map(src => `
          <img src="${src}" class="gallery-img">
        `).join("")}
      </div>
    `;
  }

  // ОПИСАНИЕ
  function formatDescription(text) {

    if (!text) return "";

    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return safe
      .split("\n\n")
      .map(p => `<p>${p}</p>`)
      .join("");
  }

  // СВЯЗАННЫЕ ВЕРШИНЫ
  function renderRelated(node) {

    const related = data.edges
      .filter(e => e.source.id === node.id || e.target.id === node.id)
      .map(e => e.source.id === node.id ? e.target : e.source);

    if (!related.length) return "<p>Нет связанных мест</p>";

    return `
      <ul class="related-list">
        ${related.map(r => `
          <li class="related-item" data-id="${r.id}">
            ${r.name}
          </li>
        `).join("")}
      </ul>
    `;
  }

  // ТАБЫ
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panes = document.querySelectorAll(".tab-pane");
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove("active"));
        panes.forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        const id = tab.dataset.tab;
        document.getElementById(id).classList.add("active");
      };
    });
  }

  function isConnected(a, b) {
    return data.edges.some(l =>
      (l.source === a && l.target === b) ||
      (l.source === b && l.target === a)
    );
  }

  // СМЕЩЕНИЕ ГРАФА
  let graphOffsetX = 0;

  function shiftGraph(open) {

    graphOffsetX = open ? -260 : 0;

    graphGroup
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("transform", `translate(${graphOffsetX},0)`);
  }

  // DRAG
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = Math.max(margin - graphOffsetX, Math.min(width - margin - graphOffsetX, d.x));
    d.fy = Math.max(margin, Math.min(height - margin, d.y));
  }
  function dragged(event, d) {
    const left = margin - graphOffsetX;
    const right = width - margin - graphOffsetX;
    d.fx = Math.max(left, Math.min(right, event.x));
    d.fy = Math.max(margin, Math.min(height - margin, event.y));
  }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;

  }
  updateBackground();
  bg1.style.backgroundImage = categoryBackgrounds["all"];
  bg1.classList.add("active");
}

// RESIZE
window.addEventListener("resize", () => {
  svg
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight);
});