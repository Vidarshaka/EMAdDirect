/**
 * Hero stat carousel — define each metric once. Order is clockwise around the carousel:
 * each slide shows [previous, featured, next] in that ring.
 */
window.HERO_STATS = window.HERO_STATS || [
    // { number: '2000+', label: 'Members using EquityMatch to scale their ventures' },
    { number: '950+', label: 'Founders actively connecting' },
    { number: '500+', label: 'Investors & Mentors on the platform' },
    { number: '20', label: 'Tailored matchmaking for your sector' },
    { number: '1K+', label: 'Warm introductions each month' },
];

document.addEventListener('DOMContentLoaded', function() {
    wireLandingLinks();
    initializeSmoothScroll();
    observeElements();
    buildHeroStatsCarousel();
    initStatsCarousel();
    initCtaTracking();
});

/**
 * Applies URLs from links-config.js (window.LANDING_LINKS) to a.js-landing-link.
 * Edit LANDING_LINKS only in links-config.js.
 */
function wireLandingLinks() {
    var map = window.LANDING_LINKS || {};
    document.querySelectorAll('a.js-landing-link').forEach(function (el) {
        var key = el.getAttribute('data-landing');
        var url = map[key];
        if (url && typeof url === 'string' && url.trim() !== '') {
            el.href = url.trim();
        }
    });
}

function initCtaTracking() {
    document.querySelectorAll('a.js-landing-link').forEach(function (el) {
        el.addEventListener('click', function () {
            trackEvent('cta_click', {
                landing: el.getAttribute('data-landing'),
                href: el.href,
            });
        });
    });
}

// Initialize smooth scroll behavior
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Add scroll event listener for navbar effects
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Add animation to elements on scroll
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    // Observe all stat items, feature items, and cards
    document.querySelectorAll('.stats-carousel, .btn, .cta-section .container').forEach(el => {
        observer.observe(el);
    });
}

function statCard(stat, center) {
    var div = document.createElement('div');
    div.className = 'stat-item' + (center ? ' stat-item--center' : '');
    var num = document.createElement('div');
    num.className = 'stat-number';
    num.textContent = stat.number;
    var lab = document.createElement('div');
    lab.className = 'stat-label';
    lab.textContent = stat.label;
    div.appendChild(num);
    div.appendChild(lab);
    return div;
}

function buildHeroStatsCarousel() {
    var track = document.getElementById('statsTrack');
    if (!track) return;
    var stats = window.HERO_STATS;
    if (!stats || !stats.length) return;
    var n = stats.length;
    track.innerHTML = '';
    // Track = [clone last, 0, 1, ..., n-1, clone first] so first/last can be centered and no duplicate at end.
    var totalSlides = n + 2;
    var viewportSlides = 3;
    var trackWidthPct = totalSlides * (100 / viewportSlides);
    track.style.width = trackWidthPct + '%';

    var slidePctOfTrack = 100 / totalSlides;
    var order = [n - 1];
    for (var s = 0; s < n; s++) order.push(s);
    order.push(0);
    for (var t = 0; t < order.length; t++) {
        var s = order[t];
        var slide = document.createElement('div');
        slide.className = 'stats-slide';
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('data-slide-index', String(s));
        slide.appendChild(statCard(stats[s], false));
        slide.style.flex = '0 0 ' + slidePctOfTrack + '%';
        slide.style.width = slidePctOfTrack + '%';
        track.appendChild(slide);
    }
}

function initStatsCarousel() {
    var track = document.getElementById('statsTrack');
    var dotsWrap = document.querySelector('.stats-carousel-dots');
    var carousel = track ? track.closest('.stats-carousel') : null;
    if (!track || !dotsWrap || !carousel) return;

    var slides = track.querySelectorAll('.stats-slide');
    var totalSlides = slides.length;
    var n = totalSlides - 2;
    if (n <= 0) return;

    // Track is [clone last, 0, 1, ..., n-1, clone last]. Position i = center is real slide i (0..n-1).
    var maxIndex = n - 1;
    var i = 0;
    var timer = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pctPerStep = 100 / totalSlides;

    dotsWrap.innerHTML = '';
    for (var d = 0; d < n; d++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Stat ' + (d + 1) + ' of ' + n);
        (function (idx) {
            b.addEventListener('click', function () {
                goTo(Math.min(idx, maxIndex), true);
            });
        })(d);
        dotsWrap.appendChild(b);
    }
    var dots = dotsWrap.querySelectorAll('button');

    function updateAria() {
        var left = i;
        var right = i + 2;
        slides.forEach(function (s, j) {
            var inView = j >= left && j <= right;
            s.setAttribute('aria-hidden', !inView ? 'true' : 'false');
            var statItem = s.querySelector('.stat-item');
            if (statItem) {
                if (j === i + 1) statItem.classList.add('stat-item--center');
                else statItem.classList.remove('stat-item--center');
            }
        });
        dots.forEach(function (dot, j) {
            dot.setAttribute('aria-selected', j === i ? 'true' : 'false');
        });
    }

    function goTo(pos, userClicked) {
        i = Math.max(0, Math.min(pos, maxIndex));
        track.classList.remove('stats-track--dragging');
        carousel.classList.remove('is-dragging');
        var tx = getTransformPct(i);
        track.style.transform = 'translateX(-' + tx + '%)';
        updateAria();
        if (userClicked) {
            if (timer) clearInterval(timer);
            if (!reducedMotion) {
                timer = setInterval(function () {
                    goTo(i >= maxIndex ? 0 : i + 1, false);
                }, 5000);
            }
        }
    }

    goTo(0, false);

    if (!reducedMotion) {
        timer = setInterval(function () {
            goTo(i >= maxIndex ? 0 : i + 1, false);
        }, 5000);
    }

    /* Mouse and touch drag / swipe — one card moves into center (cylinder) */
    var dragStartX = 0;
    var dragStartY = 0;
    var dragStartIndex = 0;
    var isDragging = false;

    function getPointerX(ev) {
        if (ev.touches && ev.touches.length) return ev.touches[0].clientX;
        if (ev.changedTouches && ev.changedTouches.length) return ev.changedTouches[0].clientX;
        return ev.clientX;
    }
    function getPointerY(ev) {
        if (ev.touches && ev.touches.length) return ev.touches[0].clientY;
        if (ev.changedTouches && ev.changedTouches.length) return ev.changedTouches[0].clientY;
        return ev.clientY;
    }

    function onPointerDown(ev) {
        if (ev.button !== 0 && !ev.touches) return;
        dragStartX = getPointerX(ev);
        dragStartY = getPointerY(ev);
        dragStartIndex = i;
        isDragging = true;
        carousel.classList.add('is-dragging');
        track.classList.add('stats-track--dragging');
        if (timer) clearInterval(timer);
    }

    function getTransformPct(pos) {
        return pos * pctPerStep;
    }

    function onPointerMove(ev) {
        if (!isDragging) return;
        var x = getPointerX(ev);
        var viewportWidth = carousel.offsetWidth;
        var deltaX = dragStartX - x;
        var basePct = getTransformPct(dragStartIndex);
        var dragPct = (deltaX / viewportWidth) * pctPerStep * 3;
        var resistance = 1;
        var minPct = 0;
        var maxPct = maxIndex * pctPerStep;
        var targetPct = basePct + dragPct;
        if (targetPct < minPct) resistance = 1 + (minPct - targetPct) / 100;
        if (targetPct > maxPct) resistance = 1 + (targetPct - maxPct) / 100;
        dragPct = dragPct / resistance;
        track.style.transform = 'translateX(-' + (basePct + dragPct) + '%)';
    }

    function onPointerUp(ev) {
        if (!isDragging) return;
        var x = getPointerX(ev);
        var viewportWidth = carousel.offsetWidth;
        var deltaX = dragStartX - x;
        var currentPct = getTransformPct(dragStartIndex) + (deltaX / viewportWidth) * pctPerStep * 3;
        var bestIndex = 0;
        var bestDist = Math.abs(currentPct - getTransformPct(0));
        for (var p = 1; p <= maxIndex; p++) {
            var d = Math.abs(currentPct - getTransformPct(p));
            if (d < bestDist) {
                bestDist = d;
                bestIndex = p;
            }
        }
        goTo(bestIndex, true);
        isDragging = false;
    }

    carousel.addEventListener('pointerdown', onPointerDown, { passive: true });
    carousel.addEventListener('pointermove', onPointerMove, { passive: true });
    carousel.addEventListener('pointerup', onPointerUp, { passive: true });
    carousel.addEventListener('pointerleave', onPointerUp, { passive: true });
    carousel.addEventListener('pointercancel', onPointerUp, { passive: true });

    carousel.addEventListener('touchstart', onPointerDown, { passive: true });
    carousel.addEventListener('touchmove', onPointerMove, { passive: true });
    carousel.addEventListener('touchend', onPointerUp, { passive: true });
    carousel.addEventListener('touchcancel', onPointerUp, { passive: true });
}


// observeElements is called on DOMContentLoaded above

// Add keyboard navigation support
document.addEventListener('keydown', function(event) {
    // Tab through buttons
    if (event.key === 'Tab') {
        // Native browser behavior
        return;
    }
    
    // Enter on focused link/button (links activate natively; keep for any future buttons)
    if (event.key === 'Enter') {
        var focused = document.activeElement;
        if (focused && focused.classList && focused.classList.contains('btn') && focused.tagName === 'BUTTON') {
            focused.click();
        }
    }
});

// Mobile menu toggle (for future mobile nav enhancement)
function handleMobileNavigation() {
    // This function can be extended for mobile menu functionality
    const isMobile = window.innerWidth <= 768;
    console.log('Mobile navigation active:', isMobile);
}

// Handle window resize
window.addEventListener('resize', handleMobileNavigation);

// Initial call
handleMobileNavigation();

// Add analytics tracking (example)
function trackEvent(eventName, eventData) {
    console.log('Event tracked:', eventName, eventData);
    // This can be extended to send data to analytics service
}

// Track page load
trackEvent('page_load', {
    page: 'landing_page',
    timestamp: new Date().toISOString()
});
