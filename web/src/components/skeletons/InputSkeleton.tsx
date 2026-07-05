interface InputSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function InputSkeleton({
  width = "w-full",
  height = "h-10",
  className = "",
}: InputSkeletonProps) {
  return (
    <div
      className={`${width} ${height} bg-gray-200 rounded-md animate-pulse relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    </div>
  );
}
