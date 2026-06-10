"use client";

import React, { useEffect, useRef, useState } from "react";

interface NodeLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
  isOrigin?: boolean;
}

type ProjectedNode = NodeLocation & {
  x: number;
  y: number;
  zDepth: number;
  visible: boolean;
};

const NODES: NodeLocation[] = [
  { id: "fl", label: "FLORIDA", lat: 27.6, lng: -82.3, isOrigin: true },
  { id: "mx", label: "MEXICO", lat: 23.6, lng: -102.5 },
  { id: "co", label: "COLOMBIA", lat: 4.5, lng: -74.2 },
  { id: "br", label: "BRAZIL", lat: -14.2, lng: -51.9 },
  { id: "ca", label: "CANADA", lat: 56.1, lng: -106.3 },
  { id: "pt", label: "PORTUGAL", lat: 39.3, lng: -8.2 },
  { id: "uk", label: "UK", lat: 55.3, lng: -3.4 },
  { id: "es", label: "SPAIN", lat: 40.4, lng: -3.7 },
  { id: "it", label: "ITALY", lat: 41.8, lng: 12.5 },
  { id: "gr", label: "GREECE", lat: 39.0, lng: 22.0 },
  { id: "ae", label: "UAE", lat: 23.4, lng: 53.8 },
];

function quadratic(t: number, a: number, b: number, c: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

function projectNode(node: NodeLocation, rotation: number, centerX: number, centerY: number, radius: number): ProjectedNode {
  const radLat = (node.lat * Math.PI) / 180;
  const radLng = (node.lng * Math.PI) / 180 + rotation;

  const x3d = Math.cos(radLat) * Math.sin(radLng);
  const y3d = Math.sin(radLat);
  const z3d = Math.cos(radLat) * Math.cos(radLng);

  return {
    ...node,
    x: centerX + x3d * radius,
    y: centerY - y3d * (radius * 0.75),
    zDepth: z3d,
    visible: z3d > -0.2,
  };
}

export function WorldMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [projectedNodes, setProjectedNodes] = useState<ProjectedNode[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1080;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 380;

    canvas.width = width;
    canvas.height = height;

    const render = () => {
      rotationRef.current += 0.0035;
      const rotation = rotationRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(4, 3, 2, 0.25)";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const updatedNodes = NODES.map((node) => projectNode(node, rotation, centerX, centerY, radius));
      setProjectedNodes(updatedNodes);

      const originNode = updatedNodes.find((node) => node.isOrigin);

      if (originNode) {
        updatedNodes.forEach((target) => {
          if (target.id === originNode.id) return;

          const combinedVisibility = (originNode.zDepth + 1) * (target.zDepth + 1);
          if (combinedVisibility < 0.4) return;

          const targetDepth = Math.max(0, target.zDepth);
          const midX = (originNode.x + target.x) / 2;
          const midY = (originNode.y + target.y) / 2 - Math.abs(originNode.x - target.x) * 0.25;

          ctx.save();
          const vectorGlow = ctx.createLinearGradient(originNode.x, originNode.y, target.x, target.y);
          vectorGlow.addColorStop(0, "rgba(255, 234, 179, 0.78)");
          vectorGlow.addColorStop(0.3, "rgba(214, 181, 112, 0.42)");
          vectorGlow.addColorStop(1, `rgba(138, 100, 40, ${targetDepth})`);

          ctx.strokeStyle = vectorGlow;
          ctx.lineWidth = originNode.zDepth > 0 ? 2.5 : 1;
          ctx.beginPath();
          ctx.moveTo(originNode.x, originNode.y);
          ctx.quadraticCurveTo(midX, midY, target.x, target.y);
          ctx.stroke();

          const scanTime = (Date.now() * 0.0012) % 1;
          const particleX = quadratic(scanTime, originNode.x, midX, target.x);
          const particleY = quadratic(scanTime, originNode.y, midY, target.y);

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffd685";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      for (let i = 0; i < 30; i += 1) {
        const starAngle = (i * 12 * Math.PI) / 180 + rotation * 0.4;
        const starRadius = radius * (0.3 + (i % 3) * 0.2);
        const sx = centerX + Math.cos(starAngle) * starRadius;
        const sy = centerY + Math.sin(starAngle) * radius * 0.6 * (0.3 + (i % 3) * 0.2);

        ctx.fillStyle = `rgba(252, 235, 194, ${0.1 + (i % 4) * 0.08})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 65,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1080,
          height: 1080,
          mixBlendMode: "screen",
          opacity: 0.75,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 65,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1080,
          height: 1080,
          pointerEvents: "none",
        }}
      >
        {projectedNodes.map((node) => {
          if (!node.visible) return null;

          const scale = 0.5 + (node.zDepth + 1) * 0.25;
          const opacity = Math.max(0, (node.zDepth + 0.2) / 1.2);

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 150ms ease-out",
                willChange: "transform, opacity",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: node.isOrigin ? 32 : 20,
                    height: node.isOrigin ? 32 : 20,
                    borderRadius: 999,
                    background: node.isOrigin ? "rgba(255,255,255,0.45)" : "rgba(251,191,36,0.45)",
                    boxShadow: node.isOrigin
                      ? "0 0 28px rgba(255,255,255,0.42), 0 0 42px rgba(212,175,55,0.42)"
                      : "0 0 22px rgba(251,191,36,0.36)",
                  }}
                />
                <div
                  style={{
                    width: node.isOrigin ? 16 : 10,
                    height: node.isOrigin ? 16 : 10,
                    borderRadius: 999,
                    background: node.isOrigin ? "#ffffff" : "#1c1408",
                    border: node.isOrigin ? "1px solid rgba(252,211,77,0.85)" : "1px solid rgba(245,158,11,0.85)",
                    boxShadow: node.isOrigin
                      ? "0 0 18px rgba(245,158,11,0.5)"
                      : "0 0 16px rgba(124,45,18,0.55)",
                  }}
                />
              </div>

              <span
                style={{
                  marginTop: 8,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.25em",
                  fontWeight: 700,
                  textAlign: "center",
                  color: node.isOrigin ? "#ffffff" : "#dec083",
                  textShadow: "0 2px 4px rgba(0,0,0,0.95)",
                  whiteSpace: "nowrap",
                }}
              >
                {node.label}
                {node.isOrigin && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontFamily: "monospace",
                      fontSize: 8,
                      letterSpacing: "0.15em",
                      color: "rgba(245,158,11,0.8)",
                      fontWeight: 500,
                    }}
                  >
                    ORIGIN
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorldMapCanvas;
