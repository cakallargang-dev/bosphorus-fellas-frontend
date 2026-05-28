import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 24,
  text,
  className = "",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Loader2
        className="animate-spin text-mancave-blue"
        style={{ width: size, height: size }}
      />
      {text && <p className="text-sm text-mancave-muted">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mancave-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-mancave-blue/30 border-t-mancave-blue animate-spin" />
        <p className="text-mancave-muted text-sm tracking-wider">YÜKLENİYOR</p>
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-mancave-card border border-mancave-border rounded-lg p-5 ${className}`}
    >
      <div className="skeleton h-4 w-3/4 rounded mb-3" />
      <div className="skeleton h-3 w-full rounded mb-2" />
      <div className="skeleton h-3 w-2/3 rounded mb-4" />
      <div className="skeleton h-8 w-24 rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-mancave-card border border-mancave-border rounded-lg"
        >
          <div className="skeleton h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-2 w-1/2 rounded" />
          </div>
          <div className="skeleton h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
