/**
 * Shared Footer Component
 * Automatically injects footer into all pages
 */

(function() {
    'use strict';

    /**
     * Create footer HTML
     */
    function createFooter() {
        const footer = document.createElement('footer');
        const title = document.createElement('p');
        title.setAttribute('data-i18n', 'footer.title');
        const disclaimer = document.createElement('p');
        disclaimer.className = 'disclaimer';
        disclaimer.setAttribute('data-i18n', 'footer.disclaimer');
        footer.append(title, disclaimer);
        if (window.I18n) window.I18n.applyTranslations(footer);
        return footer;
    }

    /**
     * Inject footer into the page
     */
    function injectFooter() {
        try {
            const placeholder = document.getElementById('footer-placeholder');
            if (!placeholder) {
                console.error('[Footer] footer-placeholder element not found');
                return;
            }

            placeholder.replaceWith(createFooter());
        } catch (error) {
            console.error('[Footer] Error in injectFooter:', error);
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }

})();
