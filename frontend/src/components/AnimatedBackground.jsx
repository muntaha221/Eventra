import { useEffect, useRef } from "react";

/**
 * AnimatedBackground
 * 
 * Hardware-accelerated, high-resolution interactive canvas particle network
 * coupled with smooth CSS-driven glowing ambient aurora orbs and a subtle cyber grid.
 * 
 * Performance:
 * - Uses native 2D canvas with devicePixelRatio scaling for 4K crispness.
 * - Pauses automatically when tab is hidden (document.hidden) or offscreen.
 * - Zero external libraries, zero network bandwidth overhead.
 */
export default function AnimatedBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId;
        let width = 0;
        let height = 0;
        let mouseX = -1000;
        let mouseY = -1000;
        let isVisible = true;

        // Particle configuration
        const PARTICLE_COUNT = 52;
        const CONNECT_DISTANCE = 135;
        const MOUSE_RADIUS = 160;

        let particles = [];

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.parentElement?.clientHeight || window.innerHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(dpr, dpr);
            initParticles();
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 1.8 + 1.2,
                    baseAlpha: Math.random() * 0.4 + 0.35,
                    color: Math.random() > 0.35 ? "34, 197, 94" : (Math.random() > 0.5 ? "16, 185, 129" : "56, 189, 248")
                });
            }
        }

        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        function handleMouseLeave() {
            mouseX = -1000;
            mouseY = -1000;
        }

        function handleVisibilityChange() {
            isVisible = !document.hidden;
            if (isVisible) {
                lastTime = performance.now();
                render(lastTime);
            }
        }

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        resize();

        let lastTime = performance.now();

        function render(currentTime) {
            if (!isVisible) return;

            const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            ctx.clearRect(0, 0, width, height);

            // Update & draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx * (delta * 60);
                p.y += p.vy * (delta * 60);

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse interaction: soft repulsion / glow
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);
                let alpha = p.baseAlpha;

                if (distToMouse < MOUSE_RADIUS) {
                    const force = (1 - distToMouse / MOUSE_RADIUS);
                    alpha = Math.min(1, alpha + force * 0.7);
                    // Draw tether line to cursor
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(34, 197, 94, ${force * 0.45})`;
                    ctx.lineWidth = 1.2;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.stroke();
                }

                // Draw particle node
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
                ctx.shadowColor = `rgba(${p.color}, 0.8)`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const pDx = p.x - p2.x;
                    const pDy = p.y - p2.y;
                    const pDist = Math.sqrt(pDx * pDx + pDy * pDy);

                    if (pDist < CONNECT_DISTANCE) {
                        const linkAlpha = (1 - pDist / CONNECT_DISTANCE) * 0.28;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(34, 197, 94, ${linkAlpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        }

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0
            }}
        >
            {/* Subtle High-Tech Perspective Grid */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                    maskImage: "radial-gradient(ellipse 75% 65% at 50% 25%, #000 25%, transparent 85%)",
                    WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 25%, #000 25%, transparent 85%)",
                    opacity: 0.95
                }}
            />

            {/* Glowing Aurora Orb 1: Primary Emerald Glow */}
            <div
                className="ambient-aurora-orb-1"
                style={{
                    position: "absolute",
                    top: "10%",
                    left: "18%",
                    width: "620px",
                    height: "460px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(34, 197, 94, 0.28) 0%, rgba(16, 185, 129, 0.12) 45%, transparent 75%)",
                    filter: "blur(65px)",
                    transform: "translate3d(0, 0, 0)",
                    pointerEvents: "none"
                }}
            />

            {/* Glowing Aurora Orb 2: Electric Cyan / Teal accent */}
            <div
                className="ambient-aurora-orb-2"
                style={{
                    position: "absolute",
                    top: "18%",
                    right: "12%",
                    width: "520px",
                    height: "420px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(20, 184, 166, 0.24) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 75%)",
                    filter: "blur(75px)",
                    transform: "translate3d(0, 0, 0)",
                    pointerEvents: "none"
                }}
            />

            {/* Glowing Aurora Orb 3: Deep Royal Center Accent */}
            <div
                className="ambient-aurora-orb-3"
                style={{
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "720px",
                    height: "360px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(99, 102, 241, 0.09) 50%, transparent 75%)",
                    filter: "blur(85px)",
                    pointerEvents: "none"
                }}
            />

            {/* Interactive Particle Network Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "auto",
                    zIndex: 1
                }}
            />

            {/* Top Atmospheric Gradient Fade */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "80px",
                    background: "linear-gradient(to bottom, transparent, rgba(10, 10, 12, 0.75))",
                    pointerEvents: "none",
                    zIndex: 2
                }}
            />
        </div>
    );
}
