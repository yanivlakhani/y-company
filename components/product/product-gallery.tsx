"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  borderClassName: string;
};

export function ProductGallery({ images, borderClassName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={`relative aspect-square w-full border ${borderClassName}`} />
    );
  }

  const selected = images[selectedIndex] ?? images[0];

  return (
    <div className="space-y-4">
      <div className={`relative aspect-square w-full border ${borderClassName}`}>
        <Image
          src={selected}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 480px"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2">
          {images.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square w-full rounded-none border transition-opacity duration-200 ease-out ${borderClassName} ${
                  index === selectedIndex ? "opacity-100" : "opacity-50 hover:opacity-80"
                }`}
                aria-label={`view image ${index + 1}`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="120px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
