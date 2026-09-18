import React, { useState } from 'react';
import { Play, AlertCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

interface YouTubePlayerProps {
  url?: string;
  videoId?: string;
  title?: string;
  fallbackVideoId?: string;
}

export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;

  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // https://youtu.be/VIDEO_ID
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  // https://www.youtube.com/watch?v=VIDEO_ID or embed/VIDEO_ID
  const youtubeMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch && youtubeMatch[1]) {
    return youtubeMatch[1];
  }

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  return null;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  videoId,
  title = 'Educational Video Lesson',
  fallbackVideoId,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(videoId || extractYouTubeId(url));

  const resolvedId = activeId || videoId || extractYouTubeId(url);

  const handleUseFallback = () => {
    if (fallbackVideoId) {
      setActiveId(fallbackVideoId);
      setHasError(false);
      setIsLoading(true);
      setIsPlaying(true);
    }
  };

  if (!resolvedId || hasError) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gray-900 border border-gray-800 flex flex-col items-center justify-center p-6 text-center text-gray-300 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-gray-800/90 border border-gray-700 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-base text-white">No relevant video available</h4>
        <p className="text-xs text-gray-400 max-w-sm mt-1 mb-5 leading-relaxed">
          No verified course-specific video is currently available for this module. Please review the official curricular reading materials and lesson objectives below.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {fallbackVideoId && fallbackVideoId !== resolvedId && (
            <button
              onClick={handleUseFallback}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Play Alternate Verified Lesson
            </button>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 text-gray-200 text-xs font-semibold hover:bg-gray-700 transition-colors border border-gray-700 shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Lesson on YouTube
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-200 group">
      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center text-gray-400 z-10">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
          <span className="text-xs font-medium tracking-wide">Loading educational video stream...</span>
        </div>
      )}

      {/* Embedded Player */}
      <iframe
        className="w-full h-full border-0"
        src={`https://www.youtube-nocookie.com/embed/${resolvedId}?rel=0&modestbranding=1&enablejsapi=1&autoplay=${isPlaying ? 1 : 0}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
};
