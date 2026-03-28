// -----------------------------
// НАСТРОЙКИ
// -----------------------------
const width = window.innerWidth;
const height = window.innerHeight;
const margin = 40;

const categoryColors = {
  "архитектура": "#00c3ff",
  "транспорт": "#9124eb",
  "здоровье": "#f07f23",
  "туризм": "#e9ec25",
  "культура": "#f53fb8",
  "экология": "#1dc942",
  "экономика": "#e9323b",
  "образование": "#4476ff",
};

// -----------------------------
// SVG
// -----------------------------
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


// -----------------------------
// ЗАГРУЗКА ДАННЫХ
// -----------------------------
fetch("http://localhost:5000/places")
  .then(res => res.json())
  .then(data => initGraph(data));


// -----------------------------
// ГРАФ
// -----------------------------
function initGraph(data) {

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.edges)
      .id(d => d.id)
      .distance(120)
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("collision", d3.forceCollide()
      .radius(d => d.collisionRadius)
      .strength(0.7)
    )
    .force("radial", d3.forceRadial(circleRadius, centerX, centerY)
      .strength(0.05)
    )
    .force("center", d3.forceCenter(centerX, centerY))
    .force("alignY", d3.forceY(centerY).strength(0.03));

  simulation.alphaTarget(0.1).restart();


  // -----------------------------
  // РЁБРА
  // -----------------------------
  const edges = linkGroup
    .selectAll("line")
    .data(data.edges)
    .enter()
    .append("line")
    .attr("stroke", "#cccccc");

  // -----------------------------
  // ВЕРШИНЫ
  // -----------------------------
  const nodes = nodeGroup
    .selectAll("circle")
    .data(data.nodes)
    .enter()
    .append("circle")
    .attr("r", 8)
    .attr("fill", d => {
  const mainCategory = d.category[0];
  return categoryColors[mainCategory] || "#999";
})
    .call(
      d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    )
    .on("click", nodeClicked);

  // -----------------------------
  // ПОДПИСИ
  // -----------------------------
  const labels = nodeGroup
    .selectAll("text")
    .data(data.nodes)
    .enter()
    .append("text")
    .text(d => d.name)
    .attr("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.9em")
    .attr("pointer-events", "none");

  //-------КАТЕГОРИИ И ПОИСК-------

  const categories = Array.from(
  new Set(
    data.nodes.flatMap(d => d.category)
  ));

  const filterContainer = d3.select("#category-filters");

  categories.forEach(cat => {
    const label = filterContainer.append("label");

    label.append("input")
      .attr("type", "checkbox")
      .attr("checked", true)
      .attr("value", cat)
      .on("change", updateFilters);

    label.append("span")
      .text(cat);
  });

  d3.select("#select-all").on("change", function () {
    const checked = this.checked;

    d3.selectAll(
      "#category-filters input[type='checkbox']:not(#select-all)"
    )
      .property("checked", checked);

    updateFilters();
  });

  d3.selectAll(
    "#category-filters input[type='checkbox']:not(#select-all)"
  )
    .on("change", function () {

      const all = d3.selectAll(
        "#category-filters input[type='checkbox']:not(#select-all)"
      ).nodes();

      const allChecked = all.every(cb => cb.checked);

      d3.select("#select-all")
        .property("checked", allChecked);

      updateFilters();
    });

  const searchInput = d3.select("#search");
  const clearBtn = d3.select("#clear-search");

  searchInput.on("input", function () {
    clearBtn.style(
      "display",
      this.value.length > 0 ? "block" : "none"
    );

    updateFilters();
  });

  clearBtn.on("click", function () {
    searchInput.property("value", "");
    clearBtn.style("display", "none");
    updateFilters();
  });

  function isNodeActive(node, activeCategories, query){
    const matchCategory = node.category.some(cat => activeCategories.has(cat));
    const matchText = node.name.toLowerCase().includes(query);
    return matchCategory && matchText;
  }

  function updateFilters() {
    const activeCategories = new Set(
      d3.selectAll("#category-filters input:checked")
        .nodes()
        .map(n => n.value)
    );

    const query = d3.select("#search")
      .property("value")
      .toLowerCase();

    nodes.style("opacity", d =>
      isNodeActive(d, activeCategories, query) ? 1 : 0.15
    );

    labels.style("opacity", d =>
      isNodeActive(d, activeCategories, query) ? 1 : 0.15
    );

    edges.style("opacity", d => {
      const sourceActive = isNodeActive(d.source, activeCategories, query);
      const targetActive = isNodeActive(d.target, activeCategories, query);

      return sourceActive && targetActive ? 1 : 0.05;
    });
  }


  // -----------------------------
  // ТИК
  // -----------------------------
  simulation.on("tick", () => {

    data.nodes.forEach(d => {
      d.x = Math.max(margin, Math.min(width - margin, d.x));
      d.y = Math.max(margin, Math.min(height - margin, d.y));
    });

    edges
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodes
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    labels
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });


  // -----------------------------
  // КЛИК ПО ФОНУ
  // -----------------------------
  svg.on("click", () => {

    nodes.attr("fill", d => {
  const mainCategory = d.category[0];
  return categoryColors[mainCategory] || "#999";
});
    edges.attr("stroke", "#cccccc");

    infoPanel
      .transition()
      .duration(300)
      .style("opacity", 0)
      .on("end", () => infoPanel.style("display", "none"));

    shiftGraph(false);
  });


  // -----------------------------
  // КЛИК ПО ВЕРШИНЕ
  // -----------------------------
  function nodeClicked(event, node) {

    event.stopPropagation();

    infoPanel
      .style("display", "block")
      .style("opacity", 0)
      .html(`
        <div class="info-header">
          <h2>${node.name}</h2>
          <div class="category">${node.category.join(", ")}</div>
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

    highlight(node);
  }


  // -----------------------------
  // ГАЛЕРЕЯ
  // -----------------------------
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


  // -----------------------------
  // ОПИСАНИЕ
  // -----------------------------
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


  // -----------------------------
  // СВЯЗАННЫЕ
  // -----------------------------
  function renderRelated(node) {

    const related = data.edges
      .filter(e => e.source.id === node.id || e.target.id === node.id)
      .map(e => e.source.id === node.id ? e.target : e.source);

    if (!related.length) return "<p>Нет связанных мест</p>";

    return `
      <ul class="related-list">
        ${related.map(r => `
          <li class="related-item">${r.name}</li>
        `).join("")}
      </ul>
    `;
  }


  // -----------------------------
  // ТАБЫ
  // -----------------------------
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


  // -----------------------------
  // ПОДСВЕТКА
  // -----------------------------
  function highlight(node) {

    nodes.attr("fill", d => {
  const mainCategory = d.category[0];

  return d === node || isConnected(node, d)
    ? categoryColors[mainCategory] || "#999"
    : "#eee";
});

    edges.attr("stroke", d =>
      d.source === node || d.target === node
        ? "#999"
        : "#eee"
    );

  }


  function isConnected(a, b) {

    return data.edges.some(l =>
      (l.source === a && l.target === b) ||
      (l.source === b && l.target === a)
    );

  }


  // -----------------------------
  // СМЕЩЕНИЕ ГРАФА
  // -----------------------------
  function shiftGraph(open) {

    const shift = open ? -260 : 0;

    graphGroup
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("transform", `translate(${shift},0)`);

  }


  // -----------------------------
  // DRAG
  // -----------------------------
  function dragStarted(event, d) {

    if (!event.active) simulation.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;

  }

  function dragged(event, d) {

    d.fx = event.x;
    d.fy = event.y;

  }

  function dragEnded(event, d) {

    if (!event.active) simulation.alphaTarget(0);

    d.fx = null;
    d.fy = null;

  }

}


// -----------------------------
// RESIZE
// -----------------------------
window.addEventListener("resize", () => {

  svg
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight);

});