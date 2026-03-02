// ============================================
// animations.js — Custom Cursor & Scroll Reveal
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
});

// ===== SCROLL REVEAL (Intersection Observer) =====
function initScrollReveal() {
    // Options for the observer
    const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add is-visible class to trigger CSS transition

                // Check if there's a staggered delay
                const delay = entry.target.getAttribute('data-delay');
                if (delay) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, parseInt(delay));
                } else {
                    entry.target.classList.add('is-visible');
                }

                // Stop observing once revealed (run once)
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Re-run this function if dynamic content is added (like carousel/products)
    window.observeNewElements = function () {
        const revealElements = document.querySelectorAll('.reveal:not(.is-visible)');
        revealElements.forEach(el => observer.observe(el));
    };

    // Initial run
    observeNewElements();

    // Create a MutationObserver to automatically catch dynamically added .reveal elements
    const mutObserver = new MutationObserver((mutations) => {
        let shouldObserve = false;
        for (let m of mutations) {
            if (m.addedNodes.length > 0) {
                shouldObserve = true;
                break;
            }
        }
        if (shouldObserve) window.observeNewElements();
    });

    // Observe body for dynamic additions (like the homepage JS fetching products)
    mutObserver.observe(document.body, { childList: true, subtree: true });
}
