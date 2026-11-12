/**
 * Shared Utility Functions
 * Common utilities used across multiple JavaScript files
 */

(function() {
    'use strict';

    /**
     * Escape HTML to prevent XSS attacks
     * @param {*} unsafe - The string to escape
     * @returns {string} - The escaped string
     */
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Link to a plant's page
     * @param {string} slug - The plant's fileSlug
     * @returns {string} - e.g. "plant.html?p=hawthorn"
     */
    function plantUrl(slug) {
        return 'plant.html?p=' + encodeURIComponent(slug);
    }

    // Expose public API
    window.Utils = {
        plantUrl,
        escapeHtml
    };

})();
