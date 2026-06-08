"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import {
  DEFAULT_PROJECT_IMAGE_CROP,
  type ProjectImageCropMeta,
} from "@/lib/project-image-crop";

export type ProjectImageCropFieldState = {
  meta: ProjectImageCropMeta;
  croppedAreaPixels: Area | null;
  dirty: boolean;
};

type ProjectImageCropFieldProps = {
  imageSrc: string;
  aspect: number;
  initialCrop?: ProjectImageCropMeta | null;
  initialAdjusting?: boolean;
  containerClassName: string;
  onCropStateChange: (state: ProjectImageCropFieldState) => void;
};

const adjustButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

export function ProjectImageCropField({
  imageSrc,
  aspect,
  initialCrop,
  initialAdjusting = false,
  containerClassName,
  onCropStateChange,
}: ProjectImageCropFieldProps) {
  const starting = initialCrop ?? DEFAULT_PROJECT_IMAGE_CROP;
  const [crop, setCrop] = useState(starting.crop);
  const [zoom, setZoom] = useState(starting.zoom);
  const [dirty, setDirty] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(initialAdjusting);

  useEffect(() => {
    setIsAdjusting(initialAdjusting);
  }, [imageSrc, initialAdjusting]);

  const emit = useCallback(
    (
      meta: ProjectImageCropMeta,
      pixels: Area | null,
      isDirty: boolean,
    ) => {
      onCropStateChange({ meta, croppedAreaPixels: pixels, dirty: isDirty });
    },
    [onCropStateChange],
  );

  const onCropComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
      emit({ crop, zoom }, pixels, dirty);
    },
    [crop, zoom, dirty, emit],
  );

  return (
    <div className="space-y-2">
      <div className={`relative ${containerClassName}`}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          zoomWithScroll={isAdjusting}
          onTouchRequest={isAdjusting ? undefined : () => false}
          onWheelRequest={isAdjusting ? undefined : () => false}
          cropperProps={
            isAdjusting ? undefined : { className: "pointer-events-none" }
          }
          onCropChange={(next) => {
            if (!isAdjusting) return;
            setCrop(next);
            setDirty(true);
            emit({ crop: next, zoom }, croppedAreaPixels, true);
          }}
          onZoomChange={(next) => {
            if (!isAdjusting) return;
            setZoom(next);
            setDirty(true);
            emit({ crop, zoom: next }, croppedAreaPixels, true);
          }}
          onCropComplete={onCropComplete}
        />
      </div>
      {isAdjusting ? (
        <>
          <p className="text-xs text-slate-500 text-center">
            Drag to reposition. Use the slider to zoom.
          </p>
          <label className="flex items-center gap-3 px-1">
            <span className="text-xs text-slate-600 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                const next = Number(e.target.value);
                setZoom(next);
                setDirty(true);
                emit({ crop, zoom: next }, croppedAreaPixels, true);
              }}
              className="w-full accent-[#22c55e]"
              aria-label="Zoom image"
            />
          </label>
          <div className="flex justify-center">
            <button
              type="button"
              className={adjustButtonClass}
              onClick={() => setIsAdjusting(false)}
            >
              Done
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            className={adjustButtonClass}
            onClick={() => setIsAdjusting(true)}
          >
            Adjust framing
          </button>
        </div>
      )}
    </div>
  );
}
