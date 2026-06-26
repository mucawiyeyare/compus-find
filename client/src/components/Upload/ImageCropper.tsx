import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number; // e.g., 1 for square (avatar), 1.6 for book cover, etc.
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageSrc,
  aspectRatio = 1,
  onCropComplete,
  onCancel
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      drawCanvas();
    };
  }, [imageSrc]);

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, offset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Move to center of canvas to rotate & scale
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered
    const drawWidth = canvas.width;
    const drawHeight = (img.height / img.width) * canvas.width;
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw crop guidelines overlay (e.g. circle for avatar, rectangle for post)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    if (aspectRatio === 1) {
      // Circle guideline
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2.2, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Rectangle guideline
      const cropW = canvas.width * 0.9;
      const cropH = cropW / aspectRatio;
      ctx.strokeRect(
        (canvas.width - cropW) / 2,
        (canvas.height - cropH) / 2,
        cropW,
        cropH
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCroppedImage = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // Determine target crop region
    let cropWidth = canvas.width * 0.9;
    let cropHeight = cropWidth / aspectRatio;
    if (aspectRatio === 1) {
      cropWidth = canvas.width / 1.1;
      cropHeight = cropWidth;
    }

    exportCanvas.width = cropWidth;
    exportCanvas.height = cropHeight;

    exportCtx.save();
    // Align centers
    exportCtx.translate(cropWidth / 2, cropHeight / 2);
    // Apply offset relative to the crop region
    exportCtx.translate(offset.x, offset.y);
    exportCtx.rotate((rotation * Math.PI) / 180);
    exportCtx.scale(zoom, zoom);

    const drawWidth = canvas.width;
    const drawHeight = (img.height / img.width) * canvas.width;
    exportCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    exportCtx.restore();

    exportCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/webp', 0.85);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="font-semibold text-white">Adjust & Crop Image</h3>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex justify-center bg-slate-950 p-6 select-none">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move border border-slate-800 rounded-xl"
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300 pointer-events-none">
            Drag to pan image
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 p-6">
          {/* Zoom Slider */}
          <div className="flex items-center justify-between gap-4">
            <ZoomOut className="h-4 w-4 text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
            <ZoomIn className="h-4 w-4 text-slate-400" />
          </div>

          {/* Rotate Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Rotation</span>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Rotate 90°
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-800 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={getCroppedImage}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition"
            >
              <Check className="h-4 w-4" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
