import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminListPeople } from "@/lib/admin/people";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "الأشخاص",
  robots: { index: false, follow: false },
};

export default async function AdminPeoplePage() {
  const people = await adminListPeople();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 text-ink">الأشخاص</h1>
        <ButtonLink href="/admin/people/new" size="sm">
          + شخص جديد
        </ButtonLink>
      </div>

      {people.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا يوجد أشخاص بعد.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/people/${p.id}`}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line p-3 transition-colors hover:border-olive"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-cream-deep">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.95rem] font-medium text-ink">
                    {p.name_ar}
                  </span>
                  {p.title_ar ? (
                    <span className="block truncate text-[0.85rem] text-muted">
                      {p.title_ar}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
