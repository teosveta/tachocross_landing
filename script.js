// WAIT FOR DOM
document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. STICKY HEADER --- */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled-header', 'border-gray-200');
            header.classList.remove('border-transparent', 'header-hero');
        } else {
            header.classList.remove('scrolled-header', 'border-gray-200');
            header.classList.add('border-transparent', 'header-hero');
        }
    });

    /* --- 2. SCROLL REVEAL ANIMATIONS (Intersection Observer) --- */
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        root: null,
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    /* --- 3. ANIMATED COUNTER (Fine Amount) + Remote Control Bar --- */
    const counterElement = document.getElementById('fine-counter');
    const remoteBarFill = document.getElementById('remote-bar-fill');
    const targetValue = parseInt(counterElement.getAttribute('data-target'), 10);
    const duration = 2500; // ms
    let hasCounted = false;

    const counterObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;
            animateCounter(counterElement, 0, targetValue, duration);
        }
    }, { threshold: 0.5 });

    if (counterElement) {
        counterObserver.observe(counterElement);
    }

    function animateCounter(element, start, end, duration) {
        let startTime = null;

        function animationStep(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Easing function (easeOutQuart)
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = Math.floor(easeProgress * (end - start) + start);
            
            // Format number with commas (e.g., 200,000)
            element.innerText = currentValue.toLocaleString('bg-BG');

            // If this is the fine counter, drive the red bar fill
            if (element === counterElement && remoteBarFill) {
                // Custom easing for the bar with visible slowdowns:
                // - Quick start
                // - Noticeable slow around 1/2, stronger slow around 3/4 and 4/5
                let t = easeProgress;
                let barEase;

                if (t < 0.5) {
                    // Start relatively бързо
                    barEase = Math.pow(t, 0.9);
                } else if (t < 0.75) {
                    // Първо забавяне около средата
                    const local = (t - 0.5) / 0.25; // 0 → 1
                    barEase = 0.5 + 0.15 * Math.pow(local, 0.7);
                } else if (t < 0.8) {
                    // По-силно забавяне около 3/4
                    const local = (t - 0.75) / 0.05; // 0 → 1
                    barEase = 0.65 + 0.08 * Math.pow(local, 0.6);
                } else {
                    // Финалният stretch до 100%, още малко задържане около 4/5
                    const local = (t - 0.8) / 0.2; // 0 → 1
                    barEase = 0.73 + 0.27 * Math.pow(local, 1.1);
                }

                barEase = Math.max(0, Math.min(1, barEase));
                const barPercent = barEase * 100;
                remoteBarFill.style.width = `${barPercent}%`;
            }

            if (progress < 1) {
                requestAnimationFrame(animationStep);
            } else {
                element.innerText = end.toLocaleString('bg-BG'); // Ensure exact final value
            }
        }

        requestAnimationFrame(animationStep);
    }

    /* --- 4. INTERACTIVE TABS (Features Section) --- */
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.classList.add('border-transparent');
                b.classList.remove('border-gray-200');
            });
            tabContents.forEach(c => {
                c.classList.remove('active');
                // Small delay to allow opacity transition before setting pointer-events
                setTimeout(() => {
                    if(!c.classList.contains('active')) c.style.pointerEvents = 'none';
                }, 400);
            });

            // Add active class to clicked button
            btn.classList.add('active');
            btn.classList.remove('border-transparent');
            
            // Show corresponding content
            const targetId = `content-${btn.getAttribute('data-tab')}`;
            const targetContent = document.getElementById(targetId);
            
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.pointerEvents = 'auto';
            }
        });
    });

    /* --- 5. SMOOTH SCROLL FOR ANCHOR LINKS --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for sticky header height
                const headerHeight = document.getElementById('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* --- 6. HERO PARTICLE BACKGROUND (Canvas) --- */
    const heroSection = document.getElementById('hero');
    const heroCanvas = document.getElementById('hero-particles');

    if (heroSection && heroCanvas && heroCanvas.getContext) {
        const ctx = heroCanvas.getContext('2d');
        const rootStyles = getComputedStyle(document.documentElement);
        const canvasParticleColor = rootStyles.getPropertyValue('--color-canvas-particle').trim();
        const canvasConnectionRgb = rootStyles.getPropertyValue('--color-canvas-connection-rgb').trim();
        let width = 0;
        let height = 0;
        let particles = [];
        const BASE_DENSITY = 120; // approximate number of particles on large screens

        function resizeCanvas() {
            width = heroSection.offsetWidth;
            height = heroSection.offsetHeight;
            heroCanvas.width = width;
            heroCanvas.height = height;

            const area = width * height;
            const targetCount = Math.max(40, Math.floor(area / 20000));

            particles = [];
            for (let i = 0; i < Math.min(targetCount, BASE_DENSITY); i++) {
                particles.push(new Particle());
            }
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                // subtle movement speed
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.5 + 0.6;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // bounce softly from edges
                if (this.x < 0 || this.x > width) this.vx = -this.vx;
                if (this.y < 0 || this.y > height) this.vy = -this.vy;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = canvasParticleColor;
                ctx.fill();
            }
        }

        function drawConnections() {
            const maxDistance = 140;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        const alpha = 1 - dist / maxDistance;
                        ctx.strokeStyle = `rgba(${canvasConnectionRgb}, ${alpha * 0.22})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            drawConnections();
            requestAnimationFrame(animate);
        }

        // Initialize
        resizeCanvas();
        animate();

        // Keep in sync with viewport / hero size
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 200);
        });
    }

    /* --- 7. FINANCIAL RECOVERY PARTICLE BACKGROUND (Canvas) --- */
    const refundSection = document.getElementById('refund');
    const refundCanvas  = document.getElementById('refund-particles');

    if (refundSection && refundCanvas && refundCanvas.getContext) {
        const rCtx = refundCanvas.getContext('2d');
        const rootStyles2 = getComputedStyle(document.documentElement);
        const refundParticleColor     = rootStyles2.getPropertyValue('--color-canvas-particle').trim();
        const refundConnectionRgb     = rootStyles2.getPropertyValue('--color-canvas-connection-rgb').trim();
        let rWidth = 0, rHeight = 0;
        let rParticles = [];
        const R_BASE_DENSITY = 120;

        function resizeRefundCanvas() {
            rWidth  = refundSection.offsetWidth;
            rHeight = refundSection.offsetHeight;
            refundCanvas.width  = rWidth;
            refundCanvas.height = rHeight;
            const area = rWidth * rHeight;
            const targetCount = Math.max(40, Math.floor(area / 20000));
            rParticles = [];
            for (let i = 0; i < Math.min(targetCount, R_BASE_DENSITY); i++) {
                rParticles.push(new RefundParticle());
            }
        }

        class RefundParticle {
            constructor() {
                this.x  = Math.random() * rWidth;
                this.y  = Math.random() * rHeight;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.5 + 0.6;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > rWidth)  this.vx = -this.vx;
                if (this.y < 0 || this.y > rHeight) this.vy = -this.vy;
            }
            draw() {
                rCtx.beginPath();
                rCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                rCtx.fillStyle = refundParticleColor;
                rCtx.fill();
            }
        }

        function drawRefundConnections() {
            const maxDistance = 140;
            for (let i = 0; i < rParticles.length; i++) {
                for (let j = i + 1; j < rParticles.length; j++) {
                    const dx   = rParticles[i].x - rParticles[j].x;
                    const dy   = rParticles[i].y - rParticles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDistance) {
                        const alpha = 1 - dist / maxDistance;
                        rCtx.strokeStyle = `rgba(${refundConnectionRgb}, ${alpha * 0.22})`;
                        rCtx.lineWidth = 0.8;
                        rCtx.beginPath();
                        rCtx.moveTo(rParticles[i].x, rParticles[i].y);
                        rCtx.lineTo(rParticles[j].x, rParticles[j].y);
                        rCtx.stroke();
                    }
                }
            }
        }

        function animateRefund() {
            rCtx.clearRect(0, 0, rWidth, rHeight);
            rParticles.forEach(p => { p.update(); p.draw(); });
            drawRefundConnections();
            requestAnimationFrame(animateRefund);
        }

        resizeRefundCanvas();
        animateRefund();

        let refundResizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(refundResizeTimeout);
            refundResizeTimeout = setTimeout(resizeRefundCanvas, 200);
        });
    }

    /* --- 8. SCROLL EXPAND HERO --- */
    (function () {
        const bgEl        = document.getElementById('seh-bg');
        const mediaEl     = document.getElementById('seh-media');
        const overlayEl   = document.getElementById('seh-media-overlay');
        const titleL      = document.getElementById('seh-title-l');
        const titleR      = document.getElementById('seh-title-r');
        const labelEl     = document.getElementById('seh-label');
        const hintEl      = document.getElementById('seh-hint');
        const contentEl   = document.getElementById('seh-content');
        const bottomText  = document.getElementById('seh-bottom-text');
        const header      = document.getElementById('header');

        if (!bgEl || !mediaEl) return; // guard: only run if hero exists

        let progress    = 0;      // 0 → 1
        let expanded    = false;  // true once progress reaches 1
        let touchStartY = 0;
        let isMobile    = window.innerWidth < 768;


        function render() {
            const vh = window.innerHeight;
            const mw = 300 + progress * (window.innerWidth - 300);
            const mh = 400 + progress * (vh * 0.82 - 400);

            // Interpolate top: starts centered, ends at top of viewport (nav overlaps via z-index)
            const startTop = (vh - 400) / 2;
            const topPx    = startTop * (1 - progress);

            const tx = progress * (isMobile ? 180 : 150); // vw units

            bgEl.style.opacity       = String(1 - progress);
            mediaEl.style.width      = mw + 'px';
            mediaEl.style.height     = mh + 'px';
            mediaEl.style.top        = topPx + 'px';
            mediaEl.style.transform  = 'translate(-50%, 0)';
            overlayEl.style.opacity  = String(Math.max(0, 0.5 - progress * 0.3));
            mediaEl.classList.toggle('fully-expanded', progress >= 0.98);

            titleL.style.transform = 'translateX(-' + tx + 'vw)';
            titleR.style.transform = 'translateX('  + tx + 'vw)';
            if (labelEl) labelEl.style.transform = 'translateX(-' + tx + 'vw)';
            if (hintEl)  hintEl.style.transform  = 'translateX('  + tx + 'vw)';

            const show = expanded;
            contentEl.classList.toggle('visible', show);
            contentEl.setAttribute('aria-hidden', show ? 'false' : 'true');
            if (bottomText) {
                bottomText.classList.toggle('visible', show);
                bottomText.setAttribute('aria-hidden', show ? 'false' : 'true');
            }
        }

        function advance(delta) {
            progress = Math.min(Math.max(progress + delta, 0), 1);
            if (progress >= 1) expanded = true;
            render();
        }

        function onWheel(e) {
            if (expanded && e.deltaY < 0 && window.scrollY <= 5) {
                expanded = false;
                e.preventDefault();
            } else if (!expanded) {
                e.preventDefault();
                advance(e.deltaY * 0.0009);
            }
        }

        function onTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }

        function onTouchMove(e) {
            if (!touchStartY) return;
            const dy = touchStartY - e.touches[0].clientY;
            if (expanded && dy < -20 && window.scrollY <= 5) {
                expanded = false;
                e.preventDefault();
            } else if (!expanded) {
                e.preventDefault();
                const factor = dy < 0 ? 0.008 : 0.005;
                advance(dy * factor);
                touchStartY = e.touches[0].clientY;
            }
        }

        function onTouchEnd() { touchStartY = 0; }

        function onScroll() {
            if (!expanded) window.scrollTo(0, 0);
        }

        window.addEventListener('wheel',      onWheel,      { passive: false });
        window.addEventListener('scroll',     onScroll,     { passive: true  });
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchmove',  onTouchMove,  { passive: false });
        window.addEventListener('touchend',   onTouchEnd);
        window.addEventListener('resize',     function () {
            isMobile = window.innerWidth < 768;
            render();
        });

        render(); // set initial state
    })();

});
