import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Person } from "@/lib/types";

function firstName(name: string): string {
  return name.replace(/^(د\.|أ\.)\s*/u, "").trim().split(/\s+/u)[0] ?? name;
}

/** Portrait for a speaker/moderator. Falls back to initials — never stock imagery. */
export function PersonPortrait({
  person,
  className,
  ratio = "portrait",
}: {
  person: Person;
  className?: string;
  ratio?: "portrait" | "square";
}) {
  const shape = ratio === "portrait" ? "aspect-[4/5]" : "aspect-square";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] bg-cream-deep",
        shape,
        className,
      )}
    >
      {person.image_url ? (
        <Image
          src={person.image_url}
          alt={person.name_ar}
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-3">
          <span className="font-display text-[0.95rem] font-medium leading-tight text-olive/60">
            {firstName(person.name_ar)}
          </span>
        </div>
      )}
    </div>
  );
}

export function PersonAvatarSmall({ person }: { person: Person }) {
  return (
    <span className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-deep">
      {person.image_url ? (
        <Image
          src={person.image_url}
          alt={person.name_ar}
          fill
          sizes="36px"
          className="object-cover"
        />
      ) : (
        <span className="font-display text-[0.85rem] text-olive/60">
          {firstName(person.name_ar).slice(0, 2)}
        </span>
      )}
    </span>
  );
}
