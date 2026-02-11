import { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captured, setCaptured] = useState<string | null>(null);
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCaptured(null);
    setBlobData(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Could not access camera. Check permissions and try again.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopStream();
      setCaptured(null);
      setBlobData(null);
      setError(null);
    }
    return stopStream;
  }, [open, startCamera, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setBlobData(blob);
        setCaptured(canvas.toDataURL("image/jpeg", 0.85));
      },
      "image/jpeg",
      0.85,
    );
  };

  const handleRetake = () => {
    setCaptured(null);
    setBlobData(null);
    startCamera();
  };

  const handleUse = () => {
    if (!blobData) return;
    const file = new File([blobData], `proof-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take proof photo</DialogTitle>
          <DialogDescription>Snap a photo to verify habit completion.</DialogDescription>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {error ? (
          <p className="text-sm text-destructive text-center py-8">{error}</p>
        ) : captured ? (
          <>
            <img
              src={captured}
              alt="Captured proof"
              className="w-full rounded-sm object-contain"
            />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleRetake}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Retake
              </Button>
              <Button size="sm" onClick={handleUse}>
                Use photo
              </Button>
            </div>
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-sm bg-muted"
            />
            <div className="flex justify-center">
              <Button size="icon" className="rounded-full h-12 w-12" onClick={handleCapture}>
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
