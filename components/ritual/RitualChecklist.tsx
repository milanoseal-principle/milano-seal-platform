"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface RitualChecklistProps {
  items: string[];
  completedCount: number;
}

export function RitualChecklist({ items, completedCount }: RitualChecklistProps) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {items.map((item, idx) => {
        const done = idx < completedCount;
        return (
          <li
            key={idx}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
              color: done ? "rgba(212,175,55,0.88)" : "rgba(176,176,176,0.3)",
              transition: "color 0.45s ease",
            }}
          >
            {idx > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 7.5,
                  top: -9,
                  width: 1,
                  height: 9,
                  background: done
                    ? "rgba(212,175,55,0.4)"
                    : "rgba(176,176,176,0.12)",
                  transition: "background 0.45s ease",
                }}
              />
            )}
            {done ? (
              <CheckCircle2
                size={16}
                style={{ flexShrink: 0, color: "#d4af37" }}
              />
            ) : (
              <Circle
                size={16}
                style={{ flexShrink: 0, color: "rgba(176,176,176,0.22)" }}
              />
            )}
            <span>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}
