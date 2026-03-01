// ============================================
// animations.js — Custom Cursor & Scroll Reveal
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initScrollReveal();
});

// ===== CUSTOM CURSOR =====
function initCustomCursor() {
    // Check if device supports hover (desktop)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';

    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    // Fast movement for the dot
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Immediate update for the main dot for zero latency feel
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    });

    // Smooth physics loop for the follower
    function render() {
        // Linear interpolation for smooth trailing
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Add hover states for interactive elements
    const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], label, .service-card, .gallery-item';

    // We use event delegation since many elements are loaded dynamically (carousel, products, etc)
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelectors)) {
            cursor.classList.add('cursor--hover');
            follower.classList.add('cursor-follower--hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelectors)) {
            cursor.classList.remove('cursor--hover');
            follower.classList.remove('cursor-follower--hover');
        }
    });
}

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
