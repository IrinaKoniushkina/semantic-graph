// frontend/js/core/utils.js

import { CONFIG, CATEGORY_COLORS } from '../config.js';

/**
 * Получение текущих границ для позиционирования графа
 */
export function getBounds() {
    const controlsEl = document.querySelector("#controls");
    const infoEl = document.querySelector("#info");

    const controls = controlsEl?.getBoundingClientRect();
    const info = infoEl?.getBoundingClientRect();

    return {
        left: controls ? controls.right + 30 : 30,
        right: infoEl && getComputedStyle(infoEl).display !== "none"
            ? (window.innerWidth - info.left + 30)
            : 30,
        top: 30,
        bottom: 30
    };
}

/**
 * Получение параметров布局 для центрирования графа
 */
export function getLayout() {
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

/**
 * Определение цвета заливки узла (поддержка нескольких категорий)
 */
export function getNodeFill(d, svg) {
    if (!d.category || d.category.length === 0) return "#ccc";

    if (d.category.length === 1) {
        return CATEGORY_COLORS[d.category[0]] || "#ccc";
    }

    // Множественные категории → градиент
    const cats = new Set(d.category);
    let colors = [];

    if (cats.has("культура") && cats.has("молодежь") && cats.has("туризм")) {
        colors = ["#521C00", "#A32406", "#496771"];
    } else if (cats.has("молодежь") && cats.has("культура")) {
        colors = ["#521C00", "#A32406"];
    } else if (cats.has("молодежь") && cats.has("туризм")) {
        colors = ["#A32406", "#496771"];
    } else if (cats.has("культура") && cats.has("туризм")) {
        colors = ["#521C00", "#496771"];
    } else {
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

    grad.selectAll("stop").remove();

    colors.forEach((color, i) => {
        grad.append("stop")
            .attr("offset", `${(i / (colors.length - 1)) * 100}%`)
            .attr("stop-color", color);
    });

    return `url(#${gradId})`;
}

/**
 * Проверка активности узла (поиск + фильтры)
 */
export function isNodeActive(node, query, selectedCategories) {
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

/**
 * Проверка совпадения по ключевым словам (для тултипа)
 */
export function isMatchedByKeyword(node, query) {
    if (!query) return false;
    const nameMatch = node.name.toLowerCase().includes(query);
    const keywordMatch = (node.keywords || "").toLowerCase().includes(query);
    return keywordMatch && !nameMatch;
}

/**
 * Форматирование текста описания
 */
export function formatDescription(text) {
    if (!text) return "";
    return `<p class="info-text">${text}</p>`;
}

/**
 * Безопасное получение текста из contenteditable
 */
export function getTextLength(input) {
    if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
        return input.value.length;
    }
    return input.innerText.length;
}

/**
 * Генерация уникального ID (fallback)
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}