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
const CATEGORY_COLORS = {
  молодежь: "#A32406",
  культура: "#521C00",
  туризм: "#496771",
  all: "linear-gradient(to right, #521C00, #A32406, #678690)"
};

const ICONS = {
  museum: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width = "35" height = "35"  viewBox="0 0 50 50"><path d="M9.27 19h3.916l.602 18H8.749zM6 38h38v2h3v3h2v2H1v-2h2v-3h3zm40-24.188L25.002 5L4 13.812V15h42zM8 16h34v2H8zm28.736 3h3.914l.607 18h-5.046zm-9.152 0h3.914l.6 18h-5.041zm-9.154 0h3.915l.596 18h-5.039z"/></svg>`,
  church: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 24 24"><path d="M10 22v-4a2 2 0 0 1 4 0v4h4V12a1 1 0 0 0-.485-.857L13 8.434V6h2V4h-2V2h-2v2H9v2h2v2.434l-4.515 2.709A1 1 0 0 0 6 12v10h4zm-7 0h2v-8.118l-2.447 1.224A.998.998 0 0 0 2 16v5a1 1 0 0 0 1 1zm18.447-6.895L19 13.882V22h2a1 1 0 0 0 1-1v-5c0-.379-.214-.725-.553-.895z"/></svg>`,
  monument: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 24 24"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path d="M16 5.236V17h1.75c.69 0 1.25.56 1.25 1.25V20h1a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2h1v-1.75c0-.69.56-1.25 1.25-1.25H8V5.236L7.112 3.46a1.01 1.01 0 0 1 .778-1.454l3.955-.494a1.3 1.3 0 0 1 .31 0l3.955.494c.692.086 1.09.83.778 1.454z"/></g></svg>`,
  park: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 12 12"><path d="M11 3.75A1.75 1.75 0 0 0 9.25 2a1.73 1.73 0 0 0-.8.2A1.24 1.24 0 0 0 7.21 1a1.19 1.19 0 0 0-.21.05A1.23 1.23 0 0 0 5.75 0a1.25 1.25 0 0 0-1.13.73A1.21 1.21 0 0 0 4 .52a1.23 1.23 0 0 0-1 .55A1.491 1.491 0 0 0 2.51 1a1.51 1.51 0 0 0-1.4 2.08A1.49 1.49 0 0 0 1.08 6a1.49 1.49 0 0 0 2.55.52h.12c.321 0 .63-.126.86-.35V10L3 11h5l-1.6-1V9a8.42 8.42 0 0 1 2.38-2c.26-.05.5-.167.7-.34A1.49 1.49 0 0 0 10 5.5a1.46 1.46 0 0 0 0-.17c.61-.29 1-.904 1-1.58zm-4.64 4.5V6h.18a1.52 1.52 0 0 0 .53-.1a1.5 1.5 0 0 0 .89 1a8.821 8.821 0 0 0-1.6 1.35z"/></svg>`,
  building: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M15 11V5.83c0-.53-.21-1.04-.59-1.41L12.7 2.71a.996.996 0 0 0-1.41 0l-1.7 1.7C9.21 4.79 9 5.3 9 5.83V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z"/></svg>`,
  user: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 22 22"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>`
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
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "graph-tooltip")
    .style("opacity", 0);

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.edges).id(d => d.id).distance(170))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("collision", d3.forceCollide().radius(d => d.collisionRadius + 30).strength(0.7))
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
    .attr("stroke", "#a2a2a2");

  // ВЕРШИНЫ
  const nodes = nodeGroup
    .selectAll("g")
    .data(data.nodes)
    .enter()
    .append("g")
    .call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    )
    .on("click", nodeClicked)
    .on("mouseenter", (event, d) => {

      const query = searchInput.property("value").toLowerCase();

      if (isMatchedByKeyword(d, query)) {
        tooltip
          .style("opacity", 1)
          .text("Найдено по ключевым словам");
      }

    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
    });

  nodes.each(function (d) {
    const icon = ICONS[d.icon] || ICONS["museum"];
    const node = d3.select(this);
    node.html(icon);

    const fill = getNodeFill(d, svg);
    node.selectAll("path").attr("fill", fill);
  });

  simulation.on("tick", () => {
    nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
  });

  function getNodeFill(d, svg) {
    if (!d.category || d.category.length === 0) return "#ccc";

    if (d.category.length === 1) {
      return CATEGORY_COLORS[d.category[0]];
    }

    // Обработаем все комбинации двух и трёх категорий
    let colors = [];

    const cats = new Set(d.category);

    if (cats.has("культура") && cats.has("молодежь") && cats.has("туризм")) {
      colors = ["#521C00", "#A32406", "#496771"];
    } else if (cats.has("молодежь") && cats.has("культура")) {
      colors = ["#521C00", "#A32406"];
    } else if (cats.has("молодежь") && cats.has("туризм")) {
      colors = ["#A32406", "#496771"];
    } else if (cats.has("культура") && cats.has("туризм")) {
      colors = ["#521C00", "#496771"];
    } else {
      // если вдруг другая комбинация
      colors = Array.from(cats).map(c => CATEGORY_COLORS[c]);
    }

    const gradId = `grad-${d.id}`;
    let grad = svg.select(`#${gradId}`);
    if (grad.empty()) {
      grad = svg.append("defs")
        .append("linearGradient")
        .attr("id", gradId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
    }

    grad.selectAll("stop").remove(); // очистим предыдущие стопы
    colors.forEach((color, i) => {
      grad.append("stop")
        .attr("offset", `${(i / (colors.length - 1)) * 100}%`)
        .attr("stop-color", color)
        .attr("stop-opacity", 1);
    });

    return `url(#${gradId})`;
  }

  // ПОДПИСИ
  const labels = nodeGroup
    .selectAll("text")
    .data(data.nodes)
    .enter()
    .append("text")
    .text(d => d.name)
    .attr("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "-2.3em")
    .attr("width", "30px")
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

  let activeNode = null;
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
    const container = filterToggle;

    if (selectedCategories.has("all")) {
      container.innerHTML = `Все <span class="category-circle" style="background: ${CATEGORY_COLORS.all};"></span>`;
      return;
    }

    const map = {
      культура: "Культура",
      молодежь: "Молодежь",
      туризм: "Туризм"
    };

    const names = Array.from(selectedCategories).map(cat => {
      return ` ${map[cat]}
      <span class="category-circle" style="background: ${CATEGORY_COLORS[cat]};"></span> 
    `;
    });

    container.innerHTML = names.join("");
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

    const keywords = Array.isArray(node.keywords)
      ? node.keywords.join(" ").toLowerCase()
      : (node.keywords || "").toLowerCase();

    const matchText =
      node.name.toLowerCase().includes(query) ||
      keywords.includes(query);

    const matchCategory =
      selectedCategories.has("all") ||
      node.category.some(cat => selectedCategories.has(cat));

    function isMatchedByKeyword(node, query) {
      if (!query) return false;

      const nameMatch = node.name.toLowerCase().includes(query);
      const keywordMatch = (node.keywords || "").toLowerCase().includes(query);

      return keywordMatch && !nameMatch;
    }

    return matchCategory && matchText;
  }
  function isMatchedByKeyword(node, query) {
    if (!query) return false;

    const nameMatch = node.name.toLowerCase().includes(query);
    const keywordMatch = (node.keywords || "").toLowerCase().includes(query);

    return keywordMatch && !nameMatch;
  }

  function updateFilters() {

    const query = searchInput.property("value").toLowerCase();

    if (activeNode) {
      highlightConnections(activeNode);
      return;
    }

    nodes.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);

    labels.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);

    edges.style("opacity", d => {
      const s = isNodeActive(d.source, query);
      const t = isNodeActive(d.target, query);
      return s && t ? 1 : 0.05;
    });

    nodes
      .style("opacity", d => isNodeActive(d, query) ? 1 : 0.1)
      .attr("width", 25)
      .attr("height", 25)
      .attr("x", d => d.x - 16)
      .attr("y", d => d.y - 16);

    labels
      .style("opacity", d => isNodeActive(d, query) ? 1 : 0.1)
      .attr("font-size", "11px")
      .attr("dy", "-2.5em");
  }


  // ТИК
  simulation.on("tick", () => {

    edges
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    updateNodeTransform();

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  // КЛИК ПО ВЕРШИНЕ
  function nodeClicked(event, node) {
    activeNode = node;
    updateNodeTransform();
    highlightConnections(node);
    event.stopPropagation();

    infoPanel
      .style("display", "block")
      .style("opacity", 0)
      .html(`
        <div class="info-header">
          <h2>${node.name}</h2>
          <div class="categories">
              ${renderCategories(node.category)}
          </div>
        </div>

        <div class="tabs">
          <button class="tab active" data-tab="description">Описание</button>
          <button class="tab" data-tab="history">История</button>
          <button class="tab" data-tab="modern">Наши дни</button>
          <button class="tab" data-tab="related">Связанные места</button>
        </div>

        <div class="tab-content">
          <div class="tab-pane active" id="description">
            ${renderDescriptionTab(node)}
          </div>
          <div class="tab-pane" id="history">
            ${formatDescription(node.content?.history)}
          </div>
          <div class="tab-pane" id="modern">
            ${formatDescription(node.content?.modern)}
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
        e.stopPropagation();

        const id = item.dataset.id;
        const targetNode = data.nodes.find(n => n.id == id);

        if (targetNode) {
          nodeClicked(e, targetNode);
        }
      };
    });
  }

  function renderCategories(categories) {
    if (!categories || categories.length === 0) return "";
    return categories.map(cat => `
        <span style="
            background-color: ${CATEGORY_COLORS[cat] || "#ccc"}; 
        ">${cat}</span>
    `).join("");
  }

  function renderDescriptionTab(node) {
    const desc = node.content?.description;

    if (!desc) return "<p>Нет данных</p>";

    return `
    ${formatDescription(desc.text)}
    ${renderTimeline(desc.images)}
  `;
  }

  function renderTimeline(images) {
    if (!images || images.length === 0) {
      return "<p>Нет изображений</p>";
    }

    return `
    <div class="timeline">
      ${images.map(item => `
        <div class="timeline-item">
          
          <div class="timeline-image">
            <img src="${item.src}" alt="">
          </div>

          <div class="timeline-year">
            ${item.caption || ""}
          </div>

        </div>
      `).join("")}
    </div>
  `;
  }

  function highlightConnections(selectedNode) {

    nodes.style("opacity", d => {
      if (d.id === selectedNode.id) return 1;

      const connected = data.edges.some(e =>
        (e.source.id === selectedNode.id && e.target.id === d.id) ||
        (e.target.id === selectedNode.id && e.source.id === d.id)
      );

      return connected ? 1 : 0.1;
    });

    labels
      .style("opacity", d => {
        if (d.id === selectedNode.id) return 1;
        const connected = data.edges.some(e =>
          (e.source.id === selectedNode.id && e.target.id === d.id) ||
          (e.target.id === selectedNode.id && e.source.id === d.id)
        );
        return connected ? 1 : 0.1;
      })
      .attr("font-size", d => d.id === selectedNode.id ? "16px" : "11px")
      .attr("dy", d => d.id === selectedNode.id ? "-3em" : "-2.5em");

    edges.style("opacity", e => {
      return (e.source.id === selectedNode.id || e.target.id === selectedNode.id)
        ? 1
        : 0.05;
    });
  }

  function updateNodeTransform() {
    nodes.attr("transform", d => {
      const activeScale = (activeNode && d.id === activeNode.id) ? 2 : 1; // увеличение активной вершины
      return `
      translate(${d.x}, ${d.y})
      scale(${activeScale})
      translate(-15, -15)
    `;
    });
    nodes.each(function (d) {
      d3.select(this).selectAll("path")
        .attr("fill", getNodeFill(d, svg));
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

    activeNode = null;
    updateFilters();
    updateNodeTransform();
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
    return text;
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
      (l.source.id === a.id && l.target.id === b.id) ||
      (l.source.id === b.id && l.target.id === a.id)
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
