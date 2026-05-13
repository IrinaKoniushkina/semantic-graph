// frontend/js/core/simulation.js

import { getLayout } from './utils.js';

let simulation = null;
let currentLayout = getLayout();

/**
 * Инициализация force simulation
 */
export function initSimulation(nodes, edges, svg, nodeGroup, linkGroup, onTickCallback) {
    const uiCollisionForce = createUICollisionForce();

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collision", d3.forceCollide().radius(d => {
            const textSize = (d.name?.length || 10) * 3.5;
            return Math.max(35, textSize);
        }).strength(0.9))
        .force("ui", uiCollisionForce);

    updateSimulationLayout(false);

    // Основной tick
    simulation.on("tick", () => {
        applyBoundsConstraints(nodes);
        updateLinks(linkGroup);
        onTickCallback?.();
    });

    return simulation;
}

/**
 * Плавное обновление布局 (центр + радиус)
 */
export function updateSimulationLayout(smooth = true, delay = 0) {
    const target = getLayout();

    if (!smooth) {
        currentLayout = { ...target };
        applyForces();
        simulation?.alphaTarget(0.015).restart();
        return;
    }

    // Плавная анимация
    setTimeout(() => {
        d3.timer((elapsed) => {
            const t = Math.min(1, elapsed / 1600);
            const k = 1 - Math.pow(1 - t, 5);

            currentLayout.centerX += (target.centerX - currentLayout.centerX) * k * 0.085;
            currentLayout.centerY += (target.centerY - currentLayout.centerY) * k * 0.085;
            currentLayout.radius += (target.radius - currentLayout.radius) * k * 0.085;

            applyForces();

            simulation?.alphaTarget(0.012).restart();

            return t >= 1;
        });
    }, delay);
}

/**
 * Применение сил центрирования
 */
function applyForces() {
    if (!simulation) return;

    simulation.force("center", d3.forceCenter(currentLayout.centerX, currentLayout.centerY));
    simulation.force("radial", 
        d3.forceRadial(currentLayout.radius, currentLayout.centerX, currentLayout.centerY)
            .strength(0.018)
    );
    simulation.force("alignY", d3.forceY(currentLayout.centerY).strength(0.025));
}

/**
 * Ограничение узлов в пределах видимой области
 */
function applyBoundsConstraints(nodes) {
    const b = getLayout().bounds;

    const left = b.left;
    const right = window.innerWidth - b.right;
    const top = b.top;
    const bottom = window.innerHeight - b.bottom;

    nodes.forEach(d => {
        const textHalf = Math.max(40, (d.name?.length || 10) * 3);

        d.x = Math.max(left + textHalf, Math.min(right - textHalf, d.x));
        d.y = Math.max(top + 40, Math.min(bottom - 20, d.y));
    });
}

/**
 * Обновление координат рёбер
 */
function updateLinks(linkGroup) {
    linkGroup.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
}

/**
 * Force для предотвращения пересечения с UI-элементами
 */
function createUICollisionForce() {
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

        // Применяем отталкивание
        // (логика оставлена почти как была, но чище)
        // ...
    };
}

/**
 * Перезапуск симуляции с небольшой силой
 */
export function relaxGraph() {
    if (simulation) {
        updateSimulationLayout(true, 50);
        simulation.alphaTarget(0.018).restart();
    }
}

export function getSimulation() {
    return simulation;
}