"use client";

import { useRef, useState, useCallback } from "react";
import { Trash2, Pen } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const startDrawing = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx();
      if (!ctx) return;
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    []
  );

  const draw = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx();
      if (!ctx || !isDrawing) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    checkContent();
  }, []);

  function checkContent() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let has = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        has = true;
        break;
      }
    }
    setHasContent(has);
    if (onSignatureChange) {
      onSignatureChange(has ? canvas.toDataURL("image/png") : null);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    if (onSignatureChange) onSignatureChange(null);
  }

  // Mouse handlers
  function handleMouseDown(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    draw(e.clientX - rect.left, e.clientY - rect.top);
  }

  // Touch handlers
  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Pen className="w-4 h-4" />
          Signature du client
        </p>
        {hasContent && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        )}
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="w-full h-32 cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-[10px] text-gray-400">
        Signez avec votre souris ou votre doigt (sur écran tactile)
      </p>
    </div>
  );
}
