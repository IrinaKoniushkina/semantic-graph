// frontend/js/ui/controls.js

import { CATEGORY_COLORS } from '../config.js';
import { updateBackground, setLastSelectedCategory } from './background.js';
import { isNodeActive, isMatchedByKeyword } from '../core/utils.js';

let searchInput, clearBtn, filterToggle, filterMenu, filterCheckboxes;
let selectedCategories = new Set(["all"]);
let lastSelectedCategory = "all";
let activeNode = null;
let updateFiltersCallback = null;

/**
 * Инициализация всех элементов управления (поиск + фильтры)
 */
export function setupUIControls(callbacks) {
    updateFiltersCallback = callbacks?.updateFilters;

    // Поиск
    searchInput = d3.select("#search");
    clearBtn = d3.select("#clear-search");

    searchInput.on("input", handleSearchInput);
    clearBtn.on("click", clearSearch);

    // Фильтры по категориям
    filterToggle = document.getElementById("filter-toggle");
    filterMenu = document.getElementById("filter-menu");
    filterCheckboxes = filterMenu.querySelectorAll("input");

    setupFilterDropdown();
}

/**
 * Обработчик ввода в поиск
 */
function handleSearchInput() {
    const value = this.value.trim();
    clearBtn.style("display", value ? "block" : "none");
    if (updateFiltersCallback) updateFiltersCallback();
}

/**
 * Очистка поиска
 */
function clearSearch() {
    searchInput.property("value", "");
    clearBtn.style("display", "none");
    if (updateFiltersCallback) updateFiltersCallback();
}

/**
 * Настройка dropdown фильтров
 */
function setupFilterDropdown() {
    filterToggle.addEventListener("click", toggleFilterMenu);

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".filter-dropdown")) {
            filterMenu.style.display = "none";
        }
    });

    filterCheckboxes.forEach(cb => {
        cb.addEventListener("change", handleCategoryChange);
    });
}

function toggleFilterMenu() {
    const isOpen = filterMenu.style.display === "block";
    filterMenu.style.display = isOpen ? "none" : "block";
    document.querySelector(".filter-dropdown").classList.toggle("open", !isOpen);
}

function handleCategoryChange(e) {
    const value = e.target.value;

    if (value === "all") {
        selectedCategories = new Set(["all"]);
        filterCheckboxes.forEach(c => c.checked = c.value === "all");
        lastSelectedCategory = "all";
        setLastSelectedCategory("all");
    } else {
        selectedCategories.delete("all");
        document.querySelector('input[value="all"]').checked = false;

        if (e.target.checked) {
            selectedCategories.add(value);
            lastSelectedCategory = value;
            setLastSelectedCategory(value);        // ← важно!
        } else {
            selectedCategories.delete(value);
        }

        // Если выбраны все категории — переключаем на "Все"
        const realCats = ["культура", "молодежь", "туризм"];
        if (realCats.every(cat => selectedCategories.has(cat))) {
            selectedCategories = new Set(["all"]);
            filterCheckboxes.forEach(c => c.checked = c.value === "all");
            lastSelectedCategory = "all";
            setLastSelectedCategory("all");
        }

        if (selectedCategories.size === 0) {
            selectedCategories = new Set(["all"]);
            document.querySelector('input[value="all"]').checked = true;
            lastSelectedCategory = "all";
            setLastSelectedCategory("all");
        }
    }

    updateFilterLabel();
    updateBackground(selectedCategories);     // ← обновляем фон
    
    if (updateFiltersCallback) updateFiltersCallback();
    filterMenu.style.display = "none";
}

/**
 * Обновление текста выбранного фильтра
 */
function updateFilterLabel() {
    if (selectedCategories.has("all")) {
        filterToggle.innerHTML = `Все <span class="category-circle" style="background: linear-gradient(to right, #521C00, #A32406, #678690);"></span>`;
        return;
    }

    const map = {
        культура: "Культура",
        молодежь: "Молодежь",
        туризм: "Туризм"
    };

    const html = Array.from(selectedCategories).map(cat => `
        ${map[cat]}
        <span class="category-circle" style="background: ${CATEGORY_COLORS[cat]};"></span>
    `).join("");

    filterToggle.innerHTML = html;
}

/**
 * Публичные геттеры
 */
export function getSelectedCategories() {
    return selectedCategories;
}

export function getSearchQuery() {
    return searchInput ? searchInput.property("value").toLowerCase() : "";
}

export function setActiveNode(node) {
    activeNode = node;
}

export function getActiveNode() {
    return activeNode;
}