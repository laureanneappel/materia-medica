/**
 * The plant page (plant.html?p=<fileSlug>)
 * - Names, botanical name, properties and family come from plants-data.js,
 *   shown in the chosen language.
 * - Written text comes from content/<fileSlug>.html, if that file exists.
 *   Each <section data-section="..."> in it fills the matching
 *   [data-content="..."] spot. Spots without text are hidden, except that on
 *   your own computer the ones with a placeholder show an [Add ... here] reminder.
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

        // Properties as tags
        const props = document.querySelector('[data-plant="properties"]');
        if (props) {
            const list = (plant.properties || [])
                .map(p => ({ value: p, label: I18n.tProperty(p) }))
                .sort((a, b) => a.label.localeCompare(b.label, lang));
            props.textContent = '';
            setText('[data-plant="property-count"]', list.length ? '(' + list.length + ')' : '');
            if (!list.length) props.textContent = I18n.t('plant.noProperties');
            // Notes the PDF adds for this plant, e.g. "kun udvortes" (pdf-notes.js)
            const notes = ((window.PDF_NOTES || {}).plants || {})[plant.botanicalName] || {};
            list.forEach(p => {
                const tag = listLink('property', p.value, p.label);
                tag.className = 'tag';
                const note = notes[p.value];
                if (note) {
                    const small = document.createElement('span');
                    small.className = 'tag-note';
                    small.textContent = note[lang] || note.da;
                    tag.append(small);
                    tag.title = p.label + ' (' + (note[lang] || note.da) + ')';
                }
                props.append(tag);
            });
        }

        const family = document.querySelector('[data-plant="family"]');
        if (family && plant.family) {
            family.textContent = '';
            family.append(listLink('family', plant.family.split(' (')[0], I18n.tFamily(plant.family)));
        }

        renderSimilar(I18n, plant, lang);
        renderPlate(plant, name);
    }

    // Botanical plate: plants-data.js "image" (path) and "imageCredit" (source line)
    function renderPlate(plant, name) {
        const figure = document.querySelector('[data-plant="plate"]');
        if (!figure || !plant.image) return;
        const img = figure.querySelector('img');
        img.src = plant.image;
        img.alt = name + ' (' + plant.botanicalName + ')';
        figure.querySelector('figcaption').textContent = plant.imageCredit || '';
        figure.hidden = false;
    }

    // The plants that share the most properties with this one
    const SIMILAR_COUNT = 6;
    const SIMILAR_MIN_SHARED = 2;

    function renderSimilar(I18n, plant, lang) {
        const list = document.querySelector('[data-plant="similar"]');
        const section = document.querySelector('[data-similar-section]');
        if (!list || !section) return;

        const own = new Set(plant.properties || []);
        const nameOf = p => ({ en: p.commonName, da: p.danishName, fr: p.frenchName })[lang] || p.commonName;
        const similar = (window.PLANTS_DATA || [])
            .filter(p => p.fileSlug !== plant.fileSlug)
            .map(p => ({ plant: p, shared: (p.properties || []).filter(x => own.has(x)).length }))
            .filter(x => x.shared >= SIMILAR_MIN_SHARED)
            .sort((a, b) => (b.shared - a.shared) || nameOf(a.plant).localeCompare(nameOf(b.plant), lang))
            .slice(0, SIMILAR_COUNT);

        list.textContent = '';
        similar.forEach(({ plant: p, shared }) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = I18n.withLang(window.Utils.plantUrl(p.fileSlug));
            a.className = 'similar-name';
            a.textContent = nameOf(p);
            const latin = document.createElement('em');
            latin.className = 'similar-latin';
            latin.textContent = p.botanicalName;
            const count = document.createElement('span');
            count.className = 'similar-count';
            count.textContent = I18n.format(I18n.t('plant.similar.shared'), { count: shared });
            li.append(a, latin, count);
            list.append(li);
        });
        section.hidden = similar.length === 0;
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
            const key = spot.getAttribute('data-placeholder');
            if (local && key) {
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
