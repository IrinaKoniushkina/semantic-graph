// frontend/js/ui/interactions.js

import { updateNodeTransform } from '../core/nodes.js';
import { highlightConnections } from '../core/edges.js';
import { relaxGraph } from '../core/simulation.js';
import { showNodeInfo, hideNodeInfo } from './infoPanel.js';
import { setActiveNode } from './controls.js';
import { isNodeActive } from '../core/utils.js';

let activeNodeGlobal = null;

/**
 * Создание колбэков — максимально близко к оригиналу
 */
export function createInteractionCallbacks(data, nodesSelection, labelsSelection, edgesSelection, getSimulation) {
    
    let tooltip = null;

    function createTooltip() {
        if (!tooltip) {
            tooltip = d3.select("body").append("div")
                .attr("class", "graph-tooltip")
                .style("opacity", 0);
        }
        return tooltip;
    }

    function isConnected(d, selected) {
        if (!selected) return false;
        return data.edges.some(e => 
            (e.source.id === selected.id && e.target.id === d.id) ||
            (e.target.id === selected.id && e.source.id === d.id)
        );
    }

    const callbacks = {
        onNodeClick(event, node) {
            event.stopPropagation();
            
            activeNodeGlobal = node;
            setActiveNode(node);

            // === ОРИГИНАЛЬНАЯ ЛОГИКА ПОДСВЕТКИ ===
            if (nodesSelection) {
                nodesSelection.style("opacity", d => {
                    if (d.id === node.id) return 1;
                    return isConnected(d, node) ? 1 : 0.1;
                });
            }

            if (labelsSelection) {
                labelsSelection
                    .style("opacity", d => {
                        if (d.id === node.id) return 1;
                        return isConnected(d, node) ? 1 : 0.1;
                    })
                    .attr("font-size", d => d.id === node.id ? "16px" : "11px")
                    .attr("dy", d => d.id === node.id ? "-3em" : "-2.5em");
            }

            if (edgesSelection) {
                highlightConnections(edgesSelection, node);
            }

            // Увеличение активной вершины
            updateNodeTransform(nodesSelection, node);

            showNodeInfo(node);
            relaxGraph();
        },

        onDragStart(event, d) {
            const sim = typeof getSimulation === 'function' ? getSimulation() : null;
            if (sim?.alphaTarget) {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
        },

        onDrag(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        },

        onDragEnd(event, d) {
            const sim = typeof getSimulation === 'function' ? getSimulation() : null;
            if (sim?.alphaTarget) {
                if (!event.active) sim.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        },

        onNodeMouseEnter(event, d) {
            const t = createTooltip();
            const query = d3.select("#search").property("value").toLowerCase();
            if (isMatchedByKeyword(d, query)) {
                t.style("opacity", 1).text("Найдено по ключевым словам");
            }
        },

        onNodeMouseLeave() {
            createTooltip().style("opacity", 0);
        }
    };

    function setupBackgroundClick(svg) {
        svg.on("click", () => {
            if (!activeNodeGlobal) return;
            
            hideNodeInfo();
            activeNodeGlobal = null;
            setActiveNode(null);

            if (nodesSelection) updateNodeTransform(nodesSelection, null);
            
            setTimeout(() => {
                window.updateFilters?.();
                relaxGraph();
            }, 180);
        });
    }

    return { callbacks, setupBackgroundClick };
}

// Вспомогательные функции
function isMatchedByKeyword(node, query) {
    if (!query) return false;
    const nameMatch = node.name.toLowerCase().includes(query);
    const keywordMatch = (node.keywords || "").toLowerCase().includes(query);
    return keywordMatch && !nameMatch;
}

export function createUpdateFiltersFunction(nodesSelection, labelsSelection, edgesSelection, data) {
    return function updateFilters() {
        const query = d3.select("#search").property("value").toLowerCase();
        const selectedCategories = new Set(
            Array.from(document.querySelectorAll('#filter-menu input:checked')).map(cb => cb.value)
        );
        if (selectedCategories.size === 0) selectedCategories.add("all");

        const isActiveFn = (node) => isNodeActive(node, query, selectedCategories);

        if (nodesSelection) nodesSelection.style("opacity", d => isActiveFn(d) ? 1 : 0.1);
        if (labelsSelection) labelsSelection.style("opacity", d => isActiveFn(d) ? 1 : 0.1);
        if (edgesSelection) {
            edgesSelection.style("opacity", d => {
                const s = isActiveFn(d.source);
                const t = isActiveFn(d.target);
                return (s && t) ? 1 : 0.05;
            });
        }
    };
}