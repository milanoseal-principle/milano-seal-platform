"use client";

import { useEffect, useRef } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DESTINATIONS, type Destination } from "@/data/destinations";

interface FlyToTarget {
  lat: number;
  lng: number;
  zoom: number;
}

function getDestination(name: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

function countryStyle(name: string, isActive: boolean): L.PathOptions {
  const dest = getDestination(name);
  return {
    fillColor: isActive ? "#C6A55A" : dest ? "#1E1A14" : "#0D0D0D",
    fillOpacity: 1,
    color: "#1A1A1A",
    weight: 0.5,
  };
}

interface LayerControlProps {
  active: Destination | null;
  setActive: (d: Destination | null) => void;
  flyTarget: FlyToTarget | null;
}

function LayerControl({ active, setActive, flyTarget }: LayerControlProps) {
  const map = useMap();
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const activeRef = useRef<Destination | null>(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    fetch("/world.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (geoLayerRef.current) {
          map.removeLayer(geoLayerRef.current);
        }

        const layer = L.geoJSON(data, {
          style: (feature) => {
            const name = (feature?.properties?.name as string) ?? "";
            return countryStyle(name, activeRef.current?.name === name);
          },
          onEachFeature: (feature, featureLayer) => {
            const name = (feature?.properties?.name as string) ?? "";
            const dest = getDestination(name);
            if (!dest) return;

            const path = featureLayer as L.Path;
            path.on("mouseover", () => {
              if (activeRef.current?.name !== name) {
                path.setStyle({ fillColor: "#C6A55A", fillOpacity: 0.85 });
                path.bringToFront();
              }
            });
            path.on("mouseout", () => {
              if (activeRef.current?.name !== name) {
                path.setStyle({ fillColor: "#1E1A14", fillOpacity: 1 });
              }
            });
            path.on("click", () => {
              setActive(dest);
            });
          },
        });

        layer.addTo(map);
        geoLayerRef.current = layer;
      });

    return () => {
      if (geoLayerRef.current) {
        map.removeLayer(geoLayerRef.current);
        geoLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((featureLayer) => {
      const l = featureLayer as L.Path & { feature?: GeoJSON.Feature };
      const name = (l.feature?.properties?.name as string) ?? "";
      l.setStyle(countryStyle(name, active?.name === name));
    });
  }, [active]);

  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom, {
        duration: 0.8,
      });
    }
  }, [flyTarget, map]);

  return null;
}

interface Props {
  active: Destination | null;
  setActive: (d: Destination | null) => void;
  flyTarget: FlyToTarget | null;
}

export default function MapInner({ active, setActive, flyTarget }: Props) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ width: "100%", height: "480px", background: "#0A0A0A" }}
      zoomControl={false}
      attributionControl={false}
      maxBounds={[
        [-90, -180],
        [90, 180],
      ]}
      maxBoundsViscosity={1.0}
      minZoom={1}
      maxZoom={8}
    >
      <LayerControl
        active={active}
        setActive={setActive}
        flyTarget={flyTarget}
      />
    </MapContainer>
  );
}
