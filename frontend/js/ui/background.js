// frontend/js/ui/background.js

import { CATEGORY_BACKGROUNDS } from '../config.js';

let activeBg = null;
let hiddenBg = null;
let lastSelectedCategory = "all";   // ← возвращаем

/**
 * Инициализация фона
 */
export function setupBackground() {
    activeBg = document.getElementById("bg1");
    hiddenBg = document.getElementById("bg2");

    if (activeBg) {
        activeBg.style.backgroundImage = CATEGORY_BACKGROUNDS.all;
        activeBg.classList.add("active");
    }
}

/**
 * Плавная смена фона
 */
export function updateBackground(selectedCategories) {
    if (!activeBg || !hiddenBg) return;

    let bgUrl = CATEGORY_BACKGROUNDS.all;

    // Если выбрана ровно одна категория — используем её фон
    if (!selectedCategories.has("all") && selectedCategories.size === 1) {
        const singleCat = Array.from(selectedCategories)[0];
        bgUrl = CATEGORY_BACKGROUNDS[singleCat] || CATEGORY_BACKGROUNDS.all;
        lastSelectedCategory = singleCat;
    } 
    // Если выбрано несколько категорий — используем фон последней выбранной
    else if (!selectedCategories.has("all") && selectedCategories.size > 1) {
        bgUrl = CATEGORY_BACKGROUNDS[lastSelectedCategory] || CATEGORY_BACKGROUNDS.all;
    } 
    // "Все" или ничего — общий фон
    else {
        bgUrl = CATEGORY_BACKGROUNDS.all;
        lastSelectedCategory = "all";
    }

    // Плавная смена
    hiddenBg.style.backgroundImage = bgUrl;
    hiddenBg.classList.add("active");
    activeBg.classList.remove("active");

    [activeBg, hiddenBg] = [hiddenBg, activeBg];
}

/**
 * Обновление последней выбранной категории
 */
export function setLastSelectedCategory(category) {
    if (category && category !== "all") {
        lastSelectedCategory = category;
    }
}

export function getLastSelectedCategory() {
    return lastSelectedCategory;
}