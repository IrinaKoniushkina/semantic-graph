// frontend/js/core/graph.js

import { initSimulation, updateSimulationLayout, relaxGraph } from './simulation.js';
import { createEdges, highlightConnections } from './edges.js';
import { createNodes, createLabels, updateNodeTransform } from './nodes.js';
import { createInteractionCallbacks, createUpdateFiltersFunction } from '../ui/interactions.js';
import { setupUIControls } from '../ui/controls.js';
import { setupBackground } from '../ui/background.js';
import { setupInfoPanel } from '../ui/infoPanel.js';

let svg, graphGroup, linkGroup, nodeGroup, labelGroup;
let nodesSelection, labelsSelection, edgesSelection;
let simulation;
let graphData;

/**
 * Главная функция инициализации графа
 */
export function initGraph(data) {
    graphData = data;

    setupSVG();

    linkGroup = graphGroup.append("g").attr("class", "links");
    nodeGroup = graphGroup.append("g").attr("class", "nodes");
    labelGroup = graphGroup.append("g").attr("class", "labels");

    // 1. Создаём рёбра
    edgesSelection = createEdges(linkGroup, data.edges, svg);

    // 2. Создаём вершины и метки СНАЧАЛА
    nodesSelection = createNodes(nodeGroup, data.nodes, svg, { 
        onNodeClick: () => {}, // временные заглушки
        onDragStart: () => {},
        onDrag: () => {},
        onDragEnd: () => {},
        onNodeMouseEnter: () => {},
        onNodeMouseLeave: () => {}
    });
    labelsSelection = createLabels(labelGroup, data.nodes);

    // 3. Создаём callbacks (теперь selections уже существуют)
    const interactionResult = createInteractionCallbacks(
        data,
        nodesSelection,
        labelsSelection,
        edgesSelection,
        () => simulation
    );

    // 4. Переприсваиваем правильные обработчики
    nodesSelection
        .on("click", interactionResult.callbacks.onNodeClick)
        .on("mouseenter", interactionResult.callbacks.onNodeMouseEnter)
        .on("mouseleave", interactionResult.callbacks.onNodeMouseLeave)
        .call(d3.drag()
            .on("start", interactionResult.callbacks.onDragStart)
            .on("drag", interactionResult.callbacks.onDrag)
            .on("end", interactionResult.callbacks.onDragEnd)
        );

    // 5. Инициализируем симуляцию
    simulation = initSimulation(
        data.nodes,
        data.edges,
        svg,
        nodeGroup,
        linkGroup,
        () => tickHandler()
    );

    // 6. Настраиваем UI
    setupUIControls({
        updateFilters: createUpdateFiltersFunction(nodesSelection, labelsSelection, edgesSelection, data)
    });

    setupInfoPanel(data);
    setupBackground();

    // Клик по фону
    interactionResult.setupBackgroundClick(svg);

    // Запуск
    updateSimulationLayout(false);
    simulation.alphaTarget(0.1).restart();

    window.updateFilters = createUpdateFiltersFunction(nodesSelection, labelsSelection, edgesSelection, data);
}

/* ==================== Вспомогательные функции ==================== */

function setupSVG() {
    svg = d3.select("#graph")
        .append("svg")
        .attr("width", window.innerWidth)
        .attr("height", window.innerHeight);

    graphGroup = svg.append("g");
}

function tickHandler() {
    edgesSelection
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    updateNodeTransform(nodesSelection);
    labelsSelection
        .attr("x", d => d.x)
        .attr("y", d => d.y);
}

export function handleResize() {
    if (!svg) return;
    svg.attr("width", window.innerWidth)
       .attr("height", window.innerHeight);
    updateSimulationLayout(true);
}