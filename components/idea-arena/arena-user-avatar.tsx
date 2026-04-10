import Image from "next/image";

function initialsFromName(displayName: string): string {
  const words = displayName.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function avatarColor(seed: string): string {
  const hues = [200, 160, 40, 280, 340];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h += seed.charCodeAt(i);
  return `hsl(${hues[h % hues.length]} 55% 42%)`;
}

type ArenaUserAvatarProps = {
  displayName: string;
  imageUrl: string | null;
  size: number;
  className?: string;
  title?: string;
};

export function ArenaUserAvatar({
  displayName,
  imageUrl,
  size,
  className = "",
  title,
}: ArenaUserAvatarProps) {
  const label = title ?? displayName;
  const ring = "ring-2 ring-white shadow-sm";

  if (imageUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 rounded-full overflow-hidden ${ring} ${className}`}
        style={{ width: size, height: size }}
        title={label}
      >
        <Image
          src={imageUrl}
          alt=""
          width={size}
          height={size}
          className="object-cover"
        />
      </span>
    );
  }

  const initials = initialsFromName(displayName);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white text-xs font-bold border-2 border-white/30 ${ring} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(displayName || "?"),
        fontSize: Math.max(10, Math.round(size * 0.35)),
      }}
      title={label}
    >
      {initials}
    </span>
  );
}
