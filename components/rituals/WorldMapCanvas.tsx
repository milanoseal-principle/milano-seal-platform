"use client";

import { useEffect, useRef, useCallback } from "react";

const NODES: [number, number][] = [
  [-80.19,  25.77], [-74.01,  40.71], [ 12.49,  41.90], [  2.35,  48.86],
  [ 55.30,  25.20], [139.69,  35.69], [-46.63, -23.55], [-74.07,   4.71],
  [-99.13,  19.43], [ -3.70,  40.42], [103.82,   1.35], [ 28.98,  41.01],
  [151.21, -33.87],
];

const ARC_PAIRS: [number, number][] = [
  [0,1],[0,3],[0,2],[0,6],[0,7],[0,8],[0,9],
  [3,4],[2,11],[4,10],[3,9],[1,5],[5,12],
];

function project(lon: number, lat: number, w: number, h: number): [number, number] {
  const scale = Math.min(w / 360, h / 180);
  const ox = (w - 360 * scale) / 2;
  const oy = (h - 180 * scale) / 2;
  return [ox + (lon + 180) * scale, oy + (90 - lat) * scale];
}

function quad(t: number, a: number, b: number, c: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

const idle = (cb: () => void) =>
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback(cb, { timeout: 2000 })
    : setTimeout(cb, 100);

export function WorldMapCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef       = useRef<number>(0);
  const t0Ref        = useRef<number>(0);

  const render = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!t0Ref.current) t0Ref.current = now;
    const s = (now - t0Ref.current) / 1000;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (offscreenRef.current && s > 0.35) {
      const alpha = Math.min((s - 0.35) / 1.0, 1) * 0.22;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(offscreenRef.current, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    if (s > 1.05) {
      ARC_PAIRS.forEach(([ai, bi], idx) => {
        const delay    = 1.05 + idx * 0.1;
        const progress = Math.min(Math.max((s - delay) / 0.65, 0), 1);
        if (progress <= 0) return;

        const [x1, y1] = project(NODES[ai][0], NODES[ai][1], W, H);
        const [x2, y2] = project(NODES[bi][0], NODES[bi][1], W, H);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.28 - 30;

        ctx.save();
        ctx.strokeStyle = `rgba(212,175,55,${Math.min(progress, 0.85) * 0.38})`;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        const steps = 60;
        for (let k = 0; k <= Math.floor(steps * progress); k++) {
          const t  = k / steps;
          const bx = quad(t, x1, cx, x2);
          const by = quad(t, y1, cy, y2);
          k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        if (progress < 1) {
          const dx = quad(progress, x1, cx, x2);
          const dy = quad(progress, y1, cy, y2);
          const g  = ctx.createRadialGradient(dx, dy, 0, dx, dy, 5);
          g.addColorStop(0, "rgba(244,229,184,0.95)");
          g.addColorStop(1, "rgba(212,175,55,0)");
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.restore();
      });
    }

    if (s > 0.75) {
      const [x, y] = project(NODES[0][0], NODES[0][1], W, H);
      const alpha  = Math.min((s - 0.75) / 0.35, 1);
      const pulse  = Math.sin(s * 2.5) * 0.5 + 0.5;

      if (s < 1.25) {
        const ignProg  = Math.min((s - 0.75) / 0.5, 1);
        const ignR     = 50 * ignProg;
        const ignAlpha = (1 - ignProg) * 0.55 * alpha;
        if (ignAlpha > 0) {
          ctx.beginPath();
          ctx.arc(x, y, ignR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212,175,55,${ignAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      const g = ctx.createRadialGradient(x, y, 0, x, y, 28 + pulse * 10);
      g.addColorStop(0, `rgba(244,229,184,${0.88 * alpha})`);
      g.addColorStop(0.3, `rgba(212,175,55,${0.45 * alpha})`);
      g.addColorStop(1, "rgba(212,175,55,0)");
      ctx.beginPath();
      ctx.arc(x, y, 28 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,229,184,${alpha})`;
      ctx.fill();
    }

    if (s > 1.45) {
      for (let i = 1; i < NODES.length; i++) {
        const delay = 1.45 + (i - 1) * 0.06;
        const alpha = Math.min(Math.max((s - delay) / 0.4, 0), 1);
        if (alpha <= 0) continue;

        const [x, y] = project(NODES[i][0], NODES[i][1], W, H);
        const pulse  = Math.sin(s * 1.8 + i * 0.9) * 0.5 + 0.5;

        const gr = ctx.createRadialGradient(x, y, 0, x, y, 11 + pulse * 3);
        gr.addColorStop(0, `rgba(212,175,55,${0.5 * alpha})`);
        gr.addColorStop(1, "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.arc(x, y, 11 + pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,229,184,${alpha * 0.9})`;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    idle(() => {
      fetch("/world.geojson")
        .then((r) => r.json())
        .then((data) => {
          idle(() => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const oc = document.createElement("canvas");
            oc.width = W; oc.height = H;
            const c  = oc.getContext("2d");
            if (!c) return;
            c.strokeStyle = "rgba(212,175,55,1)";
            c.lineWidth   = 0.6;
            c.beginPath();
            for (const f of data.features) {
              const { type, coordinates } = f.geometry;
              const polys = type === "Polygon" ? [coordinates] : coordinates;
              for (const poly of polys) {
                for (const ring of poly) {
                  let first = true;
                  for (const [lon, lat] of ring) {
                    const [x, y] = project(lon, lat, W, H);
                    first ? c.moveTo(x, y) : c.lineTo(x, y);
                    first = false;
                  }
                }
              }
            }
            c.stroke();
            offscreenRef.current = oc;
          });
        })
        .catch(() => {});
    });

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
