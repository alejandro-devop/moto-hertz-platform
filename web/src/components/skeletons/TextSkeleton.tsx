interface TextSkeletonProps {
  lines?: number;
  width?: string;
  className?: string;
}

export default function TextSkeleton({
  lines = 1,
  width = "w-full",
  className = "",
}: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded animate-pulse relative overflow-hidden ${
            index === lines - 1 ? "w-3/4" : width
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      ))}
    </div>
  );
}
