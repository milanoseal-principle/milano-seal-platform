"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";

interface FileUploadZoneProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export function FileUploadZone({
  value,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (incoming: File[]) => {
      setError(null);
      const valid: File[] = [];
      for (const file of incoming) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (
          !ACCEPTED_TYPES.includes(file.type) &&
          !ACCEPTED_EXTENSIONS.includes(ext)
        ) {
          setError(
            `${file.name}: unsupported file type. Use PDF or Word (.docx, .doc).`,
          );
          continue;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`${file.name} exceeds ${maxSizeMB} MB limit.`);
          continue;
        }
        if (value.length + valid.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files.`);
          break;
        }
        valid.push(file);
      }
      if (valid.length > 0) onChange([...value, ...valid]);
    },
    [value, onChange, maxFiles, maxSizeMB],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndAdd(Array.from(e.dataTransfer.files));
    },
    [validateAndAdd],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) validateAndAdd(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 p-8 text-center"
        style={{
          borderColor: isDragging
            ? "rgba(198,165,90,0.6)"
            : "rgba(198,165,90,0.25)",
          background: isDragging
            ? "rgba(198,165,90,0.04)"
            : "rgba(17,17,17,0.8)",
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload documents — click or drag and drop"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-[#C6A55A]/50" />
        <p className="text-sm font-medium text-[#B0B0B0]">
          Drop documents here or click to browse
        </p>
        <p className="text-xs text-[#4A4A4A] mt-1">
          PDF, Word (.docx, .doc) · Max {maxSizeMB} MB per file · Up to{" "}
          {maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 bg-[#111111] border border-[#2A2A2A] rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#C6A55A]/60 flex-shrink-0" />
                <span className="text-sm text-[#B0B0B0] truncate">
                  {file.name}
                </span>
                <span className="text-xs text-[#4A4A4A] flex-shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="ml-2 p-1 text-[#4A4A4A] hover:text-[#C6A55A] transition-colors flex-shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
