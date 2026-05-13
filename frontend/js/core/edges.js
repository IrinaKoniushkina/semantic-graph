// frontend/js/core/edges.js

import { CATEGORY_COLORS } from '../config.js';

/**
 * Создание и настройка всех рёбер графа
 */
export function createEdges(linkGroup, edges, svg) {
    // Добавляем градиент для смешанных связей
    createEdgeGradient(svg);

    const edgeElements = linkGroup
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", d => getEdgeColor(d))
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.85);

    return edgeElements;
}

/**
 * Определение цвета ребра
 */
function getEdgeColor(d) {
    // Если связь имеет оба типа (geo + history)
    if (d.types && d.types.length === 2) {
        return "url(#edge-gradient)";
    }

    // Обычные связи
    const hasHistory = d.relations?.some(r => r.type === "history") || d.type === "history";
    return hasHistory ? "#BC461B" : "#1C9284";
}

/**
 * Создание линейного градиента для смешанных связей
 */
function createEdgeGradient(svg) {
    const defs = svg.select("defs") || svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "edge-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#1C9284");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#BC461B");
}

/**
 * Обновление стилей рёбер при фильтрации / выделении
 */
export function updateEdgesStyle(edgesSelection, activeNode = null, isNodeActiveFn) {
    if (activeNode) {
        // Выделяем только связи выбранного узла
        edgesSelection.style("opacity", e => {
            return (e.source.id === activeNode.id || e.target.id === activeNode.id) ? 1 : 0.05;
        });
    } else {
        // Обычный режим фильтрации
        edgesSelection.style("opacity", d => {
            const s = isNodeActiveFn(d.source);
            const t = isNodeActiveFn(d.target);
            return (s && t) ? 1 : 0.05;
        });
    }
}

/**
 * Подсветка связей при клике на узел
 */
export function highlightConnections(edgesSelection, selectedNode) {
    edgesSelection.style("opacity", e => {
        return (e.source.id === selectedNode.id || e.target.id === selectedNode.id)
            ? 1
            : 0.05;
    });
}