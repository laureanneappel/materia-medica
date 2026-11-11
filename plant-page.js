/**
 * Plant detail pages (plants/*.html)
 * Fills in the language-dependent parts of the page from plants-data.js:
 * page title, plant name, properties and family.
 * Fixed labels and headings are translated by i18n.js through data-i18n attributes.
 * Text written directly in the page (habitat notes, side effects...) is left as written.
 */
(function () {
    'use strict';

    function findPlant() {
        const data = window.PLANTS_DATA;
        if (!Array.isArray(data)) return null;
        const file = decodeURIComponent(window.location.pathname.split('/').pop() || '');
        const slug = file.replace(/\.html?$/i, '');
        return data.find(p => p && p.fileSlug === slug) || null;
    }

    function render() {
        const I18n = window.I18n;
        const plant = findPlant();
        if (!I18n || !plant) return;

        const lang = I18n.getLang();
        const name = ({ en: plant.commonName, da: plant.danishName, fr: plant.frenchName })[lang] || plant.commonName;

        document.title = name + ' - Materia Medica';

        const h1 = document.querySelector('[data-plant="name"]');
        if (h1) h1.textContent = name;

        [['name-en', plant.commonName], ['name-da', plant.danishName], ['name-fr', plant.frenchName]]
            .forEach(([key, value]) => {
                const el = document.querySelector(`[data-plant="${key}"]`);
                if (el && value) el.textContent = value;
            });

        const props = document.querySelector('[data-plant="properties"]');
        if (props) {
            const list = (plant.properties || []).map(I18n.tProperty)
                .sort((a, b) => a.localeCompare(b, lang));
            props.textContent = list.length ? list.join(', ') : I18n.t('plant.noProperties');
        }

        const family = document.querySelector('[data-plant="family"]');
        if (family && plant.family) family.textContent = I18n.tFamily(plant.family);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
