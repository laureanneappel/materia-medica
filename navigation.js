/**
 * Shared Navigation Component
 * Automatically injects navigation into all pages
 */

(function() {
    'use strict';

    // Import utilities from shared utils.js
    const { escapeHtml, logError, logWarn, isValidString } = window.Utils || {};

    // Validate that utils.js is loaded
    if (!window.Utils) {
        console.error('[Navigation] utils.js not loaded! Navigation may not work correctly.');
    }

    // Navigation structure - single source of truth
    // `i18nKey` is used to look up the translated label via window.I18n.t().
    // `label` is kept as the English fallback if i18n.js failed to load.
    const NAV_ITEMS = [
        { href: 'index.html', label: 'All Plants', i18nKey: 'nav.all', id: 'all' },
        { href: 'property-statistics.html', label: 'Properties', i18nKey: 'nav.properties', id: 'properties' },
    ];

    const I18n = window.I18n;
    const translate = (key, fallback) => (I18n ? I18n.t(key) : fallback);
    const withLang = (url) => (I18n ? I18n.withLang(url) : url);

    /**
     * Determine the base path for navigation links
     * Returns '../' for plant pages, '' for root pages
     */
    function getBasePath() {
        try {
            const path = window.location.pathname;
            if (typeof path !== 'string') {
                console.error('[Navigation] Invalid pathname type:', typeof path);
                return '';
            }
            return path.includes('/plants/') ? '../' : '';
        } catch (error) {
            console.error('[Navigation] Error in getBasePath:', error);
            return '';
        }
    }

    /**
     * Determine which nav item should be active
     */
    function getActiveNavId() {
        try {
            const path = window.location.pathname;
            if (typeof path !== 'string') {
                console.error('[Navigation] Invalid pathname type in getActiveNavId:', typeof path);
                return 'all';
            }

            const filename = path.split('/').pop();
            if (!filename) {
                console.warn('[Navigation] Could not extract filename from path:', path);
                return 'all';
            }

            // Check for exact matches
            for (const item of NAV_ITEMS) {
                if (!item || !item.href || !item.id) {
                    console.warn('[Navigation] Invalid nav item:', item);
                    continue;
                }
                if (filename === item.href.split('?')[0]) {
                    return item.id;
                }
            }

            // Default to 'all' for plant detail pages
            if (path.includes('/plants/')) {
                return null; // No active state on plant pages
            }

            return 'all';
        } catch (error) {
            console.error('[Navigation] Error in getActiveNavId:', error);
            return 'all';
        }
    }

    /**
     * Create navigation HTML
     */
    function createNavigation() {
        try {
            const basePath = getBasePath();
            const activeId = getActiveNavId();

            if (!Array.isArray(NAV_ITEMS) || NAV_ITEMS.length === 0) {
                console.error('[Navigation] Invalid NAV_ITEMS configuration');
                return '<nav class="system-nav" aria-label="Body systems navigation"><p>Navigation unavailable</p></nav>';
            }

            const navHtml = NAV_ITEMS.map(item => {
                if (!item || !item.href || !item.label) {
                    console.warn('[Navigation] Skipping invalid nav item:', item);
                    return '';
                }
                const href = escapeHtml(withLang(basePath + item.href));
                const label = escapeHtml(translate(item.i18nKey, item.label));
                const activeClass = activeId === item.id ? ' class="active"' : '';
                return `<a href="${href}"${activeClass}>${label}</a>`;
            }).filter(Boolean).join('\n                ');

            return `<nav class="system-nav" aria-label="${escapeHtml(translate('nav.aria', 'Main navigation'))}">
                ${navHtml}
            </nav>`;
        } catch (error) {
            console.error('[Navigation] Error in createNavigation:', error);
            return '<nav class="system-nav" aria-label="Body systems navigation"><p>Navigation error</p></nav>';
        }
    }

    /**
     * Inject navigation into the page
     */
    function injectNavigation() {
        try {
            const placeholder = document.getElementById('nav-placeholder');
            // Pages without a menu spot (plant pages use the back link instead)
            if (!placeholder) return;

            const navHtml = createNavigation();
            if (!navHtml || typeof navHtml !== 'string') {
                console.error('[Navigation] Invalid navigation HTML generated');
                placeholder.innerHTML = '<p class="error-message">Navigation failed to load</p>';
                return;
            }

            placeholder.outerHTML = navHtml;
        } catch (error) {
            console.error('[Navigation] Error in injectNavigation:', error);
            const placeholder = document.getElementById('nav-placeholder');
            if (placeholder) {
                placeholder.innerHTML = '<p class="error-message">Navigation error occurred</p>';
            }
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavigation);
    } else {
        injectNavigation();
    }

})();
