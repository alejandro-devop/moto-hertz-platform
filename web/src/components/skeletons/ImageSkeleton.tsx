interface ImageSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function ImageSkeleton({
  width = "w-full",
  height = "h-48",
  className = "",
}: ImageSkeletonProps) {
  return (
    <div
      className={`${width} ${height} bg-gray-200 rounded-lg animate-pulse relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    </div>
  );
}
