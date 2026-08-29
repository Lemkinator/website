// Every step (context/shader compile/link) fails open by returning
// silently: a transparent canvas over Banner's photo, never a visible error state.

const VERTEX_SRC = `#version 300 es
void main() {
  vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 mouse = (u_mouse - 0.5) * aspect;
  float d = length(p - mouse);
  p += (p - mouse) * 0.08 * smoothstep(0.85, 0.0, d);

  float t = u_time * 0.03;
  float n = fbm(p * 1.4 + vec2(t, -t * 0.6));
  n += 0.5 * fbm(p * 2.8 - vec2(t * 0.4, t * 0.25));
  n *= 0.66;

  float glow = smoothstep(0.35, 0.85, n);
  float vignette = smoothstep(1.15, 0.3, length(p));

  outColor = vec4(u_accent, glow * 0.4 * vignette);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function readAccentColor(): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return [0.49, 0.59, 1.0];
  const int = parseInt(match[1], 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

export function initBackdrop(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true });
  if (!ctx) return;
  // Re-bound to a fresh const: TS narrowing on the original binding doesn't
  // carry into the nested closures (frame/resize) declared below.
  const gl: WebGL2RenderingContext = ctx;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!linked) return;

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uAccent = gl.getUniformLocation(program, 'u_accent');
  const accent = readAccentColor();

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let mouse: [number, number] = [0.5, 0.5];
  let docVisible = document.visibilityState === 'visible';
  let inView = false;
  let raf = 0;
  const startTime = performance.now();

  function isActive() {
    return docVisible && inView;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame(now: number) {
    raf = 0;
    if (!isActive()) return;
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - startTime) / 1000);
    gl.uniform2f(uMouse, mouse[0], 1 - mouse[1]);
    gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  function schedule() {
    if (!raf && isActive()) raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', (e) => {
    // isActive() check here (not just in frame()) skips the layout read on
    // every mousemove when offscreen/backgrounded, not just the wasted paint.
    if (!isActive()) return;
    const rect = canvas.getBoundingClientRect();
    mouse = [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
  });

  window.addEventListener('resize', () => {
    resize();
    schedule();
  });

  document.addEventListener('visibilitychange', () => {
    docVisible = document.visibilityState === 'visible';
    if (isActive()) schedule();
  });

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (isActive()) schedule();
    },
    { threshold: 0 },
  ).observe(canvas);

  resize();
}
