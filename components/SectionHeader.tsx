interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const alignClass =
    align === "center" ? "text-center mx-auto items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-1 ${alignClass}`}>
      {eyebrow && (
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8A8680]">
          {eyebrow}
        </span>
      )}
      <h2
        className="font-heading text-2xl sm:text-3xl uppercase tracking-[0.18em] mt-1"
        style={{ color: "#0F0F0F" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-xl text-[#8A8680] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
