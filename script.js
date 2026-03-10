// WAIT FOR DOM
document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. STICKY HEADER --- */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled-header', 'border-gray-200');
            header.classList.remove('border-transparent');
        } else {
            header.classList.remove('scrolled-header', 'border-gray-200');
            header.classList.add('border-transparent');
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
                ctx.fillStyle = 'rgba(255, 255, 255, 0.38)'; // soft, visible on dark blue
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
                        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.22})`; // slate/blue-gray
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

});
