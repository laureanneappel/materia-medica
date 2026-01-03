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

    /**
     * Get property translations
     */
    function getPropertyTranslations(property) {
        const translations = {
            // Existing translations from your original file
            'Adaptogen': { da: 'Adaptogener', fr: 'Adaptogène' },
            'Adrenal tonic': { da: 'Binyrebarktonic', fr: 'Tonique surrénalien' },
            'Aldose reductase inhibitor': { da: 'Aldosereduktase Hæmmende+andre senskader', fr: 'Inhibiteur d\'aldose réductase' },
            'Analgesic': { da: 'Analgetika', fr: 'Analgésique' },
            'Analgesic (pain relief)': { da: 'Analgetika', fr: 'Analgésique' },
            'Anti-allergic': { da: 'Antiallergiske', fr: 'Anti-allergique' },
            'Antiallergic': { da: 'Antiallergiske', fr: 'Anti-allergique' },
            'Antibacterial': { da: 'Antibakterielle', fr: 'Antibactérien' },
            'Anticoagulant': { da: 'Antikoagulerende', fr: 'Anticoagulant' },
            'Anticonvulsant (epilepsy)': { da: 'Krampeløsende (epilepsi)', fr: 'Anticonvulsivant (épilepsie)' },
            'Antidepressant': { da: 'Antidepressive', fr: 'Antidépresseur' },
            'Antifungal': { da: 'Svampehæmmende', fr: 'Antifongique' },
            'Antiemetic': { da: 'Antiemetika (kvalmestillende)', fr: 'Antiémétique' },
            'Anti-inflammatory (brain)': { da: 'Antiinflammatoriske (hjerne)', fr: 'Anti-inflammatoire (cerveau)' },
            'Anti-inflammatory (cardiovascular)': { da: 'Antiinflammatoriske (kredsløb)', fr: 'Anti-inflammatoire (cardiovasculaire)' },
            'Anti-inflammatory (digestive/mucous membranes/skin)': { da: 'Antiinflammatoriske (mave/tarm +slimhinder/hud)', fr: 'Anti-inflammatoire (digestif/muqueuses/peau)' },
            'Anti-inflammatory (external)': { da: 'Antiinflammatoriske (udvortes)', fr: 'Anti-inflammatoire (externe)' },
            'Anti-inflammatory (female reproductive)': { da: 'Antiinflammatoriske (kvindelige kønsorganer)', fr: 'Anti-inflammatoire (reproducteur féminin)' },
            'Anti-inflammatory (general)': { da: 'Antiinflammatoriske (generelt)', fr: 'Anti-inflammatoire (général)' },
            'Anti-inflammatory (liver)': { da: 'Antiinflammatoriske (lever)', fr: 'Anti-inflammatoire (foie)' },
            'Anti-inflammatory (musculoskeletal)': { da: 'Antiinflammatoriske (bevægapparatet)', fr: 'Anti-inflammatoire (musculo-squelettique)' },
            'Anti-inflammatory (respiratory)': { da: 'Antiinflammatoriske (luftveje)', fr: 'Anti-inflammatoire (respiratoire)' },
            'Anti-inflammatory (urinary)': { da: 'Antiinflammatoriske (urinveje)', fr: 'Anti-inflammatoire (urinaire)' },
            'Antilithic': { da: 'Antilitiske (modvirker stendannelse- forebyggende)', fr: 'Antilithique' },
            'Antimicrobial': { da: 'Antimikrobiske', fr: 'Antimicrobien' },
            'Antioxidant': { da: 'Antioxidante', fr: 'Antioxydant' },
            'Antipruritic (external)': { da: 'Kløestillende (udvortes)', fr: 'Antipruritique (externe)' },
            'Antirheumatic': { da: 'Antireumatiske', fr: 'Antirhumatismal' },
            'Antiseptic (urinary)': { da: 'Antiseptiske i urinvejene', fr: 'Antiseptique (urinaire)' },
            'Antispasmodic': { da: 'Krampeløsnende', fr: 'Antispasmodique' },
            'Anti-ulcer': { da: 'Anti-ulcer (peptisk)', fr: 'Anti-ulcéreux' },
            'Antiviral (external)': { da: 'Antivirale (udvortes)', fr: 'Antiviral (externe)' },
            'Antiviral (internal)': { da: 'Antivirale (indvortes)', fr: 'Antiviral (interne)' },
            'Aphrodisiac': { da: 'Afrodisiakum', fr: 'Aphrodisiaque' },
            'Appetite stimulant': { da: 'Appetitstimulerende', fr: 'Stimulant de l\'appétit' },
            'Astringent': { da: 'Astringerende', fr: 'Astringent' },
            'Bitter tonic': { da: 'Bitter tonics', fr: 'Tonique amer' },
            'Blood pressure lowering': { da: 'Blodtrykssænkende', fr: 'Hypotenseur' },
            'Blood pressure regulating': { da: 'Blodtryksregulerende', fr: 'Régulateur de tension artérielle' },
            'Blood purifier': { da: 'Blodrensende', fr: 'Purificateur de sang' },
            'Blood strengthening': { da: 'Blodstyrkende', fr: 'Fortifiant sanguin' },
            'Blood sugar regulating': { da: 'Blodsukkerregulerende', fr: 'Régulateur de glycémie' },
            'Bronchial spasmolytic': { da: 'Bronkie spasmolytiske (krampeløsnende)', fr: 'Spasmolytique bronchique' },
            'Cardioprotective': { da: 'Hjertebeskyttende', fr: 'Cardioprotecteur' },
            'Carminative': { da: 'Carminative', fr: 'Carminatif' },
            'Cholagogue': { da: 'Galdedrivende', fr: 'Cholagogue' },
            'Choleretic': { da: 'Galdestimulerende', fr: 'Cholérétique' },
            'Cholesterol lowering': { da: 'Kolesterolnedsættende', fr: 'Hypocholestérolémiant' },
            'Circulatory stimulant': { da: 'Kredsløbsstimulerende', fr: 'Stimulant circulatoire' },
            'Connective tissue strengthening': { da: 'Bindevævsstyrkende', fr: 'Renforçant du tissu conjonctif' },
            'Demulcent': { da: 'Emollierende', fr: 'Émollient' },
            'Diaphoretic': { da: 'Sveddrivende', fr: 'Diaphorétique' },
            'Diuretic': { da: 'Vanddrivende', fr: 'Diurétique' },
            'Emmenagogue': { da: 'Menstruationsregulerende', fr: 'Emménagogue' },
            'Emollient': { da: 'Emollierende', fr: 'Émollient' },
            'Estrogen regulating': { da: 'Østrogenregulerende', fr: 'Régulateur d\'œstrogène' },
            'Expectorant': { da: 'Hostemidler (ekspektorente)', fr: 'Expectorant' },
            'Febrifuge': { da: 'Sveddrivende', fr: 'Fébrifuge' },
            'Fibrinolytic': { da: 'Fibrinmodvirkende (protein medvirkende i blodets størkningsproces)', fr: 'Fibrinolytique' },
            'Galactagogue': { da: 'Mælkedrivende (oxytoksin stimulerende)', fr: 'Galactagogue' },
            'Galactofuge': { da: 'Mælkehæmmende', fr: 'Galactofuge' },
            'Healing': { da: 'Helende', fr: 'Cicatrisant' },
            'Heart tonic': { da: 'Hjertetonics', fr: 'Tonique cardiaque' },
            'Hemostatic': { da: 'Blodstillende', fr: 'Hémostatique' },
            'Hepatoprotective': { da: 'Leverbeskyttende', fr: 'Hépatoprotecteur' },
            'Immunomodulating': { da: 'Immunregulerende', fr: 'Immunomodulateur' },
            'Immunosuppressive': { da: 'Immunhæmmende', fr: 'Immunosuppresseur' },
            'Interferon stimulating': { da: 'Interferon fremmende', fr: 'Stimulant d\'interféron' },
            'Kidney tonic': { da: 'Nyretonic', fr: 'Tonique rénal' },
            'Laxative': { da: 'Laxative', fr: 'Laxatif' },
            'Liver regenerating': { da: 'Levercellehelende', fr: 'Régénérant hépatique' },
            'Male tonic': { da: 'Mandetonics', fr: 'Tonique masculin' },
            'Metabolism raising': { da: 'Basalstofskiftet (hæves)', fr: 'Stimulant du métabolisme' },
            'Mucolytic': { da: 'Slimdrivende', fr: 'Mucolytique' },
            'Mucostatic (lower respiratory)': { da: 'Slimhæmmende (nedre luftveje)', fr: 'Mucostatique (voies respiratoires inférieures)' },
            'Mucostatic (upper respiratory)': { da: 'Slimhæmmende (øvre luftveje)', fr: 'Mucostatique (voies respiratoires supérieures)' },
            'Mucous membrane strengthening': { da: 'Slimhindestyrkende', fr: 'Renforçant des muqueuses' },
            'Mucous membrane tonic': { da: 'Slimhindetonic', fr: 'Tonique des muqueuses' },
            'Nerve tonic': { da: 'Nervetonic', fr: 'Tonique nerveux' },
            'Nootropic': { da: 'Nootropiske (hjerneforstærkere)', fr: 'Nootropique' },
            'Prostate growth inhibiting': { da: 'Prostata vækst-hæmmende', fr: 'Inhibiteur de croissance de la prostate' },
            'Sedative': { da: 'Beroligende', fr: 'Sédatif' },
            'Sialagogue': { da: 'Spytdrivende', fr: 'Sialagogue' },
            'Tonic': { da: 'Tonics', fr: 'Tonique' },
            'Urinary antiseptic': { da: 'Antiseptiske i urinvejene', fr: 'Antiseptique urinaire' },
            'Uterine contracting': { da: 'Livmodersammentrækkende', fr: 'Contractant utérin' },
            'Uterine tonic': { da: 'Livmodertonics', fr: 'Tonique utérin' },
            'Vasodilator': { da: 'Blodkarudvidende', fr: 'Vasodilatateur' },
            'Venotonic': { da: 'Venestyrkende', fr: 'Veinotonique' },
            'Vulnerary': { da: 'Helende', fr: 'Vulnéraire' },
            'Weight reducing': { da: 'Vægtreducerende', fr: 'Amaigrissant' },
            'Woman tonic': { da: 'Kvindetonics', fr: 'Tonique féminin' }
        };

        return translations[property] || { da: '', fr: '' };
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

        let html = `<tr>`;
        html += `<td class="property-name">`;
        html += `<div class="prop-main">${propName}</div>`;

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
        html += `<td class="plant-list">`;

        // Sort plants alphabetically
        plants.sort((a, b) => a.commonName.localeCompare(b.commonName));
        plants.forEach(plant => {
            html += renderPlantEntry(plant);
        });

        html += `</td>`;
        html += `</tr>`;
        return html;
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
