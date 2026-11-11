/**
 * The plant page (plant.html?p=<fileSlug>)
 * - Names, botanical name, properties and family come from plants-data.js,
 *   shown in the chosen language.
 * - Written text comes from content/<fileSlug>.html, if that file exists.
 *   Each <section data-section="..."> in it fills the matching
 *   [data-content="..."] spot; spots without text show their placeholder.
 * Fixed labels and headings are translated by i18n.js (data-i18n attributes).
 */
(function () {
    'use strict';

    function getSlug() {
        try {
            return new URLSearchParams(window.location.search).get('p') || '';
        } catch (e) {
            return '';
        }
    }

    function findPlant(slug) {
        const data = window.PLANTS_DATA;
        if (!Array.isArray(data) || !slug) return null;
        return data.find(p => p && p.fileSlug === slug) || null;
    }

    function setText(selector, text) {
        const el = document.querySelector(selector);
        if (el && text) el.textContent = text;
    }

    function showNotFound(I18n) {
        const detail = document.querySelector('.plant-detail');
        if (!detail) return;
        detail.innerHTML = '';
        const h1 = document.createElement('h1');
        h1.textContent = I18n.t('plant.notFound');
        detail.appendChild(h1);
        document.title = I18n.t('plant.notFound') + ' - Materia Medica';
    }

    function renderData(I18n, plant) {
        const lang = I18n.getLang();
        const name = ({ en: plant.commonName, da: plant.danishName, fr: plant.frenchName })[lang] || plant.commonName;

        document.title = name + ' - Materia Medica';
        setText('[data-plant="name"]', name);
        setText('[data-plant="botanical"]', plant.botanicalName);
        setText('[data-plant="name-en"]', plant.commonName);
        setText('[data-plant="name-da"]', plant.danishName);
        setText('[data-plant="name-fr"]', plant.frenchName);

        const props = document.querySelector('[data-plant="properties"]');
        if (props) {
            const list = (plant.properties || []).map(I18n.tProperty)
                .sort((a, b) => a.localeCompare(b, lang));
            props.textContent = list.length ? list.join(', ') : I18n.t('plant.noProperties');
        }

        if (plant.family) setText('[data-plant="family"]', I18n.tFamily(plant.family));
    }

    function showPlaceholders(I18n) {
        document.querySelectorAll('[data-content]').forEach(spot => {
            if (spot.childElementCount) return;
            const key = spot.getAttribute('data-placeholder');
            if (!key) return;
            const p = document.createElement('p');
            p.className = 'placeholder';
            p.textContent = I18n.t(key);
            spot.appendChild(p);
        });
    }

    async function renderContent(I18n, slug) {
        try {
            const response = await fetch('content/' + encodeURIComponent(slug) + '.html');
            if (!response.ok) return;  // no written text for this plant yet
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            doc.querySelectorAll('section[data-section]').forEach(section => {
                const name = section.getAttribute('data-section');
                const spot = document.querySelector(`[data-content="${name}"]`);
                if (!spot) {
                    console.warn('[PlantPage] content/' + slug + '.html: unknown section "' + name + '"');
                    return;
                }
                spot.innerHTML = section.innerHTML;
                I18n.applyTranslations(spot);
                const optional = spot.closest('[data-optional]');
                if (optional) optional.hidden = false;
            });
        } catch (e) {
            // Opened as a file (file://) or offline: show placeholders only
        }
    }

    async function render() {
        const I18n = window.I18n;
        if (!I18n) return;
        const slug = getSlug();
        const plant = findPlant(slug);
        if (!plant) {
            showNotFound(I18n);
            return;
        }
        renderData(I18n, plant);
        await renderContent(I18n, slug);
        showPlaceholders(I18n);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
