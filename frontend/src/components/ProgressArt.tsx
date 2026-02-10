import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface ProgressArtProps {
  latestImage: string | null;
  onRequestArt: () => void;
  isGenerating: boolean;
}

export function ProgressArt({
  latestImage,
  onRequestArt,
  isGenerating,
}: ProgressArtProps) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loaded, setLoaded] = useState(false);
  const [hovering, setHovering] = useState(false);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      if (res.ok) {
        const images: string[] = await res.json();
        setGallery(images);
        return images;
      }
    } catch { /* backend unavailable */ }
    return [];
  }, []);

  // Load gallery on mount
  useEffect(() => {
    fetchGallery().then((images) => {
      if (images.length > 0) setCurrentIndex(images.length - 1);
    });
  }, [fetchGallery]);

  // When a new image arrives via websocket, refresh gallery and jump to it
  useEffect(() => {
    if (!latestImage) return;
    fetchGallery().then((images) => {
      const idx = images.indexOf(latestImage);
      if (idx >= 0) setCurrentIndex(idx);
      else if (images.length > 0) setCurrentIndex(images.length - 1);
    });
  }, [latestImage, fetchGallery]);

  const currentImage = gallery[currentIndex] ?? null;
  const imageUrl = currentImage ? `/api/images/${currentImage}` : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < gallery.length - 1;

  return (
    <Card className="p-5 border-0 shadow-none bg-transparent">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Progress Art
          {gallery.length > 1 && (
            <span className="ml-2 font-light normal-case tracking-normal">
              {currentIndex + 1}/{gallery.length}
            </span>
          )}
        </h2>
        <Button
          variant="default"
          size="sm"
          onClick={onRequestArt}
          disabled={isGenerating}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>

      <div
        className="relative aspect-[16/10] rounded-sm bg-muted/30 flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Arntz-style isotype art reflecting your habit streaks"
              loading="lazy"
              className={`w-full h-full object-cover rounded-sm transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setLoaded(true)}
              key={imageUrl}
            />

            {/* Navigation arrows */}
            {hasPrev && (
              <button
                type="button"
                onClick={() => { setLoaded(false); setCurrentIndex((i) => i - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-1.5 transition-opacity duration-300 ease-in"
                style={{ opacity: hovering ? 1 : 0, pointerEvents: hovering ? "auto" : "none" }}
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={() => { setLoaded(false); setCurrentIndex((i) => i + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-1.5 transition-opacity duration-300 ease-in"
                style={{ opacity: hovering ? 1 : 0, pointerEvents: hovering ? "auto" : "none" }}
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground text-sm p-6">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium">Your progress, illustrated</p>
            <p className="text-xs mt-1">
              Complete a few habits, then hit Generate.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
