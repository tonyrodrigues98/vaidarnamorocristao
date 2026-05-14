import { useEffect, useRef } from "react";

/**
 * CinematicBackground
 * - WebGL fragment shader: procedural moving volumetric lights (blurred orbs)
 * - Canvas2D overlay: floating particles + dynamically connected dots / grid
 * - Respects prefers-reduced-motion
 * - Uses currentColor + theme-driven CSS variables; works in light & dark
 *
 * Performance: capped DPR, paused when offscreen / tab hidden.
 */
export function CinematicBackground() {
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const wrap = wrapRef.current!;
    const glCanvas = glRef.current!;
    const cvCanvas = cvRef.current!;
    const ctx2d = cvCanvas.getContext("2d");

    // ---- WebGL setup (procedural lights) ----
    const gl =
      (glCanvas.getContext("webgl", { antialias: true, premultipliedAlpha: true }) as WebGLRenderingContext | null) ||
      (glCanvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    let program: WebGLProgram | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTheme: WebGLUniformLocation | null = null;

    if (gl) {
      const vsSrc = `
        attribute vec2 p;
        void main(){ gl_Position = vec4(p, 0.0, 1.0); }
      `;
      const fsSrc = `
        precision highp float;
        uniform vec2 uRes;
        uniform float uTime;
        uniform float uTheme; // 0 light, 1 dark

        // smooth, hypnotic moving orbs
        float orb(vec2 uv, vec2 c, float r){
          float d = length(uv - c);
          return smoothstep(r, 0.0, d);
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / uRes.xy;
          uv.x *= uRes.x / uRes.y;

          float t = uTime * 0.05;

          vec2 c1 = vec2(0.35 + 0.25*sin(t*0.7),       0.40 + 0.18*cos(t*0.9));
          vec2 c2 = vec2(0.80 + 0.20*cos(t*0.5+1.3),   0.65 + 0.22*sin(t*0.6+0.4));
          vec2 c3 = vec2(0.50 + 0.30*sin(t*0.4+2.1),   0.20 + 0.20*cos(t*0.8+1.1));
          vec2 c4 = vec2(0.20 + 0.18*cos(t*0.6+0.7),   0.85 + 0.10*sin(t*0.5));

          // brand-leaning palette (rose / coral / petal / gold)
          vec3 col1 = vec3(0.902, 0.224, 0.337); // rose
          vec3 col2 = vec3(1.000, 0.498, 0.451); // coral
          vec3 col3 = vec3(0.996, 0.886, 0.835); // petal
          vec3 col4 = vec3(0.969, 0.776, 0.435); // gold

          float a1 = orb(uv, c1, 0.55);
          float a2 = orb(uv, c2, 0.60);
          float a3 = orb(uv, c3, 0.45);
          float a4 = orb(uv, c4, 0.50);

          vec3 color = col1*a1 + col2*a2 + col3*a3 + col4*a4;

          // depth & vignette
          float vign = smoothstep(1.4, 0.2, length(uv - vec2(0.7,0.5)));
          color *= 0.55 + 0.45*vign;

          // theme blend: in dark mode, dim base; in light, lift
          float intensity = mix(0.42, 0.30, uTheme);
          color *= intensity;

          // soft alpha (so background tint shows through)
          float alpha = mix(0.55, 0.65, uTheme);
          gl_FragColor = vec4(color, alpha);
        }
      `;

      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      uTime = gl.getUniformLocation(program, "uTime");
      uRes = gl.getUniformLocation(program, "uRes");
      uTheme = gl.getUniformLocation(program, "uTheme");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    // ---- Particles + connected dots (canvas 2d) ----
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let particles: P[] = [];

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      glCanvas.width = Math.floor(w * dpr);
      glCanvas.height = Math.floor(h * dpr);
      glCanvas.style.width = `${w}px`;
      glCanvas.style.height = `${h}px`;
      cvCanvas.width = Math.floor(w * dpr);
      cvCanvas.height = Math.floor(h * dpr);
      cvCanvas.style.width = `${w}px`;
      cvCanvas.style.height = `${h}px`;
      if (ctx2d) ctx2d.scale(dpr, dpr);
      if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);

      // recreate particles based on area
      const count = Math.max(28, Math.min(70, Math.floor((w * h) / 28000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.6 + Math.random() * 1.6,
        a: 0.25 + Math.random() * 0.45,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let running = true;
    let raf = 0;
    let last = performance.now();
    const start = last;
    let visible = true;
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const isDark = () => document.documentElement.classList.contains("dark");

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!running || !visible) return;
      const dt = Math.min(48, now - last);
      last = now;
      const t = (now - start) / 1000;

      // WebGL pass
      if (gl && program) {
        gl.useProgram(program);
        if (uTime) gl.uniform1f(uTime, t);
        if (uRes) gl.uniform2f(uRes, glCanvas.width, glCanvas.height);
        if (uTheme) gl.uniform1f(uTheme, isDark() ? 1 : 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // Canvas2D pass — particles + connections
      if (ctx2d) {
        const w = cvCanvas.clientWidth;
        const h = cvCanvas.clientHeight;
        ctx2d.clearRect(0, 0, w, h);

        // subtle grid
        const gridStep = 64;
        const dark = isDark();
        ctx2d.strokeStyle = dark ? "rgba(255,255,255,0.035)" : "rgba(20,15,30,0.045)";
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        const offset = (t * 6) % gridStep;
        for (let x = -gridStep + offset; x < w + gridStep; x += gridStep) {
          ctx2d.moveTo(x, 0); ctx2d.lineTo(x, h);
        }
        for (let y = -gridStep + offset; y < h + gridStep; y += gridStep) {
          ctx2d.moveTo(0, y); ctx2d.lineTo(w, y);
        }
        ctx2d.stroke();

        // move particles
        const speed = reduce ? 0 : 1;
        for (const p of particles) {
          p.x += p.vx * dt * 0.06 * speed;
          p.y += p.vy * dt * 0.06 * speed;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }

        // connections
        const maxDist = 140;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d < maxDist) {
              const alpha = (1 - d / maxDist) * 0.22;
              ctx2d.strokeStyle = dark
                ? `rgba(255, 200, 210, ${alpha})`
                : `rgba(230, 57, 86, ${alpha})`;
              ctx2d.lineWidth = 0.7;
              ctx2d.beginPath();
              ctx2d.moveTo(a.x, a.y);
              ctx2d.lineTo(b.x, b.y);
              ctx2d.stroke();
            }
          }
        }

        // dots
        for (const p of particles) {
          ctx2d.beginPath();
          ctx2d.fillStyle = dark
            ? `rgba(255, 220, 225, ${p.a})`
            : `rgba(230, 57, 86, ${p.a})`;
          ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* base gradient — always visible even before WebGL paints */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,var(--petal),transparent_70%)] opacity-70" />
      <canvas ref={glRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={cvRef} className="absolute inset-0 h-full w-full" />
      {/* premium blur veil + glass */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  );
}

export default CinematicBackground;