"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export function AllianceMotionHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const NODE_COUNT = 32;
    const CONNECT_DIST = 120;

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1.5 + Math.random() * 2,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(198,166,91,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(198,166,91,0.55)";
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 360,
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 60%, rgba(198,166,91,0.06) 0%, transparent 70%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "0 24px",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(198,166,91,0.6)",
          }}
        >
          The Milano Seal™
        </div>
        <h1
          style={{
            fontSize: "clamp(28px,5vw,52px)",
            fontWeight: 300,
            fontFamily: "var(--font-playfair, Georgia, serif)",
            color: "#F6F1E6",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Global Execution Alliance
        </h1>
        <p
          style={{
            fontSize: "clamp(13px,2vw,16px)",
            color: "#A8A29A",
            maxWidth: 560,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Partner infrastructure for international document execution, apostille coordination,
          referral visibility, and controlled client handoff.
        </p>
      </div>
    </div>
  );
}
