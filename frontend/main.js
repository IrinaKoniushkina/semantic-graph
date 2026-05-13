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
    monument: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 24 24"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path d="M16 5.236V17h1.75c.69 0 1.25.56 1.25 1.25V20h1a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2h1v-1.75c0-.69.56-1.25 1.25-1.25H8V5.236L7.112 3.46a1.01 1.01 0 0 1 .778-1.454l3.955-.494a1.3 1.3 0 0 1 .31 0l3.955.494c.692.086 1.09.83.778 1.454z"/></svg>`,
    park: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 12 12"><path d="M11 3.75A1.75 1.75 0 0 0 9.25 2a1.73 1.73 0 0 0-.8.2A1.24 1.24 0 0 0 7.21 1a1.19 1.19 0 0 0-.21.05A1.23 1.23 0 0 0 5.75 0a1.25 1.25 0 0 0-1.13.73A1.21 1.21 0 0 0 4 .52a1.23 1.23 0 0 0-1 .55A1.491 1.491 0 0 0 2.51 1a1.51 1.51 0 0 0-1.4 2.08A1.49 1.49 0 0 0 1.08 6a1.49 1.49 0 0 0 2.55.52h.12c.321 0 .63-.126.86-.35V10L3 11h5l-1.6-1V9a8.42 8.42 0 0 1 2.38-2c.26-.05.5-.167.7-.34A1.49 1.49 0 0 0 10 5.5a1.46 1.46 0 0 0 0-.17c.61-.29 1-.904 1-1.58zm-4.64 4.5V6h.18a1.52 1.52 0 0 0 .53-.1a1.5 1.5 0 0 0 .89 1a8.821 8.821 0 0 0-1.6 1.35z"/></svg>`,
    building: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M15 11V5.83c0-.53-.21-1.04-.59-1.41L12.7 2.71a.996.996 0 0 0-1.41 0l-1.7 1.7C9.21 4.79 9 5.3 9 5.83V7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z"/></svg>`,
    user: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"  width = "35" height = "35" viewBox="0 0 22 22"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>`
};

const bg1 = document.getElementById("bg1");
const bg2 = document.getElementById("bg2");

let activeBg = bg1;
let hiddenBg = bg2;

let simulation;

// ЗАГРУЗКА
fetch("http://localhost:5000/places")
    .then(res => res.json())
    .then(data => {
        console.log("GRAPH DATA:", data);
        initGraph(data);
    });

function getBounds() {

    const controlsEl = document.querySelector("#controls");
    const infoEl = document.querySelector("#info");

    const controls = controlsEl?.getBoundingClientRect();
    const info = infoEl?.getBoundingClientRect();

    return {
        left: controls ? controls.right + 30 : 30,

        right:
            infoEl &&
                getComputedStyle(infoEl).display !== "none"
                ? (window.innerWidth - info.left + 30)
                : 30,

        top: 30,
        bottom: 30
    };
}

function getLayout() {

    const b = getBounds();

    const freeWidth =
        window.innerWidth - b.left - b.right;

    const freeHeight =
        window.innerHeight - b.top - b.bottom;

    return {
        bounds: b,

        centerX: b.left + freeWidth / 2,
        centerY: b.top + freeHeight / 2,

        radius:
            Math.min(freeWidth, freeHeight) * 0.38
    };
}

let currentLayout = getLayout();

// === ПЛАВНОЕ СМЕЩЕНИЕ ГРАФА ===
function updateSimulationLayout(smooth = true, delay = 0) {
    const target = getLayout();

    if (!smooth) {
        currentLayout = { ...target };
        simulation.force("center", d3.forceCenter(target.centerX, target.centerY));
        simulation.force("radial", d3.forceRadial(target.radius, target.centerX, target.centerY).strength(0.018));
        simulation.force("alignY", d3.forceY(target.centerY).strength(0.025));
        simulation.alphaTarget(0.015).restart();
        return;
    }

    setTimeout(() => {
        d3.timer((elapsed) => {
            const t = Math.min(1, elapsed / 1600);
            const k = 1 - Math.pow(1 - t, 5);

            currentLayout.centerX += (target.centerX - currentLayout.centerX) * k * 0.085;
            currentLayout.centerY += (target.centerY - currentLayout.centerY) * k * 0.085;
            currentLayout.radius += (target.radius - currentLayout.radius) * k * 0.085;

            simulation.force("center",
                d3.forceCenter(currentLayout.centerX, currentLayout.centerY)
            );

            simulation.force("radial",
                d3.forceRadial(currentLayout.radius, currentLayout.centerX, currentLayout.centerY)
                    .strength(0.018)
            );

            simulation.force("alignY",
                d3.forceY(currentLayout.centerY).strength(0.025)
            );

            simulation.alphaTarget(0.012).restart();

            return t >= 1;
        });
    }, delay);
}

let currentGallery = [];
let currentImageIndex = 0;

// ГРАФ
function initGraph(data) {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        console.error("Invalid graph data:", data);
        return;
    }
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "graph-tooltip")
        .style("opacity", 0);

    function uiCollisionForce() {
        return function () {
            const uiRects = [];
            const controls = document.querySelector("#controls")?.getBoundingClientRect();
            const info = document.querySelector("#info");

            if (controls) {
                uiRects.push({
                    left: controls.left,
                    right: controls.right,
                    top: controls.top,
                    bottom: controls.bottom
                });
            }

            if (info && info.style.display !== "none") {
                const rect = info.getBoundingClientRect();
                uiRects.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                });
            }

            data.nodes.forEach(d => {

                const labelHeight = 40;
                const nodeRadius = 25;

                const x = d.x;
                const y = d.y;

                // учитываем подпись
                const nodeLeft = x - nodeRadius;
                const nodeRight = x + nodeRadius;
                const nodeTop = y - nodeRadius - labelHeight;
                const nodeBottom = y + nodeRadius;

                uiRects.forEach(rect => {

                    const padding = 20;
                    const left = rect.left - padding;
                    const right = rect.right + padding;
                    const top = rect.top - padding;
                    const bottom = rect.bottom + padding;
                    const overlap =
                        nodeRight > left &&
                        nodeLeft < right &&
                        nodeBottom > top &&
                        nodeTop < bottom;

                    if (overlap) {
                        const pushX = Math.min(
                            Math.abs(nodeRight - left),
                            Math.abs(right - nodeLeft)
                        );
                        const pushY = Math.min(
                            Math.abs(nodeBottom - top),
                            Math.abs(bottom - nodeTop)
                        );
                        if (pushX < pushY) {
                            d.vx += x < (left + right) / 2
                                ? -0.15
                                : 0.15;
                        } else {
                            d.vy += y < (top + bottom) / 2
                                ? -0.15
                                : 0.15;
                        }
                    }
                });
            });
        };
    }

    simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collision", d3.forceCollide().radius(d => {
            const textSize = (d.name?.length || 10) * 3.5;
            return Math.max(35, textSize);
        }).strength(0.9))
        .force("ui", uiCollisionForce());

    updateSimulationLayout();

    simulation.alphaTarget(0.1).restart();

    // РЁБРА
    const edges = linkGroup
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .attr("stroke", d => {
            if (d.types && d.types.length === 2) {
                return "url(#edge-gradient)";        // градиент
            }
            return d.relations?.some(r => r.type === "history") || d.type === "history"
                ? "#BC461B"
                : "#1C9284";
        })
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.85);
    // Градиент для двойных связей
    const defs = svg.append("defs");

    defs.append("linearGradient")
        .attr("id", "edge-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .selectAll("stop")
        .data([
            { offset: "0%", color: "#1C9284" },
            { offset: "100%", color: "#BC461B" }
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

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

    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxCredits = document.getElementById("lightbox-credits");

    function openLightbox(images, index) {
        currentGallery = images;
        currentImageIndex = index;
        renderLightbox();
        lightbox.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.add("hidden");
        document.body.style.overflow = "";
    }

    function renderLightbox() {
        const item = currentGallery[currentImageIndex];
        lightboxImage.src = item.src;
        lightboxCaption.innerHTML = item.caption || "";
        const credits = item.credits;
        if (credits) {
            lightboxCredits.innerHTML = `
            ${credits.author ? `<div><b>Автор:</b> ${credits.author}</div>` : ""}
            ${credits.source ? `
                <div>
                    <b>Источник:</b> 
                    <a href="${credits.source}" target="_blank">
                        ${credits.source}
                    </a>
                </div>` : ""}
            ${credits.license ? `<div><b>Лицензия:</b> ${credits.license}</div>` : ""}`;
        } else {
            lightboxCredits.innerHTML = "";
        }
    }
    function nextImage() {
        currentImageIndex =
            (currentImageIndex + 1) % currentGallery.length;
        renderLightbox();
    }
    function prevImage() {
        currentImageIndex =
            (currentImageIndex - 1 + currentGallery.length)
            % currentGallery.length;
        renderLightbox();
    }

    document.querySelector(".lightbox-close").onclick = closeLightbox;

    document.querySelector(".lightbox-backdrop").onclick = closeLightbox;

    document.querySelector(".lightbox-nav.next").onclick = nextImage;

    document.querySelector(".lightbox-nav.prev").onclick = prevImage;

    document.addEventListener("keydown", (e) => {
        if (lightbox.classList.contains("hidden")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
    });

    // ТИК
    simulation.on("tick", () => {
        const b = getBounds();
        const left = b.left;
        const right = window.innerWidth - b.right;
        const top = b.top;
        const bottom = window.innerHeight - b.bottom;

        data.nodes.forEach(d => {
            const textHalf = Math.max(
                40,
                (d.name?.length || 10) * 3
            );
            d.x = Math.max(
                left + textHalf,
                Math.min(right - textHalf, d.x)
            );
            d.y = Math.max(
                top + 40,
                Math.min(bottom - 20, d.y)
            );
        });

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
        // Плавное появление панели + задержка движения графа
        setTimeout(() => {
            infoPanel.transition()
                .duration(400)
                .style("opacity", 1);
            updateSimulationLayout(true, 80);
        }, 50);
        initTabs();

        // timeline click
        document.querySelectorAll(".timeline-preview")
            .forEach(img => {
                img.onclick = (e) => {
                    e.stopPropagation();
                    const index = +img.dataset.index;
                    openLightbox(
                        node.content?.description?.images || [],
                        index
                    );
                };
            });

        // переход по связанному объекту
        document.querySelectorAll(".related-open-node").forEach(item => {

            item.onclick = (e) => {
                if (e.target.closest(".accordion-toggle")) return;
                const id = item.dataset.id;
                const targetNode = data.nodes.find(n => n.id == id);
                if (targetNode) {
                    nodeClicked(e, targetNode);
                }
            };
        });

        // аккордеон причины связи
        document.querySelectorAll(".accordion-toggle").forEach(btn => {

            btn.onclick = (e) => {

                e.stopPropagation();

                const item = btn.closest(".related-item");
                const currentAccordion = item.querySelector(".related-accordion");
                const isOpen = currentAccordion.classList.contains("open");

                // закрываем все
                document.querySelectorAll(".related-accordion")
                    .forEach(acc => {
                        acc.classList.remove("open");
                    });

                // если текущий был закрыт → открыть
                if (!isOpen) {
                    currentAccordion.classList.add("open");
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
        const mapHtml = node.geo
            ?.replace('width="560"', 'width="600"')
            ?.replace('height="400"', 'height="250"');

        return `
    ${formatDescription(desc.text)}
    ${renderTimeline(desc.images)}
    ${node.geo
                ? `<div class="node-map"><label><b>${node.name} на Яндекс.Картах</b></label>${node.geo}</div>`
                : ""
            }
  `;
    }


    function renderTimeline(images) {
        if (!images || images.length === 0) {
            return "<p>Нет изображений</p>";
        }
        return `
        <div class="timeline">
        ${images.map((item, index) => `
            <div class="timeline-item">

            <div class="timeline-image">
                <img 
                src="${item.src}" 
                alt=""
                class="timeline-preview"
                data-index="${index}"
                >
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

    function relaxGraph() {
        updateSimulationLayout(true, 50);
        simulation.alphaTarget(0.018).restart();
    }

    function updateNodeTransform() {
        nodes.attr("transform", d => {
            const isActive = activeNode && d.id === activeNode.id;
            const scale = isActive ? 1.65 : 1;

            return `
      translate(${d.x}, ${d.y})
      scale(${scale})
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
        if (!activeNode) return;

        // Плавное скрытие панели
        infoPanel.transition()
            .duration(350)
            .style("opacity", 0)
            .on("end", () => {
                infoPanel.style("display", "none");
            });

        activeNode = null;
        updateNodeTransform();
        updateFilters();

        // Плавное "расползание" вершин после закрытия панели
        setTimeout(() => {
            updateSimulationLayout(true, 70);   // небольшая задержка
            simulation.alphaTarget(0.05).restart(); // чуть сильнее, чтобы заметно разъехались
        }, 180);
    });

    // ОПИСАНИЕ
    function formatDescription(text) {
        if (!text) return "";
        return `<p class="info-text">${text}</p>`;
    }

    // СВЯЗАННЫЕ ВЕРШИНЫ
    function renderRelated(node) {

        const related = data.edges
            .filter(e => e.source.id === node.id || e.target.id === node.id)
            .map(e => ({
                node: e.source.id === node.id ? e.target : e.source,
                geoRelations: e.relations.filter(r => r.type === "geo"),
                historyRelations: e.relations.filter(r => r.type === "history")
            }));

        if (!related.length) {
            return "<p>Нет связанных мест</p>";
        }

        const geo = related.filter(r => r.geoRelations.length);
        const history = related.filter(r => r.historyRelations.length);

        function renderGroup(title, items, type) {

            return `
    <div class="related-group ${type}">

      <div class="related-group-header ${type}">
        <span>${title}</span>
      </div>

      <div class="related-group-content">

        ${items.length ? items.map(r => {
                const reasons = type === "history"
                    ? [...new Set(r.historyRelations
                        .map(rel => rel.reason?.trim())
                        .filter(Boolean)
                    )]
                    : [];
                return `
              <div class="related-item related-open-node ${type}" data-id="${r.node.id}">
              <div class="related-item-main">
                <div class="related-item-title">
                  ${r.node.name}
                </div>
                ${type === "history" && reasons.length
                        ? `
                    <div class="related-info-icon accordion-toggle">
                      ?
                    </div>
                  `
                        : ""
                    }
              </div>
              ${type === "history" && reasons.length ? `
                  <div class="related-accordion">
                    ${reasons.map(reason => `
                      <div class="related-accordion-text">
                        ${reason}
                      </div>`).join("")}
                  </div>`: ""
                    }
          </div>`;
            }).join("") : `<div class="related-empty">Нет связей</div>`
                }
      </div>
    </div>`;
        }

        return `
    <div class="related-wrapper">
    ${renderGroup(
            "Географические связи",
            geo,
            "geo"
        )}
    ${renderGroup(
            "Историко-культурные связи",
            history,
            "history"
        )}

    </div>`;
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

    // СМЕЩЕНИЕ ГРАФА

    // DRAG
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = Math.max(margin, Math.min(window.innerWidth - margin, d.x));
        d.fy = Math.max(margin, Math.min(height - margin, d.y));
    }
    function dragged(event, d) {
        const left = margin;
        const right = window.innerWidth - margin;
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

    updateSimulationLayout();
});