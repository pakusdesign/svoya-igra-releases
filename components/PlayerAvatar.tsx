type PlayerAvatarProps = {
  name: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
};

const sizes = {
  xs: "h-8 w-8 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl"
};

export function PlayerAvatar({ name, avatarUrl, size = "md" }: PlayerAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-prize text-board`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-black">{initial}</div>
      )}
    </div>
  );
}
