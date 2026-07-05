interface ContainerSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ContainerSkeleton({
  width = "w-full",
  height = "h-64",
  className = "",
  children,
}: ContainerSkeletonProps) {
  return (
    <div
      className={`${width} ${height} bg-gray-200 rounded-lg animate-pulse relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      {children && <div className="relative z-10 p-4">{children}</div>}
    </div>
  );
}
