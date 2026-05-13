// frontend/js/ui/infoPanel.js

import { formatDescription } from '../core/utils.js';
import { CATEGORY_COLORS } from '../config.js';

let infoPanel;
let currentData = null; // ссылка на все данные графа

/**
 * Инициализация информационной панели
 */
export function setupInfoPanel(data) {
    currentData = data;
    infoPanel = d3.select("#info");
}

/**
 * Открытие панели с информацией об узле
 */
function showNodeInfo(node) {
    if (!infoPanel || !node) return;

    infoPanel
        .style("display", "block")
        .style("opacity", 0)
        .html(generateNodeHTML(node));

    // Плавное появление
    infoPanel.transition()
        .duration(400)
        .style("opacity", 1);

    initTabs();
    setupRelatedInteractions();
}

/**
 * Закрытие информационной панели
 */
function hideNodeInfo() {
    if (!infoPanel) return;

    infoPanel.transition()
        .duration(350)
        .style("opacity", 0)
        .on("end", () => {
            infoPanel.style("display", "none");
        });
}

/**
 * Генерация HTML содержимого панели
 */
function generateNodeHTML(node) {
    return `
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
    `;
}

/**
 * Рендер категорий
 */
function renderCategories(categories) {
    if (!categories || categories.length === 0) return "";
    return categories.map(cat => `
        <span style="background-color: ${CATEGORY_COLORS[cat] || "#ccc"};">
            ${cat}
        </span>
    `).join("");
}

/**
 * Рендер вкладки "Описание" (текст + таймлайн + карта)
 */
function renderDescriptionTab(node) {
    const desc = node.content?.description;
    if (!desc) return "<p>Нет данных</p>";

    const mapHtml = node.geo 
        ? `<div class="node-map"><label><b>${node.name} на Яндекс.Картах</b></label>${node.geo}</div>`
        : "";

    return `
        ${formatDescription(desc.text)}
        ${renderTimeline(desc.images)}
        ${mapHtml}
    `;
}

/**
 * Рендер таймлайна изображений
 */
function renderTimeline(images) {
    if (!images || images.length === 0) {
        return "<p>Нет изображений</p>";
    }

    return `
        <div class="timeline">
            ${images.map(item => `
                <div class="timeline-item">
                    <div class="timeline-image">
                        <img src="${item.src}" alt="${item.caption || ''}">
                    </div>
                    <div class="timeline-year">${item.caption || ''}</div>
                </div>
            `).join("")}
        </div>
    `;
}

/**
 * Рендер связанных объектов
 */
function renderRelated(node) {
    const related = currentData.edges
        .filter(e => e.source.id === node.id || e.target.id === node.id)
        .map(e => ({
            node: e.source.id === node.id ? e.target : e.source,
            geoRelations: e.relations?.filter(r => r.type === "geo") || [],
            historyRelations: e.relations?.filter(r => r.type === "history") || []
        }));

    if (!related.length) return "<p>Нет связанных мест</p>";

    const geo = related.filter(r => r.geoRelations.length);
    const history = related.filter(r => r.historyRelations.length);

    return `
        <div class="related-wrapper">
            ${renderRelatedGroup("Географические связи", geo, "geo")}
            ${renderRelatedGroup("Историко-культурные связи", history, "history")}
        </div>
    `;
}

function renderRelatedGroup(title, items, type) {
    if (!items.length) return "";

    return `
        <div class="related-group ${type}">
            <div class="related-group-header ${type}">
                <span>${title}</span>
            </div>
            <div class="related-group-content">
                ${items.map(r => {
                    const reasons = type === "history" 
                        ? [...new Set(r.historyRelations.map(rel => rel.reason?.trim()).filter(Boolean))]
                        : [];

                    return `
                        <div class="related-item related-open-node ${type}" data-id="${r.node.id}">
                            <div class="related-item-main">
                                <div class="related-item-title">${r.node.name}</div>
                                ${type === "history" && reasons.length ? `
                                    <div class="related-info-icon accordion-toggle">?</div>
                                ` : ""}
                            </div>
                            ${type === "history" && reasons.length ? `
                                <div class="related-accordion">
                                    ${reasons.map(reason => `
                                        <div class="related-accordion-text">${reason}</div>
                                    `).join("")}
                                </div>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

/**
 * Инициализация табов
 */
function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panes = document.querySelectorAll(".tab-pane");

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        };
    });
}

/**
 * Настройка взаимодействий внутри панели (аккордеон + переход по связям)
 */
function setupRelatedInteractions() {
    // Переход по связанному объекту
    document.querySelectorAll(".related-open-node").forEach(item => {
        item.onclick = (e) => {
            if (e.target.closest(".accordion-toggle")) return;
            const id = item.dataset.id;
            const targetNode = currentData.nodes.find(n => n.id == id);
            if (targetNode) {
                // Будет обработано в главном модуле
                window.dispatchEvent(new CustomEvent('nodeSelected', { detail: targetNode }));
            }
        };
    });

    // Аккордеон
    document.querySelectorAll(".accordion-toggle").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const accordion = btn.closest(".related-item").querySelector(".related-accordion");
            const isOpen = accordion.classList.contains("open");

            document.querySelectorAll(".related-accordion").forEach(acc => acc.classList.remove("open"));
            if (!isOpen) accordion.classList.add("open");
        };
    });
}

export { showNodeInfo, hideNodeInfo };