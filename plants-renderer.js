/**
 * Plant Card Renderer
 * Dynamically renders plant cards from plants-data.json
 * Eliminates duplicate HTML code across pages
 */

(function() {
    'use strict';

    // Import utilities from shared utils.js
    const { escapeHtml, logError, logWarn, isValidString, isValidArray } = window.Utils || {};

    // Validate that utils.js is loaded
    if (!window.Utils) {
        console.error('[PlantsRenderer] utils.js not loaded! Plant rendering may not work correctly.');
    }

    /**
     * Validate plant object structure
     */
    function isValidPlant(plant) {
        if (!plant || typeof plant !== 'object') return false;
        if (!plant.commonName || typeof plant.commonName !== 'string') return false;
        if (!plant.botanicalName || typeof plant.botanicalName !== 'string') return false;
        if (!plant.fileSlug || typeof plant.fileSlug !== 'string') return false;
        return true;
    }

    /**
     * Determine the base path for plant links
     * Returns 'plants/' for root pages, '' for plant pages
     */
    function getBasePath() {
        try {
            const path = window.location.pathname;
            if (typeof path !== 'string') {
                console.error('[PlantsRenderer] Invalid pathname type:', typeof path);
                return 'plants/';
            }
            return path.includes('/plants/') ? '' : 'plants/';
        } catch (error) {
            console.error('[PlantsRenderer] Error in getBasePath:', error);
            return 'plants/';
        }
    }

    /**
     * Common name in the active language. Falls back to the English common name
     * when the translation for the active language is missing.
     */
    function createCommonNamesHTML(plant) {
        try {
            if (!plant) return '';

            const activeLang = (window.I18n && window.I18n.getLang) ? window.I18n.getLang() : 'en';
            const byLang = {
                en: plant.commonName,
                da: plant.danishName,
                fr: plant.frenchName,
            };
            const raw = byLang[activeLang] || plant.commonName;
            if (typeof raw !== 'string' || raw.trim().length === 0) return '';
            return `<p class="common-names">${escapeHtml(raw.trim())}</p>`;
        } catch (error) {
            console.error('[PlantsRenderer] Error in createCommonNamesHTML:', error);
            return '';
        }
    }

    /**
     * Create a single plant card HTML
     */
    function createPlantCardHTML(plant, options = {}) {
        try {
            // Validate plant object
            if (!isValidPlant(plant)) {
                console.error('[PlantsRenderer] Invalid plant object:', plant);
                return '';
            }

            const basePath = options.basePath || getBasePath();

            const commonNames = createCommonNamesHTML(plant);

            // Escape all dynamic content
            const status = plant.status ? escapeHtml(plant.status) : '';
            const botanicalName = escapeHtml(plant.botanicalName);

            const href = escapeHtml(window.I18n ? window.I18n.withLang(basePath + plant.fileSlug + '.html') : basePath + plant.fileSlug + '.html');
            return `
            <div class="plant-card ${status}">
                <h3 class="card-latin"><a href="${href}"><em>${botanicalName}</em></a></h3>
                ${commonNames}
            </div>`;
        } catch (error) {
            console.error('[PlantsRenderer] Error in createPlantCardHTML:', error);
            return '';
        }
    }

    /**
     * Sort plants alphabetically by common name
     */
    function sortPlants(plants) {
        try {
            if (!Array.isArray(plants)) {
                console.error('[PlantsRenderer] plants is not an array in sortPlants:', typeof plants);
                return [];
            }

            return [...plants].sort((a, b) => {
                const nameA = a?.commonName || '';
                const nameB = b?.commonName || '';
                return nameA.localeCompare(nameB);
            });
        } catch (error) {
            console.error('[PlantsRenderer] Error in sortPlants:', error);
            return plants;
        }
    }

    /**
     * Render plant cards into a container
     */
    function renderPlantCards(containerId, options = {}) {
        try {
            // Validate containerId
            if (!containerId || typeof containerId !== 'string') {
                console.error('[PlantsRenderer] Invalid containerId:', containerId);
                return;
            }

            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[PlantsRenderer] Container with id "${escapeHtml(containerId)}" not found`);
                return;
            }

            // Get plants data from global variable (loaded from plants-data.js)
            if (typeof window.PLANTS_DATA === 'undefined') {
                console.error('[PlantsRenderer] PLANTS_DATA not loaded. Make sure plants-data.js is included before plants-renderer.js');
                container.innerHTML = '<p class="error" role="alert">' + escapeHtml((window.I18n ? window.I18n.t('error.loadFailed') : 'Failed to load plant data. Please refresh the page.')) + '</p>';
                return;
            }

            if (!Array.isArray(window.PLANTS_DATA)) {
                console.error('[PlantsRenderer] PLANTS_DATA is not an array:', typeof window.PLANTS_DATA);
                container.innerHTML = '<p class="error" role="alert">' + escapeHtml((window.I18n ? window.I18n.t('error.corrupted') : 'Plant data could not be read.')) + '</p>';
                return;
            }

            const plants = window.PLANTS_DATA;

            // Sort alphabetically
            let filteredPlants = sortPlants(plants);

            // Validate filtered plants
            const validPlants = filteredPlants.filter(plant => isValidPlant(plant));
            if (validPlants.length < filteredPlants.length) {
                console.warn('[PlantsRenderer] Filtered out invalid plants:', filteredPlants.length - validPlants.length);
            }

            if (validPlants.length === 0) {
                container.innerHTML = '<p class="info" role="status">' + escapeHtml((window.I18n ? window.I18n.t('info.noPlants') : 'No plants found.')) + '</p>';
                return;
            }

            // Generate HTML
            const html = validPlants
                .map(plant => createPlantCardHTML(plant, options))
                .filter(Boolean)
                .join('\n            ');

            // Inject into container
            container.innerHTML = html;

            // Call callback if provided
            if (options.onComplete && typeof options.onComplete === 'function') {
                try {
                    options.onComplete(validPlants);
                } catch (callbackError) {
                    console.error('[PlantsRenderer] Error in onComplete callback:', callbackError);
                }
            }
        } catch (error) {
            console.error('[PlantsRenderer] Error rendering plant cards:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<p class="error" role="alert">' + escapeHtml((window.I18n ? window.I18n.t('error.loadFailed') : 'Failed to load plant data. Please refresh the page.')) + '</p>';
            }
        }
    }

    /**
     * Render all plants for the index page
     */
    function renderIndexPage() {
        renderPlantCards('plant-list-container', {
            basePath: 'plants/',
        });
    }

    // Expose public API
    window.PlantsRenderer = {
        renderPlantCards,
        renderIndexPage,
        createPlantCardHTML,
    };

})();
