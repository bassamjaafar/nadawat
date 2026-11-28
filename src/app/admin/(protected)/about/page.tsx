import type { Metadata } from "next";
import Link from "next/link";
import { adminListGroups, adminListSections } from "@/lib/admin/about";
import { sectionHasContent } from "@/components/about/about-page-body";
import { Pill } from "@/components/admin/about/pill";
import { SECTION_PURPOSE } from "@/lib/about/content";

export const metadata: Metadata = {
  title: "محتوى صفحة عن ندوات",
  robots: { index: false, follow: false },
};

export default async function AboutSectionsPage() {
  const [sections, groups] = await Promise.all([adminListSections(), adminListGroups()]);
  // Groups the public would actually see (shown, with a published member).
  const visibleGroups = groups
    .filter((g) => g.status === "published" && g.published > 0)
    .map((g) => ({ id: g.id, name_ar: g.name_ar, description_ar: "", members: [] }));

  return (
    <div className="max-w-3xl">
      <p className="text-[0.95rem] leading-7 text-muted">
        ترتيب الأقسام ثابت. يمكن تعديل عنوان كلّ قسم ونصّه، وإظهاره أو إخفاؤه. القسم الظاهر لا يُعرض للزوار إذا كان فارغًا.
      </p>
      <ol className="mt-6 flex flex-col">
        {sections.map((s) => {
          const empty = !sectionHasContent(s, visibleGroups);
          return (
            <li key={s.key} className="border-t border-line first:border-t-0">
              <Link
                href={`/admin/about/sections/${s.key}`}
                className="flex flex-col gap-1.5 py-4 transition-colors hover:text-olive sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{s.title_ar}</span>
                  <span className="mt-1 block text-[0.85rem] leading-6 text-muted">
                    {SECTION_PURPOSE[s.key]}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap gap-2">
                  {s.is_published ? <Pill tone="good">ظاهر</Pill> : <Pill tone="muted">مخفي</Pill>}
                  {s.is_published && empty ? <Pill tone="warn">فارغ — لا يظهر</Pill> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
