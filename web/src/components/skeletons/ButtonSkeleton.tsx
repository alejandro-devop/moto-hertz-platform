interface ButtonSkeletonProps {
  size?: "sm" | "md" | "lg";
  width?: string;
  className?: string;
}

export default function ButtonSkeleton({
  size = "md",
  width = "w-32",
  className = "",
}: ButtonSkeletonProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div
      className={`${width} ${sizeClasses[size]} bg-gray-200 rounded-lg animate-pulse relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    </div>
  );
}
