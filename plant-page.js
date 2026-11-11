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

        // Properties and family link to the plant list, filtered to plants that share them
        const listLink = (param, value, label) => {
            const a = document.createElement('a');
            a.href = I18n.withLang('index.html?' + param + '=' + encodeURIComponent(value));
            a.textContent = label;
            return a;
        };

        const props = document.querySelector('[data-plant="properties"]');
        if (props) {
            const list = (plant.properties || [])
                .map(p => ({ value: p, label: I18n.tProperty(p) }))
                .sort((a, b) => a.label.localeCompare(b.label, lang));
            props.textContent = '';
            if (!list.length) props.textContent = I18n.t('plant.noProperties');
            list.forEach((p, i) => {
                if (i) props.append(', ');
                props.append(listLink('property', p.value, p.label));
            });
        }

        const family = document.querySelector('[data-plant="family"]');
        if (family && plant.family) {
            family.textContent = '';
            family.append(listLink('family', plant.family.split(' (')[0], I18n.tFamily(plant.family)));
        }
    }

    // Viewing the site on your own computer (not the published site)
    function isLocal() {
        const host = window.location.hostname;
        return window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '';
    }

    // Parts without written text: on your own computer they show an [Add ... here]
    // reminder; on the published site they are hidden, with their heading.
    function handleEmptySpots(I18n) {
        const local = isLocal();
        document.querySelectorAll('[data-content]').forEach(spot => {
            if (spot.childElementCount) return;
            if (local) {
                const key = spot.getAttribute('data-placeholder');
                if (!key) return;
                const p = document.createElement('p');
                p.className = 'placeholder';
                p.textContent = I18n.t(key);
                spot.appendChild(p);
                return;
            }
            spot.hidden = true;
            const heading = spot.previousElementSibling;
            if (heading && heading.tagName === 'H3') heading.hidden = true;
        });

        if (local) return;
        // Hide a whole section when nothing in it is left to show
        document.querySelectorAll('.plant-detail .section').forEach(section => {
            const visible = [...section.children].some(el => el.tagName !== 'H2' && !el.hidden);
            if (!visible) section.hidden = true;
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
        handleEmptySpots(I18n);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
