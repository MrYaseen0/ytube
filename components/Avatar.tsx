import { avatarColor } from "@/lib/format";

export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className={`${avatarColor(name)} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-label={name}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
