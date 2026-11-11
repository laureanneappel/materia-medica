/**
 * Property Statistics Renderer
 * Dynamically generates property statistics from plants-data.js
 */

(function() {
    'use strict';

    // Import utilities
    const { escapeHtml } = window.Utils || {};

    /**
     * Collect all properties from plants data
     * Returns a map of property -> array of plants
     */
    function collectProperties() {
        const propertyMap = new Map();

        if (!window.PLANTS_DATA || !Array.isArray(window.PLANTS_DATA)) {
            console.error('[PropertyStats] PLANTS_DATA not found or invalid');
            return propertyMap;
        }

        window.PLANTS_DATA.forEach(plant => {
            // Skip disabled plants
            if (plant.status === 'disabled') {
                return;
            }

            if (!plant.properties || !Array.isArray(plant.properties)) {
                return;
            }

            plant.properties.forEach(property => {
                if (!propertyMap.has(property)) {
                    propertyMap.set(property, []);
                }
                propertyMap.get(property).push(plant);
            });
        });

        return propertyMap;
    }

    function activeLang() {
        return (window.I18n && window.I18n.getLang) ? window.I18n.getLang() : 'en';
    }

    /**
     * Plant's display name in the active language, falling back to English commonName.
     */
    function plantDisplayName(plant) {
        const lang = activeLang();
        const byLang = {
            en: plant.commonName,
            da: plant.danishName,
            fr: plant.frenchName,
        };
        return (byLang[lang] && byLang[lang].trim()) || plant.commonName;
    }

    /**
     * Render plant entry for property table — shows the name in the active language,
     * with the Latin name underneath.
     */
    function renderPlantEntry(plant) {
        const displayName = escapeHtml(plantDisplayName(plant));
        const botanicalName = escapeHtml(plant.botanicalName);
        const slug = plant.fileSlug;
        const url = window.Utils.plantUrl(slug);
        const href = escapeHtml(window.I18n ? window.I18n.withLang(url) : url);

        return `<div class="plant-entry">
            <div class="plant-main"><a href="${href}">${displayName}</a></div>
            <div class="plant-botanical"><em>${botanicalName}</em></div>
        </div>`;
    }

    /**
     * Render property row — displays the property name in the active language only.
     */
    function renderPropertyRow(property, plants) {
        const I18n = window.I18n;
        const displayProp = escapeHtml(I18n ? I18n.tProperty(property) : property);
        const count = plants.length;

        let html = `<tr class="property-row" data-expanded="true" role="button" tabindex="0" aria-expanded="true">`;
        html += `<td class="property-name">`;
        html += `<div class="prop-main">`;
        html += `<span class="accordion-arrow" aria-hidden="true">▶</span>`;
        html += `${displayProp}`;
        html += `</div>`;
        html += `</td>`;
        html += `<td class="plant-count">${count}</td>`;
        html += `<td class="plant-list-cell">`;
        html += `<div class="accordion-content">`;

        // Sort plants alphabetically by their display name in the active language
        plants.sort((a, b) => plantDisplayName(a).localeCompare(plantDisplayName(b)));
        plants.forEach(plant => {
            html += renderPlantEntry(plant);
        });

        html += `</div>`;
        html += `</td>`;
        html += `</tr>`;
        return html;
    }

    /**
     * Set up accordion click handlers
     */
    function setupAccordion() {
        const tbody = document.querySelector('#property-table tbody');
        if (!tbody) return;

        tbody.addEventListener('click', function(e) {
            const row = e.target.closest('.property-row');
            if (!row) return;
            toggleRow(row);
        });

        tbody.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const row = e.target.closest('.property-row');
                if (!row) return;
                e.preventDefault();
                toggleRow(row);
            }
        });
    }

    function toggleRow(row) {
        const expanded = row.getAttribute('data-expanded') === 'true';
        row.setAttribute('data-expanded', String(!expanded));
        row.setAttribute('aria-expanded', String(!expanded));
    }

    /**
     * Render statistics summary
     */
    function renderStatsSummary(propertyMap, totalPlants, plantsWithProperties) {
        const uniqueProperties = propertyMap.size;
        const I18n = window.I18n;
        const labelUnique = escapeHtml(I18n ? I18n.t('props.stats.unique') : 'Unique Properties');
        const labelWith = escapeHtml(I18n ? I18n.t('props.stats.withProps') : 'Plants with Properties');
        const labelTotal = escapeHtml(I18n ? I18n.t('props.stats.total') : 'Total Plants');

        return `
            <div class="stats-summary">
                <div class="stat-box">
                    <div class="stat-number">${uniqueProperties}</div>
                    <div class="stat-label">${labelUnique}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${plantsWithProperties}</div>
                    <div class="stat-label">${labelWith}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${totalPlants}</div>
                    <div class="stat-label">${labelTotal}</div>
                </div>
            </div>`;
    }

    /**
     * Render the entire property statistics page
     */
    function renderPropertyStatistics() {
        try {
            const propertyMap = collectProperties();

            // Calculate statistics
            const totalPlants = window.PLANTS_DATA ? window.PLANTS_DATA.length : 0;
            const plantsWithProperties = window.PLANTS_DATA ?
                window.PLANTS_DATA.filter(p => p.status !== 'disabled' && p.properties && p.properties.length > 0).length : 0;

            // Update stats summary
            const statsContainer = document.querySelector('.stats-summary');
            if (statsContainer) {
                statsContainer.outerHTML = renderStatsSummary(propertyMap, totalPlants, plantsWithProperties);
            }

            // Render property table
            const tbody = document.querySelector('#property-table tbody');
            if (!tbody) {
                console.error('[PropertyStats] Table tbody not found');
                return;
            }

            // Sort properties alphabetically by their translated label
            const I18n = window.I18n;
            const sortedProperties = Array.from(propertyMap.keys()).sort((a, b) => {
                const la = I18n ? I18n.tProperty(a) : a;
                const lb = I18n ? I18n.tProperty(b) : b;
                return la.localeCompare(lb);
            });

            let html = '';
            sortedProperties.forEach(property => {
                const plants = propertyMap.get(property);
                html += renderPropertyRow(property, plants);
            });

            tbody.innerHTML = html;
            setupAccordion();

            console.log('[PropertyStats] Rendered', sortedProperties.length, 'properties');
        } catch (error) {
            console.error('[PropertyStats] Error rendering:', error);
        }
    }

    // Export to global scope
    window.PropertyStatsRenderer = {
        render: renderPropertyStatistics
    };

    // Auto-render when DOM is ready (if on property statistics page)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('property-table')) {
                // Show loading state briefly
                const tbody = document.querySelector('#property-table tbody');
                if (tbody) {
                    const loadingMsg = window.I18n ? window.I18n.t('props.loading') : 'Loading properties...';
                    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 60px 20px;"><div class="loading-spinner" style="margin: 0 auto;"></div><p style="margin-top: 20px; color: var(--color-secondary); font-style: italic;">${escapeHtml(loadingMsg)}</p></td></tr>`;
                }

                setTimeout(() => {
                    renderPropertyStatistics();
                }, 50);
            }
        });
    } else {
        if (document.getElementById('property-table')) {
            renderPropertyStatistics();
        }
    }

})();
