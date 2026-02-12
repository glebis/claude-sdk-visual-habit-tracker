import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface ProgressArtProps {
  latestImage: string | null;
  onRequestArt: () => void;
  onRequestWelcomeArt?: () => void;
  isGenerating: boolean;
  hideHeader?: boolean;
}

export function ProgressArt({
  latestImage,
  onRequestArt,
  onRequestWelcomeArt,
  isGenerating,
  hideHeader,
}: ProgressArtProps) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loaded, setLoaded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isNewReveal, setIsNewReveal] = useState(false);
  const welcomeTriggered = useRef(false);
  const prevImageRef = useRef<string | null>(null);

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
      if (images.length > 0) {
        setCurrentIndex(images.length - 1);
      }
    });
  }, [fetchGallery]);

  // Trigger welcome art when gallery is confirmed empty and websocket is ready
  useEffect(() => {
    if (
      gallery.length === 0 &&
      !welcomeTriggered.current &&
      onRequestWelcomeArt &&
      !isGenerating
    ) {
      // Small delay to ensure websocket is connected
      const timer = setTimeout(() => {
        if (!welcomeTriggered.current) {
          welcomeTriggered.current = true;
          onRequestWelcomeArt();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gallery.length, onRequestWelcomeArt, isGenerating]);

  // When a new image arrives via websocket, refresh gallery and jump to it
  useEffect(() => {
    if (!latestImage) return;
    setIsNewReveal(true);
    setLoaded(false);
    fetchGallery().then((images) => {
      const idx = images.indexOf(latestImage);
      if (idx >= 0) setCurrentIndex(idx);
      else if (images.length > 0) setCurrentIndex(images.length - 1);
    });
  }, [latestImage, fetchGallery]);

  // Track image changes to distinguish new reveals from gallery navigation
  const currentImage = gallery[currentIndex] ?? null;
  const imageUrl = currentImage ? `/api/images/${currentImage}` : null;

  useEffect(() => {
    if (imageUrl && imageUrl !== prevImageRef.current) {
      prevImageRef.current = imageUrl;
    }
  }, [imageUrl]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < gallery.length - 1;

  return (
    <div className="flex flex-col h-full gap-3">
      {!hideHeader && (
        <div className="flex items-center justify-between shrink-0">
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
      )}

      <div
        className="relative rounded-sm overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Progress art reflecting your habit streaks"
              loading="lazy"
              className={`w-full rounded-sm ${
                loaded
                  ? isNewReveal
                    ? "animate-press-reveal"
                    : "opacity-100 transition-opacity duration-500"
                  : "opacity-0"
              }`}
              onLoad={() => setLoaded(true)}
              onAnimationEnd={() => setIsNewReveal(false)}
              key={imageUrl}
            />

            {/* Generating overlay -- breathing pulse + scan line */}
            {isGenerating && (
              <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-background/40 animate-breathe" />
                <div
                  className="absolute inset-x-0 h-8 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
                  style={{ animation: "scan-sweep 2.4s cubic-bezier(0.37, 0, 0.63, 1) infinite" }}
                />
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium text-foreground bg-background/80 px-3 py-1 rounded-sm">
                  Generating...
                </p>
              </div>
            )}

            {/* Gallery counter overlay (when header is hidden) */}
            {hideHeader && gallery.length > 1 && (
              <span
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-background/70 text-foreground px-2 py-0.5 rounded-sm transition-opacity duration-300"
                style={{ opacity: hovering ? 1 : 0 }}
              >
                {currentIndex + 1}/{gallery.length}
              </span>
            )}

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
          <div className="relative text-center text-muted-foreground text-sm p-6 overflow-hidden">
            {isGenerating ? (
              <>
                <div
                  className="absolute inset-x-0 h-8 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent pointer-events-none"
                  style={{ animation: "scan-sweep 2.4s cubic-bezier(0.37, 0, 0.63, 1) infinite" }}
                />
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-breathe" />
                <p className="font-medium">Creating your artwork...</p>
                <p className="text-xs mt-1">
                  The agent is crafting something special.
                </p>
              </>
            ) : (
              <>
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Your progress, illustrated</p>
                <p className="text-xs mt-1">
                  Complete a few habits, then hit Generate.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
