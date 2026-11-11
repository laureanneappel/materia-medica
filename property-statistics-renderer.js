/**
 * Properties page (property-statistics.html)
 * Lists every property with the number of plants that have it.
 * - Closed by default; click a property to see its plants
 * - Bars show how many plants have each property
 * - Sort A–Z or by number of plants; A–Z letter bar to jump
 * - Properties with subtypes, e.g. "Antiinflammatoriske (lever)", are grouped
 * - Search matches property names and plant names
 */
(function () {
    'use strict';

    const { escapeHtml } = window.Utils || {};
    const I18n = window.I18n;
    const t = (key) => (I18n ? I18n.t(key) : key);
    const tProperty = (p) => (I18n ? I18n.tProperty(p) : p);
    const lang = () => (I18n ? I18n.getLang() : 'en');
    const compare = (a, b) => a.localeCompare(b, lang());

    const state = {
        sort: 'name',          // 'name' or 'count'
        search: '',
        expanded: new Set(),   // keys of open properties and groups
    };
    let items = [];            // top-level items: properties and groups
    let maxCount = 1;

    // First letter for the A–Z bar. In French and English accented letters count as
    // their base letter (É -> E); in Danish Æ, Ø and Å are letters of their own.
    function firstLetter(label) {
        let l = (label[0] || '').toLocaleUpperCase(lang());
        if (lang() !== 'da') l = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return l;
    }

    function plantName(plant) {
        const byLang = { en: plant.commonName, da: plant.danishName, fr: plant.frenchName };
        return (byLang[lang()] || plant.commonName || '').trim();
    }

    // ---- Data -------------------------------------------------------------

    function buildItems() {
        const byProperty = new Map();
        (window.PLANTS_DATA || []).forEach(plant => {
            (plant.properties || []).forEach(prop => {
                if (!byProperty.has(prop)) byProperty.set(prop, []);
                byProperty.get(prop).push(plant);
            });
        });

        const props = [...byProperty.entries()].map(([key, plants]) => {
            const label = tProperty(key);
            return {
                type: 'prop', key, label, plants,
                base: key.includes(' (') ? key.slice(0, key.indexOf(' (')) : null,
            };
        });

        // Group properties that share a name before "(…)", e.g. Anti-inflammatory (liver) / (brain)
        const bases = new Map();
        props.forEach(p => { if (p.base) bases.set(p.base, (bases.get(p.base) || 0) + 1); });

        const top = [];
        const groups = new Map();
        props.forEach(p => {
            if (!p.base || bases.get(p.base) < 2) {
                top.push(p);
                return;
            }
            if (!groups.has(p.base)) {
                const label = p.label.includes(' (') ? p.label.slice(0, p.label.indexOf(' (')) : p.label;
                const group = { type: 'group', key: 'group:' + p.base, label, children: [], plants: [] };
                groups.set(p.base, group);
                top.push(group);
            }
            const sub = p.label.match(/\((.*)\)\s*$/);
            p.subLabel = sub ? sub[1] : p.label;
            groups.get(p.base).children.push(p);
        });

        groups.forEach(g => {
            const unique = new Map();
            g.children.forEach(c => c.plants.forEach(pl => unique.set(pl.fileSlug, pl)));
            g.plants = [...unique.values()];
        });

        items = top;
        // Bars are scaled to the largest single property; a group's bar may run full
        maxCount = Math.max(1, ...props.map(p => p.plants.length));
        return { propertyCount: props.length };
    }

    // ---- Stats ------------------------------------------------------------

    function renderStats(propertyCount) {
        const plants = (window.PLANTS_DATA || []).filter(p => (p.properties || []).length);
        const number = (n) => n.toLocaleString(lang());

        const box = document.getElementById('prop-stats');
        if (!box) return;
        box.innerHTML = [
            [number(propertyCount), t('props.stats.properties')],
            [number(plants.length), t('props.stats.plants')],
        ].map(([value, label]) => `
            <div class="prop-stat">
                <div class="prop-stat-number">${escapeHtml(value)}</div>
                <div class="prop-stat-label">${escapeHtml(label)}</div>
            </div>`).join('');
    }

    // ---- Search -----------------------------------------------------------

    // Lower case without accents, so "egla" finds "Églantier" and "valeriane" finds "Valériane"
    function fold(text) {
        return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // A plant matches when a word of its shown name, or of its Latin name, starts with the search
    // ("lav" finds Lavendel; "anti" does not find Églantier). Other languages' names are not searched,
    // so a highlighted plant always matches what is on screen.
    function plantMatches(plant, q) {
        const words = (s) => ' ' + fold(s).replace(/[\s\-/(),.']+/g, ' ').trim();
        const query = words(q);
        return [plantName(plant), plant.botanicalName].some(name => name && words(name).includes(query));
    }

    // Returns { visible, viaPlants } for an item under the current search
    function match(item) {
        const q = state.search;
        if (!q) return { visible: true, viaPlants: false };
        const own = fold(item.label).includes(q) ||
            (item.subLabel && fold(item.subLabel).includes(q));
        if (item.type === 'group') {
            if (own) return { visible: true, viaPlants: false };
            const children = item.children.map(match);
            const visible = children.some(c => c.visible);
            return { visible, viaPlants: visible };
        }
        if (own) return { visible: true, viaPlants: false };
        const viaPlants = item.plants.some(p => plantMatches(p, q));
        return { visible: viaPlants, viaPlants };
    }

    // ---- Rendering --------------------------------------------------------

    function sortItems(list) {
        const byName = (a, b) => compare(a.subLabel || a.label, b.subLabel || b.label);
        return [...list].sort(state.sort === 'count'
            ? (a, b) => (b.plants.length - a.plants.length) || byName(a, b)
            : byName);
    }

    function countLabel(n) {
        return n === 1 ? t('props.plantCount.one') : t('props.plantCount.many').replace('{count}', n);
    }

    function renderChips(item) {
        const q = state.search;
        const plants = [...item.plants].sort((a, b) => compare(plantName(a), plantName(b)));
        const chips = plants.map(p => {
            const url = window.Utils.plantUrl(p.fileSlug);
            const href = I18n ? I18n.withLang(url) : url;
            const hit = q && plantMatches(p, q) ? ' is-match' : '';
            return `<a class="plant-chip${hit}" href="${escapeHtml(href)}" title="${escapeHtml(p.botanicalName)}">${escapeHtml(plantName(p))}</a>`;
        }).join('');
        return `<div class="plant-chips">${chips}</div>`;
    }

    function renderItem(item, nested) {
        const m = match(item);
        if (!m.visible) return '';
        const open = state.expanded.has(item.key) || m.viaPlants;
        const count = item.plants.length;
        const width = Math.min(100, Math.max(2, Math.round(100 * count / maxCount)));
        const label = nested ? item.subLabel : item.label;
        const letter = firstLetter(item.label);

        let body;
        if (item.type === 'group') {
            body = `<div class="prop-children">${sortItems(item.children).map(c => renderItem(c, true)).join('')}</div>`;
        } else {
            body = renderChips(item);
        }

        return `
            <div class="prop-item${item.type === 'group' ? ' prop-group' : ''}${nested ? ' prop-nested' : ''}"
                 data-key="${escapeHtml(item.key)}" data-letter="${escapeHtml(letter)}">
                <button type="button" class="prop-head" aria-expanded="${open}">
                    <span class="prop-arrow" aria-hidden="true"></span>
                    <span class="prop-name">${escapeHtml(label)}</span>
                    <span class="prop-bar" aria-hidden="true"><span style="width:${width}%"></span></span>
                    <span class="prop-count" title="${escapeHtml(countLabel(count))}">${count}</span>
                </button>
                <div class="prop-body"${open ? '' : ' hidden'}>${body}</div>
            </div>`;
    }

    function renderAzBar(visibleItems) {
        const bar = document.getElementById('az-bar');
        if (!bar) return;
        if (state.sort !== 'name' || state.search) {
            bar.hidden = true;
            return;
        }
        const letters = [];
        visibleItems.forEach(i => {
            const l = firstLetter(i.label);
            if (l && !letters.includes(l)) letters.push(l);
        });
        bar.innerHTML = letters.map(l => `<button type="button" data-letter="${escapeHtml(l)}">${escapeHtml(l)}</button>`).join('');
        bar.hidden = letters.length < 2;
    }

    function render() {
        const list = document.getElementById('property-list');
        if (!list) return;
        const sorted = sortItems(items);
        const visible = sorted.filter(i => match(i).visible);
        list.innerHTML = visible.map(i => renderItem(i, false)).join('');

        const empty = document.getElementById('prop-empty');
        if (empty) empty.hidden = visible.length > 0;

        renderAzBar(visible);
        updateControls();

        const announce = document.getElementById('search-results-announcement');
        if (announce && state.search && I18n) {
            const key = visible.length === 1 ? 'props.search.one' : 'props.search.many';
            announce.textContent = I18n.format(I18n.t(key), { count: visible.length });
        }
    }

    function allKeys() {
        const keys = [];
        items.forEach(i => {
            keys.push(i.key);
            if (i.children) i.children.forEach(c => keys.push(c.key));
        });
        return keys;
    }

    function updateControls() {
        document.querySelectorAll('.segmented [data-sort]').forEach(b => {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-sort') === state.sort));
        });
        const toggle = document.getElementById('toggle-all');
        if (toggle) {
            const allOpen = items.every(i => state.expanded.has(i.key));
            toggle.textContent = t(allOpen ? 'props.collapseAll' : 'props.expandAll');
        }
    }

    // ---- Interaction ------------------------------------------------------

    function setup() {
        const list = document.getElementById('property-list');
        list.addEventListener('click', e => {
            const head = e.target.closest('.prop-head');
            if (!head) return;
            const item = head.closest('.prop-item');
            const key = item.getAttribute('data-key');
            const body = item.querySelector(':scope > .prop-body');
            const open = head.getAttribute('aria-expanded') !== 'true';
            head.setAttribute('aria-expanded', String(open));
            body.hidden = !open;
            if (open) state.expanded.add(key); else state.expanded.delete(key);
            updateControls();
        });

        document.querySelectorAll('.segmented [data-sort]').forEach(b => {
            b.addEventListener('click', () => {
                state.sort = b.getAttribute('data-sort');
                render();
            });
        });

        const toggle = document.getElementById('toggle-all');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const allOpen = items.every(i => state.expanded.has(i.key));
                state.expanded = allOpen ? new Set() : new Set(allKeys());
                render();
            });
        }

        const bar = document.getElementById('az-bar');
        if (bar) {
            bar.addEventListener('click', e => {
                const btn = e.target.closest('[data-letter]');
                if (!btn) return;
                const target = list.querySelector(`.prop-item[data-letter="${CSS.escape(btn.getAttribute('data-letter'))}"]`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    const head = target.querySelector('.prop-head');
                    if (head) head.focus({ preventScroll: true });
                }
            });
        }

        const search = document.getElementById('property-search');
        if (search) {
            let timer;
            search.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    state.search = fold(search.value.trim());
                    render();
                }, 200);
            });
        }
    }

    function init() {
        if (!document.getElementById('property-list')) return;
        try {
            const { propertyCount } = buildItems();
            renderStats(propertyCount);
            setup();
            render();
        } catch (error) {
            console.error('[PropertiesPage] Error rendering:', error);
        }
    }

    window.PropertyStatsRenderer = { render: init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
