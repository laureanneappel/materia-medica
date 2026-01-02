/**
 * Page Transition Handler
 * Adds smooth fade-out effect when navigating between pages
 */

(function() {
    'use strict';

    // Add fade-out class to body
    const style = document.createElement('style');
    style.textContent = `
        body.page-transition {
            animation: fadeOut 0.2s ease-out forwards;
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    /**
     * Handle link clicks for smooth transitions
     */
    function handleLinkClick(event) {
        const link = event.target.closest('a');

        // Only handle internal links
        if (!link || !link.href) return;

        // Skip external links
        if (link.hostname !== window.location.hostname) return;

        // Skip anchor links (same page)
        if (link.getAttribute('href')?.startsWith('#')) return;

        // Skip if Ctrl/Cmd/Shift key is pressed (user wants to open in new tab)
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;

        // Skip if link has target="_blank"
        if (link.target === '_blank') return;

        // Prevent default navigation
        event.preventDefault();

        // Add fade-out class
        document.body.classList.add('page-transition');

        // Navigate after fade-out completes
        setTimeout(() => {
            window.location.href = link.href;
        }, 200);
    }

    // Attach event listener to document (event delegation)
    document.addEventListener('click', handleLinkClick);

    // Handle browser back/forward buttons
    window.addEventListener('pageshow', function(event) {
        // Remove transition class if page is shown from cache
        if (event.persisted) {
            document.body.classList.remove('page-transition');
        }
    });

})();
