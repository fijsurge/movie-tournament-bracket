"use client";

import { useRef, useState } from "react";
import { PRESET_AVATARS } from "@/lib/avatars";
import { Avatar } from "@/components/shared/Avatar";
import { UploadIcon } from "@/components/shared/Icons";

const MAX_DIMENSION = 96;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarPicker({
  name,
  displayName,
  initialValue = "",
}: {
  name: string;
  displayName: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataUrl(file);
      setValue(dataUrl);
    } catch {
      // silently ignore — falls back to initial-letter avatar
    }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        <Avatar name={displayName || "?"} avatar={value || null} size="lg" />
        <div className="flex flex-wrap gap-1.5">
          {PRESET_AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setValue(emoji)}
              aria-pressed={value === emoji}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-base transition active:scale-90 ${
                value === emoji ? "border-gold bg-gold/15" : "border-gold/20 hover:border-gold/50 active:border-gold/50"
              }`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-cream-dim transition hover:border-gold/50 active:scale-90 active:border-gold/50"
            aria-label="Upload photo"
          >
            <UploadIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
