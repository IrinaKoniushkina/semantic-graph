//переменные
let allNodes = [];
let allEdges = [];
let mode = "add";
let selectedRelations = [];
let editingNode = null;
let selectedCategories = [];
let selectedIcon = "";
let existingImages = [];
let newImages = [];
let currentEditingImage = null;
let currentEditingIndex = -1;
let currentEditingCollection = null;
let tempImageData = null;
let pendingFile = null;
let currentRelationEditing = null;
let currentRelationTag = null;
let isNewRelation = false;
let pendingRelationDelete = null;
let currentStep = 1;
let currentTab = "editor";


const nameInput = document.getElementById("name-input");
const keywordsInput = document.getElementById("keywords-input");
const keywordsCounter = document.getElementById("keywords-counter");
const nameDropdown = document.getElementById("name-dropdown");
const categorySearch = document.getElementById("category-input");
const categoryDropdown = document.getElementById("category-dropdown");
const selectedCategoriesDiv = document.getElementById("selected-categories");
const historyInput = document.getElementById("history-input");
const modernInput = document.getElementById("modern-input");
const descInput = document.getElementById("desc-input");
const iconPicker = document.getElementById("icon-picker");
const imagesInput = document.getElementById("images-input");
const preview = document.getElementById("image-preview");
const uploadBox = document.querySelector(".upload-box");
const relationSearch = document.getElementById("relation-search");
const relationDropdown = document.getElementById("relation-dropdown");
const selectedRelationsDiv = document.getElementById("selected-relations");
const relationReasonEditor = document.getElementById("relation-reason-editor");
const relationReasonInput = document.getElementById("relation-reason-input");
const relationReasonCounter = document.getElementById("relation-reason-counter");
const saveRelationReasonBtn = document.getElementById("save-relation-reason");
const cancelRelationReasonBtn = document.getElementById("cancel-relation-reason");
const form = document.getElementById("form");
const btnAdd = document.getElementById("mode-add");
const btnEdit = document.getElementById("mode-edit");
const title = document.getElementById("title");
const step1Buttons = document.querySelector(".step-buttons-first");
const step1NextBtn = document.getElementById("step1-next");
const deleteBtn = document.getElementById("delete-btn");
const modal = document.getElementById("deleteModal");
const deleteYes = document.getElementById("deleteYes");
const deleteNo = document.getElementById("deleteNo");
const modalClose = document.getElementById("modalClose");
const deleteRelationModal = document.getElementById("deleteRelationModal");
const relationDeleteYes = document.getElementById("relationDeleteYes");
const relationDeleteNo = document.getElementById("relationDeleteNo");
const relationModalClose = document.getElementById("relationModalClose");
const toast = document.getElementById("toast");
const imageModal = document.getElementById("imageModal");
const uploadFromDevice = document.getElementById("uploadFromDevice");
const modalImageBox = document.getElementById("modalImageBox");
const modalPreviewImage = document.getElementById("modalPreviewImage");
const removeModalPreview = document.getElementById("removeModalPreview");
const closeImageModal = document.getElementById("closeImageModal");
const addUrlBtn = document.getElementById("addUrlBtn");
const imageCaptionInput = document.getElementById("imageCaptionInput");
const imageUrlInput = document.getElementById("imageUrlInput");
const imageCreditsToggle = document.getElementById("imageCreditsToggle");
const imageCreditsFields = document.getElementById("imageCreditsFields");
const imageAuthorInput = document.getElementById("imageAuthorInput");
const imageSourceInput = document.getElementById("imageSourceInput");
const imageLicenseInput = document.getElementById("imageLicenseInput");
const geoInput = document.getElementById("geo-input");
const resetModal = document.getElementById("resetModal");
const resetYes = document.getElementById("resetYes");
const resetNo = document.getElementById("resetNo");
const resetModalClose = document.getElementById("resetModalClose");


const limits = {
    name: { min: 3, max: 30 },
    desc: { min: 250, max: 500 },
    keywords: { min: 10, max: 150 },
    history: { min: 1000, max: 1500 },
    modern: { min: 1000, max: 1500 }
};

const CATEGORY_COLORS = {
    "молодежь": "#A32406",
    "культура": "#521C00",
    "туризм": "#496771"
};

const MAX_IMAGES = 5;
const MIN_IMAGE_CAPTION = 3;

const allCategories = ["культура", "молодежь", "туризм"];

const iconDescriptions = {
    "museum": "Музеи, театры, библиотеки и др.",
    "church": "Церкви, храмы, соборы и др.",
    "park": "Природные зоны, Листвянка, Байкал и др.",
    "monument": "Памятники, монументы и др.",
    "building": "Инфрастукутура города, мосты, улицы и др.",
    "user": "Исторические личности, писатели и др."
};