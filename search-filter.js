/**
 * Search and Filter Functionality
 * Enables searching plants by name and filtering by properties
 */

(function() {
    'use strict';

    // Import utilities from shared utils.js
    const { escapeHtml, logError, logWarn, isValidArray } = window.Utils || {};

    // Validate that utils.js is loaded
    if (!window.Utils) {
        console.error('[SearchFilter] utils.js not loaded! Search and filter functionality may not work correctly.');
    }

    let allPlants = [];
    let currentFilters = {
        searchText: '',
        properties: [],
        family: ''
    };

    /**
     * Display error message to user
     */
    function showError(message) {
        const container = document.getElementById('plant-list-container');
        if (container) {
            container.innerHTML = '<div class="error-message" role="alert">' + escapeHtml(message) + '</div>';
        }
    }

    /**
     * Display info message to user
     */
    function showInfo(message) {
        const container = document.getElementById('plant-list-container');
        if (container) {
            container.innerHTML = '<div class="info-message" role="status">' + escapeHtml(message) + '</div>';
        }
    }

    /**
     * Initialize search and filter functionality
     */
    function init() {
        // Store all plants data with validation
        if (typeof window.PLANTS_DATA === 'undefined') {
            console.error('[SearchFilter] PLANTS_DATA not loaded');
            showError((window.I18n ? window.I18n.t('error.loadFailed') : 'Failed to load plant data. Please refresh the page.'));
            return;
        }

        if (!Array.isArray(window.PLANTS_DATA)) {
            console.error('[SearchFilter] PLANTS_DATA is not an array');
            showError((window.I18n ? window.I18n.t('error.corrupted') : 'Plant data could not be read.'));
            return;
        }

        if (window.PLANTS_DATA.length === 0) {
            console.warn('[SearchFilter] PLANTS_DATA is empty');
            showInfo((window.I18n ? window.I18n.t('info.noPlants') : 'No plants found.'));
            return;
        }

        allPlants = window.PLANTS_DATA;

        // Validate data structure
        const invalidPlants = allPlants.filter(plant =>
            !plant.commonName || !plant.botanicalName
        );

        if (invalidPlants.length > 0) {
            console.error('[SearchFilter] Found invalid plant entries:', invalidPlants);
        }

        // Set up event listeners
        setupSearchInput();
        setupPropertyFilters();
        setupFamilyFilter();
    }

    /**
     * Set up search input listener
     */
    function setupSearchInput() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        // Debounce search to avoid excessive filtering
        let debounceTimer;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentFilters.searchText = e.target.value.toLowerCase().trim();
                applyFilters();
            }, 300);
        });
    }

    /**
     * Set up property filter listeners
     */
    function setupPropertyFilters() {
        const propertySelect = document.getElementById('property-filter');
        if (!propertySelect) return;

        // The field shows translated labels; propertyByLabel maps them back to the stored names
        const pick = function(e) {
            const typed = e.target.value.trim().toLowerCase();
            const selectedProperty = propertyByLabel.get(typed);
            if (!selectedProperty) return;
            if (!currentFilters.properties.includes(selectedProperty)) addPropertyFilter(selectedProperty);
            e.target.value = '';
        };
        propertySelect.addEventListener('change', pick);
        propertySelect.addEventListener('input', function(e) {
            // Choosing a suggestion fills in the exact label: apply it right away
            if (propertyByLabel.has(e.target.value.trim().toLowerCase())) pick(e);
        });
    }

    /**
     * Add a property to active filters
     */
    function addPropertyFilter(property) {
        currentFilters.properties.push(property);
        updateActiveFiltersDisplay();
        applyFilters();
    }

    /**
     * Remove a property from active filters
     */
    function removePropertyFilter(property) {
        currentFilters.properties = currentFilters.properties.filter(p => p !== property);
        updateActiveFiltersDisplay();
        applyFilters();
    }

    /**
     * Clear all filters
     */
    function clearAllFilters() {
        currentFilters.searchText = '';
        currentFilters.properties = [];
        currentFilters.family = '';

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        const familySelect = document.getElementById('family-filter');
        if (familySelect) familySelect.value = '';

        updateActiveFiltersDisplay();
        applyFilters();
    }

    /**
     * Update the display of active property filters
     */
    function updateActiveFiltersDisplay() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        if (currentFilters.properties.length === 0) {
            container.innerHTML = '';
            return;
        }

        const I18n = window.I18n;
        const filterTags = currentFilters.properties.map(prop => {
            const escapedProp = escapeHtml(prop);
            const name = I18n ? I18n.tProperty(prop) : prop;
            const label = escapeHtml(name);
            const removeLabel = escapeHtml(I18n ? I18n.format(I18n.t('filter.remove'), { label: name }) : 'Remove ' + name + ' filter');
            return `
                <span class="filter-tag">
                    ${label}
                    <button class="remove-filter" data-property="${escapedProp}" aria-label="${removeLabel}">×</button>
                </span>
            `;
        }).join('');

        const clearAllLabel = escapeHtml(I18n ? I18n.t('filter.clearAll') : 'Clear All');
        container.innerHTML = `
            <div class="active-filters-wrapper">
                ${filterTags}
                <button class="clear-all-filters" id="clear-filters-btn">${clearAllLabel}</button>
            </div>
        `;

        // Use event delegation instead of individual listeners
        setupFilterTagListeners();
    }

    /**
     * Setup event listeners for filter tags using event delegation
     */
    function setupFilterTagListeners() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        // Remove old listener if exists
        if (container._filterClickHandler) {
            container.removeEventListener('click', container._filterClickHandler);
        }

        // Add single delegated listener
        container._filterClickHandler = function(e) {
            if (e.target.classList.contains('remove-filter')) {
                const property = e.target.dataset.property;
                if (property) {
                    removePropertyFilter(property);
                }
            } else if (e.target.classList.contains('clear-all-filters') || e.target.id === 'clear-filters-btn') {
                clearAllFilters();
            }
        };

        container.addEventListener('click', container._filterClickHandler);
    }

    /**
     * Set up family filter listener
     */
    function setupFamilyFilter() {
        const familySelect = document.getElementById('family-filter');
        if (!familySelect) return;

        familySelect.addEventListener('change', function(e) {
            currentFilters.family = e.target.value;
            applyFilters();
        });
    }

    /**
     * Filter plants based on current filters
     */
    function filterPlants(plants) {
        let filtered = [...plants];

        // Apply search text filter (searches common name, botanical name, and danish/french names)
        if (currentFilters.searchText) {
            filtered = filtered.filter(plant => {
                const searchText = currentFilters.searchText;
                return (
                    plant.commonName.toLowerCase().includes(searchText) ||
                    plant.botanicalName.toLowerCase().includes(searchText) ||
                    (plant.danishName && plant.danishName.toLowerCase().includes(searchText)) ||
                    (plant.frenchName && plant.frenchName.toLowerCase().includes(searchText))
                );
            });
        }

        // Apply property filters (plant must have ALL selected properties)
        if (currentFilters.properties.length > 0) {
            filtered = filtered.filter(plant => {
                if (!plant.properties || plant.properties.length === 0) return false;

                return currentFilters.properties.every(filterProp =>
                    plant.properties.some(plantProp => plantProp === filterProp)
                );
            });
        }

        // Apply family filter
        if (currentFilters.family) {
            filtered = filtered.filter(plant => {
                return plant.family && plant.family === currentFilters.family;
            });
        }

        return filtered;
    }

    /**
     * Apply current filters and re-render plants
     */
    function applyFilters() {
        const filtered = filterPlants(allPlants);
        renderFilteredPlants(filtered);
        updateResultsCount(filtered.length);
    }

    /**
     * Render filtered plants
     */
    function renderFilteredPlants(plants) {
        const container = document.getElementById('plant-list-container');
        if (!container) return;

        if (plants.length === 0) {
            const I18n = window.I18n;
            const msg = escapeHtml(I18n ? I18n.t('results.empty') : 'No plants found matching your criteria.');
            container.innerHTML = `<p class="no-results">${msg}</p>`;
            return;
        }

        // Sort by botanical name, the card title
        const sorted = window.PlantsRenderer && window.PlantsRenderer.sortPlants
            ? window.PlantsRenderer.sortPlants(plants)
            : [...plants].sort((a, b) => a.botanicalName.localeCompare(b.botanicalName));

        // Use PlantsRenderer to create cards if available
        if (window.PlantsRenderer && window.PlantsRenderer.createPlantCardHTML) {
            const html = sorted.map(plant =>
                window.PlantsRenderer.createPlantCardHTML(plant)
            ).filter(Boolean).join('\n');
            container.innerHTML = html;
        } else {
            // Fallback rendering if PlantsRenderer is not available
            console.warn('[SearchFilter] PlantsRenderer not available, using fallback rendering');
            const html = sorted.map(plant => {
                return `
                    <div class="plant-card ${escapeHtml(plant.status || '')}">
                        <h3><a href="${escapeHtml(window.Utils.plantUrl(plant.fileSlug))}">${escapeHtml(plant.commonName)}</a></h3>
                        <p class="botanical-name">${escapeHtml(plant.botanicalName)}</p>
                    </div>`;
            }).join('\n');
            container.innerHTML = html;
        }
    }

    /**
     * Update the results count display
     */
    function updateResultsCount(count) {
        const countElement = document.getElementById('results-count');
        if (!countElement) return;

        const total = allPlants.length;
        const I18n = window.I18n;
        if (count === total) {
            countElement.textContent = I18n
                ? I18n.format(I18n.t('results.allCount'), { count: total })
                : `Showing all ${total} plants`;
        } else {
            countElement.textContent = I18n
                ? I18n.format(I18n.t('results.partial'), { count, total })
                : `Showing ${count} of ${total} plants`;
        }
    }

    /**
     * Populate property dropdown with all available properties (with validation and sanitization)
     */
    // Translated property label (lower case) -> property name in plants-data.js
    let propertyByLabel = new Map();

    function populatePropertyDropdown() {
        const select = document.getElementById('property-filter');
        if (!select) return;

        const I18n = window.I18n;

        // Get all unique properties from plants with validation
        const allProperties = new Set();
        allPlants.forEach(plant => {
            if (plant.properties && Array.isArray(plant.properties)) {
                plant.properties.forEach(prop => {
                    if (typeof prop === 'string' && prop.trim().length > 0 && prop.length < 200) {
                        allProperties.add(prop.trim());
                    }
                });
            }
        });

        // Pair each English property with its translated label, then sort by the label
        const pairs = Array.from(allProperties).map(prop => ({
            value: prop,
            label: I18n ? I18n.tProperty(prop) : prop,
        }));
        pairs.sort((a, b) => a.label.localeCompare(b.label));

        propertyByLabel = new Map(pairs.map(({ value, label }) => [label.toLowerCase(), value]));
        const list = document.getElementById('property-options');
        if (list) {
            list.innerHTML = pairs.map(({ label }) => `<option value="${escapeHtml(label)}"></option>`).join('');
        }
    }

    /**
     * Populate family dropdown with all available botanical families (with validation and sanitization)
     */
    function populateFamilyDropdown() {
        const select = document.getElementById('family-filter');
        if (!select) return;

        const I18n = window.I18n;

        // Get all unique families from plants with validation
        const allFamilies = new Set();
        allPlants.forEach(plant => {
            if (plant.family && typeof plant.family === 'string') {
                const family = plant.family.trim();
                if (family.length > 0 && family.length < 200) {
                    allFamilies.add(family);
                }
            }
        });

        const pairs = Array.from(allFamilies).map(family => ({
            value: family,
            label: I18n ? I18n.tFamily(family) : family,
        }));
        pairs.sort((a, b) => a.label.localeCompare(b.label));

        const options = pairs.map(({ value, label }) =>
            `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
        ).join('');

        const placeholder = escapeHtml(I18n ? I18n.t('filter.family.placeholder') : 'Select a family...');
        select.innerHTML = `<option value="">${placeholder}</option>${options}`;
    }

    /**
     * Apply filters given in the address, e.g. index.html?property=Astringent or ?family=Rosaceae
     * (used by the links on the plant page). Call after the dropdowns are filled.
     */
    function applyFiltersFromUrl() {
        let params;
        try {
            params = new URLSearchParams(window.location.search);
        } catch (e) {
            return;
        }
        const known = new Set(allPlants.flatMap(p => p.properties || []));
        params.getAll('property').forEach(prop => {
            if (known.has(prop) && !currentFilters.properties.includes(prop)) currentFilters.properties.push(prop);
        });
        const family = params.get('family');
        if (family) {
            const match = allPlants.find(p => p.family && (p.family === family || p.family.split(' (')[0] === family));
            if (match) {
                currentFilters.family = match.family;
                const select = document.getElementById('family-filter');
                if (select) select.value = match.family;
            }
        }
        if (currentFilters.properties.length || currentFilters.family) {
            updateActiveFiltersDisplay();
            applyFilters();
        }
    }

    // Expose public API
    window.SearchFilter = {
        init,
        applyFiltersFromUrl,
        clearAllFilters,
        populatePropertyDropdown,
        populateFamilyDropdown
    };

})();
