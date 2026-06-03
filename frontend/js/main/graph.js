function getNodeFill(d, svg) {
    if (!d.category || d.category.length === 0) return "#ccc";
    if (d.category.length === 1) return CATEGORY_COLORS[d.category[0]];
    let colors = [];
    const cats = new Set(d.category);
    if (cats.has("культура") && cats.has("молодежь") && cats.has("туризм")) colors = ["#521C00", "#A32406", "#496771"];
    else if (cats.has("молодежь") && cats.has("культура")) colors = ["#521C00", "#A32406"];
    else if (cats.has("молодежь") && cats.has("туризм")) colors = ["#A32406", "#496771"];
    else if (cats.has("культура") && cats.has("туризм")) colors = ["#521C00", "#496771"];
    else colors = Array.from(cats).map(c => CATEGORY_COLORS[c]);
    const gradId = `grad-${d.id}`;
    let grad = svg.select(`#${gradId}`);
    if (grad.empty()) {
        grad = svg.append("defs").append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
    }
    grad.selectAll("stop").remove();
    colors.forEach((color, i) => {
        grad.append("stop").attr("offset", `${(i / (colors.length - 1)) * 100}%`).attr("stop-color", color).attr("stop-opacity", 1);
    });
    return `url(#${gradId})`;
}

function updateNodeTransform() {
    const nodes = nodeGroup.selectAll("g");
    nodes.attr("transform", d => {
        const isActive = activeNode && d.id === activeNode.id;
        const scale = isActive ? 1.65 : 1;
        return `translate(${d.x}, ${d.y}) scale(${scale}) translate(-15, -15)`;
    });
    nodes.each(function (d) {
        d3.select(this).selectAll("path").attr("fill", getNodeFill(d, svg));
    });
}

function highlightConnections(selectedNode, data) {
    const nodes = nodeGroup.selectAll("g");
    const labels = nodeGroup.selectAll("text");
    const edges = linkGroup.selectAll("line");
    nodes.style("opacity", d => {
        if (d.id === selectedNode.id) return 1;
        const connected = data.edges.some(e => (e.source.id === selectedNode.id && e.target.id === d.id) || (e.target.id === selectedNode.id && e.source.id === d.id));
        return connected ? 1 : 0.1;
    });
    labels.style("opacity", d => {
        if (d.id === selectedNode.id) return 1;
        const connected = data.edges.some(e => (e.source.id === selectedNode.id && e.target.id === d.id) || (e.target.id === selectedNode.id && e.source.id === d.id));
        return connected ? 1 : 0.1;
    }).attr("font-size", d => d.id === selectedNode.id ? "16px" : "11px")
        .attr("dy", d => d.id === selectedNode.id ? "-3em" : "-2.5em");
    edges.style("opacity", e => (e.source.id === selectedNode.id || e.target.id === selectedNode.id) ? 1 : 0.05);
}

function relaxGraph() {
    updateSimulationLayout(true, 50);
    simulation.alphaTarget(0.018).restart();
}

function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = Math.max(margin, Math.min(window.innerWidth - margin, d.x));
    d.fy = Math.max(margin, Math.min(window.innerHeight - margin, d.y));
}
function dragged(event, d) {
    const left = margin;
    const right = window.innerWidth - margin;
    d.fx = Math.max(left, Math.min(right, event.x));
    d.fy = Math.max(margin, Math.min(window.innerHeight - margin, event.y));
}
function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

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

function nodeClicked(event, node, data) {
    activeNode = node;
    updateNodeTransform();
    highlightConnections(node, data);
    event.stopPropagation();
    const infoPanelDiv = d3.select("#info");
    infoPanelDiv.style("display", "block").style("opacity", 0).html(`
        <div class="info-header">
            <h2>${node.name}</h2>
            <div class="categories">${renderCategories(node.category)}</div>
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
                ${renderRelated(node, data)}
            </div>
        </div>
    `);
    setTimeout(() => {
        infoPanelDiv.transition().duration(400).style("opacity", 1);
        updateSimulationLayout(true, 80);
    }, 50);
    initTabs();
    document.querySelectorAll(".timeline-preview").forEach(img => {
        img.onclick = (e) => {
            e.stopPropagation();
            const index = +img.dataset.index;
            openLightbox(node.content?.description?.images || [], index);
        };
    });
    document.querySelectorAll(".related-open-node").forEach(item => {
        item.onclick = (e) => {
            if (e.target.closest(".accordion-toggle")) return;
            const id = item.dataset.id;
            const targetNode = data.nodes.find(n => n.id == id);
            if (targetNode) nodeClicked(e, targetNode, data);
        };
    });
    document.querySelectorAll(".accordion-toggle").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const item = btn.closest(".related-item");
            const currentAccordion = item.querySelector(".related-accordion");
            const isOpen = currentAccordion.classList.contains("open");
            document.querySelectorAll(".related-accordion").forEach(acc => acc.classList.remove("open"));
            if (!isOpen) currentAccordion.classList.add("open");
        };
    });
}

function renderDescriptionTab(node) {
    const desc = node.content?.description;
    if (!desc) return "<p>Нет данных</p>";
    const hasGeo = node.geo && typeof node.geo === 'string' && node.geo.trim() !== '' && !node.geo.includes('undefined');
    const mapHtml = hasGeo ? node.geo.replace('width="560"', 'width="600"').replace('height="400"', 'height="250"') : '';
    return `
        ${formatDescription(desc.text)}
        ${renderTimeline(desc.images)}
        ${hasGeo ? `<div class="node-map"><label><b>${node.name} на Яндекс.Картах</b></label>${mapHtml}</div>` : ""}
    `;
}

function initGraph(data) {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        console.error("Invalid graph data:", data);
        return;
    }
    const tooltip = d3.select("body").append("div").attr("class", "graph-tooltip").style("opacity", 0);
    simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collision", d3.forceCollide().radius(d => Math.max(35, (d.name?.length || 10) * 3.5)).strength(0.9))
        .force("ui", uiCollisionForce());
    updateSimulationLayout();
    simulation.alphaTarget(0.1).restart();

    linkGroup = graphGroup.append("g");
    nodeGroup = graphGroup.append("g");
    const edges = linkGroup.selectAll("line").data(data.edges).enter().append("line")
        .attr("stroke", d => {
            const hasGeo = d.relations?.some(r => r.type === "geo");
            const hasHistory = d.relations?.some(r => r.type === "history");
            if (hasGeo && hasHistory) return "url(#edge-gradient)";
            return hasHistory ? "#BC461B" : "#1C9284";
        })
        .attr("stroke-width", 1.5).attr("stroke-opacity", 0.85);
    const defs = svg.append("defs");
    defs.append("linearGradient").attr("id", "edge-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%")
        .selectAll("stop").data([{ offset: "0%", color: "#1C9284" }, { offset: "100%", color: "#BC461B" }]).enter().append("stop")
        .attr("offset", d => d.offset).attr("stop-color", d => d.color);
    const nodes = nodeGroup.selectAll("g").data(data.nodes).enter().append("g")
        .call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded))
        .on("click", (event, d) => nodeClicked(event, d, data))
        .on("mouseenter", (event, d) => {
            const query = searchInput.property("value").toLowerCase();
            if (isMatchedByKeyword(d, query)) {
                tooltip.style("opacity", 1).text("Найдено по ключевым словам");
            }
        })
        .on("mousemove", (event) => tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px"))
        .on("mouseleave", () => tooltip.style("opacity", 0));
    nodes.each(function (d) {
        let icon = ICONS[d.icon] || ICONS["museum"];
        if (!icon) {
            console.warn("Missing icon for", d.name, "using default");
            icon = ICONS["museum"];
        }
        const node = d3.select(this);
        node.html(icon);
        node.selectAll("path").attr("fill", getNodeFill(d, svg));
    });
    const labels = nodeGroup.selectAll("text").data(data.nodes).enter().append("text")
        .text(d => d.name).attr("font-size", "11px").attr("text-anchor", "middle").attr("dy", "-2.3em").attr("pointer-events", "none");
    initFilters(edges, labels, nodes, data);
    simulation.on("tick", () => {
        const b = getBounds();
        const left = b.left, right = window.innerWidth - b.right, top = b.top, bottom = window.innerHeight - b.bottom;
        data.nodes.forEach(d => {
            const textHalf = Math.max(40, (d.name?.length || 10) * 3);
            d.x = Math.max(left + textHalf, Math.min(right - textHalf, d.x));
            d.y = Math.max(top + 40, Math.min(bottom - 20, d.y));
        });
        edges.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        updateNodeTransform();
        labels.attr("x", d => d.x).attr("y", d => d.y);
    });
    svg.on("click", () => {
        if (!activeNode) return;
        d3.select("#info").transition().duration(350).style("opacity", 0).on("end", () => d3.select("#info").style("display", "none"));
        activeNode = null;
        updateNodeTransform();
        updateFilters();
        setTimeout(() => { updateSimulationLayout(true, 70); simulation.alphaTarget(0.05).restart(); }, 180);
    });
}