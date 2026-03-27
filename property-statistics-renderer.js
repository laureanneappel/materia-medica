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

    // Danish translations derived from DANISH-TO-ENGLISH-PROPERTIES.json (inverted).
    // DA values always reflect the exact term used in egenskaber.pdf.
    const ENGLISH_TO_DANISH = {};
    (function buildDanishMap() {
        const danishToEnglish = window.DANISH_TO_ENGLISH_PROPERTIES;
        if (!danishToEnglish) {
            console.warn('[PropertyStats] DANISH_TO_ENGLISH_PROPERTIES not loaded — Danish labels will be empty');
            return;
        }
        for (const [da, en] of Object.entries(danishToEnglish)) {
            ENGLISH_TO_DANISH[en] = da;
        }
    })();

    /**
     * Get property translations
     */
    function getPropertyTranslations(property) {
        const frTranslations = {
            'Adaptogen': 'Adaptogène',
            'Adrenal tonic': 'Tonique surrénalien',
            'Aldose reductase inhibitor': 'Inhibiteur d\'aldose réductase',
            'Analgesic': 'Analgésique',
            'Analgesic (pain relief)': 'Analgésique',
            'Anti-allergic': 'Anti-allergique',
            'Antiallergic': 'Anti-allergique',
            'Antacid': 'Antiacide',
            'Antibacterial': 'Antibactérien',
            'Anticancer': 'Anticancéreux',
            'Anticoagulant': 'Anticoagulant',
            'Anticonvulsant (epilepsy)': 'Anticonvulsivant (épilepsie)',
            'Antidepressant': 'Antidépresseur',
            'Antiemetic': 'Antiémétique',
            'Antifungal': 'Antifongique',
            'Anti-inflammatory': 'Anti-inflammatoire',
            'Anti-inflammatory (brain)': 'Anti-inflammatoire (cerveau)',
            'Anti-inflammatory (cardiovascular)': 'Anti-inflammatoire (cardiovasculaire)',
            'Anti-inflammatory (digestive/mucous membranes/skin)': 'Anti-inflammatoire (digestif/muqueuses/peau)',
            'Anti-inflammatory (external)': 'Anti-inflammatoire (externe)',
            'Anti-inflammatory (female reproductive)': 'Anti-inflammatoire (reproducteur féminin)',
            'Anti-inflammatory (general)': 'Anti-inflammatoire (général)',
            'Anti-inflammatory (liver)': 'Anti-inflammatoire (foie)',
            'Anti-inflammatory (musculoskeletal)': 'Anti-inflammatoire (musculo-squelettique)',
            'Anti-inflammatory (respiratory)': 'Anti-inflammatoire (respiratoire)',
            'Anti-inflammatory (urinary)': 'Anti-inflammatoire (urinaire)',
            'Antilithic': 'Antilithique',
            'Antimicrobial': 'Antimicrobien',
            'Antioxidant': 'Antioxydant',
            'Antiparasitic': 'Antiparasitaire',
            'Antiperspirant': 'Antiperspirant',
            'Antipruritic (external)': 'Antipruritique (externe)',
            'Antirheumatic': 'Antirhumatismal',
            'Antiarrhythmic': 'Antiarythmique',
            'Antiseptic (urinary)': 'Antiseptique (urinaire)',
            'Antispasmodic': 'Antispasmodique',
            'Anti-ulcer': 'Anti-ulcéreux',
            'Antiviral': 'Antiviral',
            'Antiviral (external)': 'Antiviral (externe)',
            'Antiviral (internal)': 'Antiviral (interne)',
            'Aphrodisiac': 'Aphrodisiaque',
            'Appetite stimulant': 'Stimulant de l\'appétit',
            'Astringent': 'Astringent',
            'Bitter tonic': 'Tonique amer',
            'Bladder tonic': 'Tonique vésical',
            'Blood pressure lowering': 'Hypotenseur',
            'Blood pressure raising': 'Hypertenseur',
            'Blood pressure regulating': 'Régulateur de tension artérielle',
            'Blood purifier': 'Purificateur de sang',
            'Blood strengthening': 'Fortifiant sanguin',
            'Blood sugar regulating': 'Régulateur de glycémie',
            'Bronchial spasmolytic': 'Spasmolytique bronchique',
            'Cardioprotective': 'Cardioprotecteur',
            'Carminative': 'Carminatif',
            'Cholagogue': 'Cholagogue',
            'Choleretic': 'Cholérétique',
            'Cholesterol lowering': 'Hypocholestérolémiant',
            'Circulatory stimulant': 'Stimulant circulatoire',
            'Connective tissue strengthening': 'Renforçant du tissu conjonctif',
            'Demulcent': 'Émollient',
            'Diaphoretic': 'Diaphorétique',
            'Diuretic': 'Diurétique',
            'Emmenagogue': 'Emménagogue',
            'Emollient': 'Émollient',
            'Estrogen regulating': 'Régulateur d\'œstrogène',
            'Expectorant': 'Expectorant',
            'Febrifuge': 'Fébrifuge',
            'Fibrinolytic': 'Fibrinolytique',
            'Galactagogue': 'Galactagogue',
            'Galactofuge': 'Galactofuge',
            'Healing': 'Cicatrisant',
            'Heart tonic': 'Tonique cardiaque',
            'Hemostatic': 'Hémostatique',
            'Hepatoprotective': 'Hépatoprotecteur',
            'Hypnotic': 'Hypnotique',
            'Immunomodulating': 'Immunomodulateur',
            'Immunosuppressive': 'Immunosuppresseur',
            'Interferon stimulating': 'Stimulant d\'interféron',
            'Kidney tonic': 'Tonique rénal',
            'Laxative': 'Laxatif',
            'Liver regenerating': 'Régénérant hépatique',
            'Lymphatic stimulant': 'Stimulant lymphatique',
            'Male tonic': 'Tonique masculin',
            'Metabolism raising': 'Stimulant du métabolisme',
            'Mucolytic': 'Mucolytique',
            'Mucostatic (lower respiratory)': 'Mucostatique (voies respiratoires inférieures)',
            'Mucostatic (upper respiratory)': 'Mucostatique (voies respiratoires supérieures)',
            'Mucous membrane strengthening': 'Renforçant des muqueuses',
            'Mucous membrane tonic': 'Tonique des muqueuses',
            'Nerve tonic': 'Tonique nerveux',
            'Nootropic': 'Nootropique',
            'Nutritive': 'Nutritif',
            'Progesterone effect': 'Effet progestéronique',
            'Prolactin inhibiting': 'Inhibiteur de prolactine',
            'Prostate growth inhibiting': 'Inhibiteur de croissance de la prostate',
            'Sedative': 'Sédatif',
            'Sialagogue': 'Sialagogue',
            'Tonic': 'Tonique',
            'Urinary antiseptic': 'Antiseptique urinaire',
            'Uterine contracting': 'Contractant utérin',
            'Uterine relaxant': 'Relaxant utérin',
            'Uterine tonic': 'Tonique utérin',
            'Vasodilator': 'Vasodilatateur',
            'Venotonic': 'Veinotonique',
            'Vulnerary': 'Vulnéraire',
            'Warming': 'Réchauffant',
            'Weight reducing': 'Amaigrissant',
            'Woman tonic': 'Tonique féminin'
        };

        return {
            da: ENGLISH_TO_DANISH[property] || '',
            fr: frTranslations[property] || ''
        };
    }

    /**
     * Render plant entry for property table
     */
    function renderPlantEntry(plant) {
        const commonName = escapeHtml(plant.commonName);
        const botanicalName = escapeHtml(plant.botanicalName);
        const fileSlug = escapeHtml(plant.fileSlug);
        const danishName = plant.danishName ? escapeHtml(plant.danishName) : '';
        const frenchName = plant.frenchName ? escapeHtml(plant.frenchName) : '';

        let html = `<div class="plant-entry">`;
        html += `<div class="plant-main"><a href="plants/${fileSlug}.html">${commonName}</a></div>`;
        html += `<div class="plant-botanical"><em>${botanicalName}</em></div>`;

        if (danishName || frenchName) {
            html += `<div class="plant-translations">`;
            if (danishName) {
                html += `<span class="plant-trans"><span class="lang-label">DA:</span> ${danishName}</span>`;
            }
            if (frenchName) {
                html += `<span class="plant-trans"><span class="lang-label">FR:</span> ${frenchName}</span>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render property row
     */
    function renderPropertyRow(property, plants) {
        const translations = getPropertyTranslations(property);
        const propName = escapeHtml(property);
        const count = plants.length;

        let html = `<tr class="property-row" data-expanded="false" role="button" tabindex="0" aria-expanded="false">`;
        html += `<td class="property-name">`;
        html += `<div class="prop-main">`;
        html += `<span class="accordion-arrow" aria-hidden="true">▶</span>`;
        html += `${propName}`;
        html += `</div>`;

        if (translations.da || translations.fr) {
            html += `<div class="prop-translations">`;
            if (translations.da) {
                html += `<span class="prop-trans"><span class="lang-label">DA:</span> ${escapeHtml(translations.da)}</span>`;
            }
            if (translations.fr) {
                html += `<span class="prop-trans"><span class="lang-label">FR:</span> ${escapeHtml(translations.fr)}</span>`;
            }
            html += `</div>`;
        }

        html += `</td>`;
        html += `<td class="plant-count">${count}</td>`;
        html += `<td class="plant-list-cell">`;
        html += `<div class="accordion-content">`;

        // Sort plants alphabetically
        plants.sort((a, b) => a.commonName.localeCompare(b.commonName));
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

        return `
            <div class="stats-summary">
                <div class="stat-box">
                    <div class="stat-number">${uniqueProperties}</div>
                    <div class="stat-label">Unique Properties</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${plantsWithProperties}</div>
                    <div class="stat-label">Plants with Properties</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${totalPlants}</div>
                    <div class="stat-label">Total Plants</div>
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

            // Sort properties alphabetically
            const sortedProperties = Array.from(propertyMap.keys()).sort();

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
                    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 60px 20px;"><div class="loading-spinner" style="margin: 0 auto;"></div><p style="margin-top: 20px; color: var(--color-secondary); font-style: italic;">Loading properties...</p></td></tr>';
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
