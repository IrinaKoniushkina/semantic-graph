// frontend/js/core/nodes.js

import { ICONS } from '../config.js';
import { getNodeFill } from './utils.js';

/**
 * Создание вершин
 */
export function createNodes(nodeGroup, nodesData, svg, callbacks) {
    const { onNodeClick, onDragStart, onDrag, onDragEnd, onNodeMouseEnter, onNodeMouseLeave } = callbacks;

    const nodes = nodeGroup
        .selectAll("g")
        .data(nodesData)
        .enter()
        .append("g")
        .call(d3.drag()
            .on("start", onDragStart)
            .on("drag", onDrag)
            .on("end", onDragEnd)
        )
        .on("click", onNodeClick)
        .on("mouseenter", onNodeMouseEnter)
        .on("mouseleave", onNodeMouseLeave);

    nodes.each(function (d) {
        const node = d3.select(this);
        node.html(ICONS[d.icon] || ICONS.museum);
        node.selectAll("path").attr("fill", () => getNodeFill(d, svg));
    });

    return nodes;
}

/**
 * Создание подписей
 */
export function createLabels(labelGroup, nodesData) {
    return labelGroup.selectAll("text")
        .data(nodesData)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "-2.3em")
        .attr("pointer-events", "none");
}

/**
 * Обновление трансформации + масштаба выбранной вершины
 */
export function updateNodeTransform(nodesSelection, activeNode = null) {
    if (!nodesSelection) return;

    nodesSelection.attr("transform", d => {
        const isActive = activeNode && d.id === activeNode.id;
        const scale = isActive ? 1.65 : 1;
        return `translate(${d.x || 0}, ${d.y || 0}) scale(${scale}) translate(-15, -15)`;
    });
}