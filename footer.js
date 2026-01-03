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
        return `<footer>
            <p>Personal Materia Medica Collection</p>
            <p class="disclaimer">Disclaimer: This website is for informational and educational purposes only. The information provided is not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional before using any herbal remedies or supplements. The author takes no responsibility for any consequences arising from the use of this information.</p>
        </footer>`;
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

            const footerHtml = createFooter();
            placeholder.outerHTML = footerHtml;
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
