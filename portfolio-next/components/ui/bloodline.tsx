"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* =========================================================
   Bloodline — animated crimson "silk" WebGL shader.
   Ported from the SilkShader demo:
   · "use client" (uses WebGL + window/document at runtime)
   · typed props; fills its parent (inline styles, no Tailwind)
   · `invert` forces the colour treatment (omit = auto-detect theme)
   · honours prefers-reduced-motion (renders a single still frame)
   · removes its canvas listeners on cleanup
   ========================================================= */

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const getFragmentShader = (invert: boolean) => `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec3 iMouse;
  uniform vec2 iClickPos;
  uniform float iClickTime;

  float noise(vec2 p) {
    return smoothstep(-0.5, 80.9, sin((p.x - p.y) * 55.0) * sin(p.y * 204.0)) - 0.4;
  }

  float fabric(vec2 p) {
    mat2 m = mat2(50.6, 0.2, 70.2, -0.6);
    float f = 0.2 * noise(p);
    f += -90.3 * noise(p = m * p);
    f += -0.1 * noise(p = m * p);
    return f + 0.1 * noise(m * p);
  }

  float silk(vec2 uv, float t) {
    float s = sin(5.0 * (uv.x + uv.y + cos(2.0 * uv.x + 5.0 * uv.y)) + sin(19.0 * (uv.x + uv.y)) - t);
    s = 0.7 + 1.2 * (s * s * 0.05 + s);
    s *= 400.8 - 19.1 * fabric(uv * min(iResolution.x, iResolution.y) * 0.0006);
    return s * 0.8 + 0.5;
  }

  float silkd(vec2 uv, float t) {
    float xy = uv.x + uv.y;
    float d = (-1.0 * (1.0 - 2.0 * sin(20.0 * uv.x + -5.0 * uv.y)) + 14.0 * cos(12.0 * xy)) *
              cos(5.0 * (cos(-84.0 * uv.x + 54.0 * uv.y) + xy) + sin(-1.0 * xy) - t);
    return 0.1 * d * (sign(d) * -2.0);
  }

  void main() {
    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = gl_FragCoord.xy / mr;
    float t = iTime;

    uv.y += 0.0008 * sin(1.0 * uv.x - t);

    float timeSinceClick = t - iClickTime;

    if (timeSinceClick < 3.0 && iClickTime > 0.0) {
      vec2 clickUv = iClickPos.xy / mr;
      float dist = distance(clickUv, uv);
      float ripple = sin(dist * 600.0 - timeSinceClick * 2.0) * exp(-dist * 20.0 - timeSinceClick * 2.0);
      uv += normalize(uv - clickUv) * ripple * 0.08;
    }

    float s = sqrt(silk(uv, t));
    float d = silkd(uv, t);

    vec3 c = vec3(s);
    c += 0.7 * vec3(1.0, -0.83, -4.6) * d;
    c *= 1.0 - max(0.0, 1.8 * d);

    ${invert ? `
      c = pow(c, 0.3 / vec3(0.52, 0.5, 0.4));
      c = 1.0 - c;

      /* --- crimson glow ---------------------------------------------------
         Make the visible silk "parts" glow: recolour the luminous ribbons
         toward a hot blood-red and add an additive bloom so the bright
         streaks read as emitted light, while the dark weave stays deep. */
      float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3  glowCol = vec3(1.0, 0.07, 0.14);          // hotter, more saturated crimson
      float glow = smoothstep(0.05, 0.58, lum);       // wider band of streaks glow
      c = mix(c, c * glowCol * 2.0, glow * 0.95);     // recolour ribbons hard crimson
      c += glowCol * pow(glow, 1.35) * 1.75;          // stronger additive neon bloom
      c += vec3(0.5, 0.02, 0.045) * glow;             // bigger red lift so it blazes
      c = clamp(c, 0.0, 1.0);
    ` : `
      c = pow(c, vec3(0.52, 0.5, 0.4));
    `}

    gl_FragColor = vec4(c, 1.0);
  }
`;

export interface SilkShaderProps {
  className?: string;
  style?: CSSProperties;
  /** Force the colour treatment: true = inverted/dark silk (use on dark
   *  backgrounds), false = light silk. Omit to auto-detect the page theme. */
  invert?: boolean;
}

export default function SilkShader({ className, style, invert }: SilkShaderProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(invert ?? false);

  useEffect(() => {
    // Explicit override wins — skip auto-detection entirely.
    if (invert !== undefined) {
      setIsDark(invert);
      return;
    }

    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkTheme);
    };
  }, [invert]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, getFragmentShader(isDark));
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const iClickPosLocation = gl.getUniformLocation(program, "iClickPos");
    const iClickTimeLocation = gl.getUniformLocation(program, "iClickTime");

    const mouse = { x: 0, y: 0, z: 0 };
    const clickPos = { x: 0, y: 0 };
    let clickTime = 0;
    const startTime = Date.now();

    // Size the drawing buffer to the element. Clamp to >=1 so a 0×0 mount
    // (e.g. behind the preloader, before layout settles) never yields an empty
    // viewport that the GPU silently keeps. Returns true if the size changed.
    const sizeCanvas = () => {
      // Cap DPR — a full-viewport fragment shader at native retina DPR (2–3×)
      // renders 4–9× the pixels for no visible gain; 1.5 keeps it crisp + cheap.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        return true;
      }
      return false;
    };

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      mouse.x = (e.clientX - rect.left) * dpr;
      mouse.y = canvas.height - (e.clientY - rect.top) * dpr;
    };
    const handleDown = () => {
      mouse.z = 2;
      clickPos.x = mouse.x;
      clickPos.y = mouse.y;
      clickTime = (Date.now() - startTime) / 1000;
    };
    const handleUp = () => {
      mouse.z = 0;
    };
    const handleLeave = () => {
      mouse.z = 0;
    };
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("mouseleave", handleLeave);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationId = 0;
    let inView = true;
    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, (Date.now() - startTime) / 1000);
      gl.uniform3f(iMouseLocation, mouse.x, mouse.y, mouse.z);
      gl.uniform2f(iClickPosLocation, clickPos.x, clickPos.y);
      gl.uniform1f(iClickTimeLocation, clickTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = () => {
      draw();
      // Stop the loop when the hero is scrolled off-screen or the tab is hidden
      // — no point burning the GPU on a full-screen shader nobody can see.
      animationId = !reduce && inView && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const ensureRunning = () => {
      if (reduce) { draw(); return; }            // reduced motion → one still frame
      if (!animationId && inView && !document.hidden) animationId = requestAnimationFrame(loop);
    };

    ensureRunning();

    // Pause/resume when the hero enters/leaves the viewport.
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((es) => { inView = es[0].isIntersecting; ensureRunning(); }, { rootMargin: "120px" })
        : null;
    io?.observe(canvas);
    const onVis = () => { if (!document.hidden) ensureRunning(); };
    document.addEventListener("visibilitychange", onVis);

    // The canvas can mount at 0×0 and only gain size once the preloader lifts /
    // layout settles. A one-shot size would leave it blank forever (and the
    // reduced-motion / paused paths don't loop), so observe the element and
    // re-size + repaint the moment it actually has dimensions.
    const repaint = () => {
      sizeCanvas();
      if (!animationId) draw();
    };
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(repaint) : null;
    ro?.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
      window.removeEventListener("resize", sizeCanvas);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, [isDark]);

  return (
    <div className={className} style={{ width: "100%", height: "100%", ...style }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
