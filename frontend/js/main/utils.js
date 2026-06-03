function getBounds() {
    const controlsEl = document.querySelector("#controls");
    const infoEl = document.querySelector("#info");
    const controls = controlsEl?.getBoundingClientRect();
    const info = infoEl?.getBoundingClientRect();
    return {
        left: controls ? controls.right + 30 : 30,
        right: infoEl && getComputedStyle(infoEl).display !== "none" ? (window.innerWidth - info.left + 30) : 30,
        top: 30,
        bottom: 30
    };
}

function getLayout() {
    const b = getBounds();
    const freeWidth = window.innerWidth - b.left - b.right;
    const freeHeight = window.innerHeight - b.top - b.bottom;
    return {
        bounds: b,
        centerX: b.left + freeWidth / 2,
        centerY: b.top + freeHeight / 2,
        radius: Math.min(freeWidth, freeHeight) * 0.38
    };
}

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
            simulation.force("center", d3.forceCenter(currentLayout.centerX, currentLayout.centerY));
            simulation.force("radial", d3.forceRadial(currentLayout.radius, currentLayout.centerX, currentLayout.centerY).strength(0.018));
            simulation.force("alignY", d3.forceY(currentLayout.centerY).strength(0.025));
            simulation.alphaTarget(0.012).restart();
            return t >= 1;
        });
    }, delay);
}

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
        simulation.nodes().forEach(d => {
            const labelHeight = 40;
            const nodeRadius = 25;
            const x = d.x;
            const y = d.y;
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
                const overlap = nodeRight > left && nodeLeft < right && nodeBottom > top && nodeTop < bottom;
                if (overlap) {
                    const pushX = Math.min(Math.abs(nodeRight - left), Math.abs(right - nodeLeft));
                    const pushY = Math.min(Math.abs(nodeBottom - top), Math.abs(bottom - nodeTop));
                    if (pushX < pushY) {
                        d.vx += x < (left + right) / 2 ? -0.15 : 0.15;
                    } else {
                        d.vy += y < (top + bottom) / 2 ? -0.15 : 0.15;
                    }
                }
            });
        });
    };
}

function formatDescription(text) {
    if (!text) return "";
    return `<p class="info-text">${text}</p>`;
}

function renderCategories(categories) {
    if (!categories || categories.length === 0) return "";
    return categories.map(cat => `<span style="background-color: ${CATEGORY_COLORS[cat] || "#ccc"};">${cat}</span>`).join("");
}

function renderTimeline(images) {
    const validImages = images.filter(img => img && img.src);
    if (validImages.length === 0) return '';
    return `<div class="timeline">
        ${validImages.map((item, index) => `
            <div class="timeline-item">
                <div class="timeline-image">
                    <img src="${item.src}" alt="" class="timeline-preview" data-index="${index}">
                </div>
                <div class="timeline-year">${item.caption || ""}</div>
            </div>
        `).join("")}
    </div>`;
}

function renderRelated(node, data) {
    const related = data.edges
        .filter(e => e.source.id === node.id || e.target.id === node.id)
        .map(e => ({
            node: e.source.id === node.id ? e.target : e.source,
            geoRelations: e.relations.filter(r => r.type === "geo"),
            historyRelations: e.relations.filter(r => r.type === "history")
        }));
    if (!related.length) return "<p>Нет связанных мест</p>";
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
                        const reasons = type === "history" ? [...new Set(r.historyRelations.map(rel => rel.reason?.trim()).filter(Boolean))] : [];
                        return `
                            <div class="related-item related-open-node ${type}" data-id="${r.node.id}">
                                <div class="related-item-main">
                                    <div class="related-item-title">${r.node.name}</div>
                                    ${type === "history" && reasons.length ? `<div class="related-info-icon accordion-toggle">?</div>` : ""}
                                </div>
                                ${type === "history" && reasons.length ? `
                                    <div class="related-accordion">
                                        ${reasons.map(reason => `<div class="related-accordion-text">${reason}</div>`).join("")}
                                    </div>
                                ` : ""}
                            </div>
                        `;
                    }).join("") : `<div class="related-empty">Нет связей</div>`}
                </div>
            </div>
        `;
    }
    return `
        <div class="related-wrapper">
            ${renderGroup("Географические связи", geo, "geo")}
            ${renderGroup("Историко-культурные связи", history, "history")}
        </div>
    `;
}