interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export default function StarRating({
  rating,
  count,
  size = "sm",
}: StarRatingProps) {
  const starSize = size === "sm" ? 12 : 16;
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex" aria-label={`${clampedRating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercentage = Math.max(
            0,
            Math.min(1, clampedRating - index)
          );
          return (
            <span
              key={index}
              className="relative inline-block"
              style={{ width: starSize, height: starSize }}
            >
              <svg
                width={starSize}
                height={starSize}
                viewBox="0 0 24 24"
                fill="#E8E4DD"
                className="absolute inset-0"
                aria-hidden
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <svg
                  width={starSize}
                  height={starSize}
                  viewBox="0 0 24 24"
                  fill="#1A1A1A"
                  aria-hidden
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </span>
          );
        })}
      </div>
      {typeof count === "number" && (
        <span className="text-[11px] font-mono uppercase text-[#8A8680]">
          ({count})
        </span>
      )}
    </div>
  );
}
