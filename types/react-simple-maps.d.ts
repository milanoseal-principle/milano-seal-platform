declare module "react-simple-maps" {
  import { ReactNode, CSSProperties, MouseEvent } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    onMoveStart?: (position: {
      coordinates: [number, number];
      zoom: number;
    }) => void;
    onMove?: (position: {
      x: number;
      y: number;
      zoom: number;
      dragging: boolean;
    }) => void;
    onMoveEnd?: (position: {
      coordinates: [number, number];
      zoom: number;
    }) => void;
    translateExtent?: [[number, number], [number, number]];
    minZoom?: number;
    maxZoom?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
    parseGeographies?: (features: Geography[]) => Geography[];
  }

  export interface Geography {
    rsmKey: string;
    properties: Record<string, string | number | boolean>;
    geometry: object;
    type: string;
  }

  export interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
  }

  export interface GeographyProps {
    geography: Geography;
    style?: {
      default?: GeographyStyle;
      hover?: GeographyStyle;
      pressed?: GeographyStyle;
    };
    onClick?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void;
    className?: string;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: {
    coordinates: [number, number];
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
  }): JSX.Element;
  export function Line(props: {
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    className?: string;
  }): JSX.Element;
}
