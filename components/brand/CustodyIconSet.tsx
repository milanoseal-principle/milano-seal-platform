"use client";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const DEFAULT_COLOR = "#C6A55A";
const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 1.5;

/** Document/envelope outline — Inquiry step */
export function InquiryIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Inquiry"
    >
      {/* Envelope body */}
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      {/* Envelope flap */}
      <polyline points="3,5 12,13 21,5" />
    </svg>
  );
}

/** Checklist/review outline — Qualification step */
export function QualificationIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Qualification"
    >
      {/* Document */}
      <path d="M6 2h9l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M14 2v5h5" />
      {/* Checklist lines */}
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="17" x2="12" y2="17" />
      {/* Check mark */}
      <polyline points="7,11 8,12 9.5,10" />
    </svg>
  );
}

/** Pen/signature outline — Execution step */
export function ExecutionIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Execution"
    >
      {/* Pen body */}
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      {/* Signature underline */}
      <line x1="2" y1="22" x2="22" y2="22" strokeOpacity="0.35" />
    </svg>
  );
}

/** Seal/stamp circle outline — Authentication step */
export function AuthenticationIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Authentication"
    >
      {/* Outer seal ring */}
      <circle cx="12" cy="12" r="9" />
      {/* Inner ring */}
      <circle cx="12" cy="12" r="6" />
      {/* Center mark */}
      <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
      {/* Notch marks at cardinal points (seal detail) */}
      <line x1="12" y1="3" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </svg>
  );
}

/** Courier/package outline — Release step */
export function ReleaseIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Release"
    >
      {/* Package box */}
      <path d="M21 8l-9-5L3 8v8l9 5 9-5V8z" />
      {/* Center vertical seam */}
      <line x1="12" y1="3" x2="12" y2="22" />
      {/* Left and right panel lines */}
      <polyline points="3,8 12,13 21,8" />
    </svg>
  );
}

export interface CustodyStep {
  icon: (props: IconProps) => React.ReactElement;
  label: string;
  description: string;
}

export const CUSTODY_STEPS: CustodyStep[] = [
  { icon: InquiryIcon,        label: "Inquiry",        description: "Intake captured" },
  { icon: QualificationIcon,  label: "Qualification",  description: "Matter reviewed" },
  { icon: ExecutionIcon,      label: "Execution",      description: "Notarization / signing" },
  { icon: AuthenticationIcon, label: "Authentication", description: "Apostille / authority route" },
  { icon: ReleaseIcon,        label: "Release",        description: "Courier custody / certificate" },
];
