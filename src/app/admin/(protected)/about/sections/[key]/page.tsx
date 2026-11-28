import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetSection } from "@/lib/admin/about";
import { SectionForm } from "@/components/admin/about/section-form";
import { isAboutSectionKey, SECTION_PURPOSE } from "@/lib/about/content";
import { updateSectionAction } from "../../actions";

export const metadata: Metadata = {
  title: "تعديل قسم",
  robots: { index: false, follow: false },
};

export default async function EditSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAboutSectionKey(key)) notFound();
  const section = await adminGetSection(key);
  if (!section) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/about" className="text-[0.9rem] text-olive hover:underline">
        → كلّ الأقسام
      </Link>
      <h2 className="mt-4 text-h3 text-ink">{section.title_ar}</h2>
      <p className="mt-2 text-[0.9rem] leading-7 text-muted">{SECTION_PURPOSE[key]}</p>
      {key === "team" ? (
        <p className="mt-2 text-[0.9rem]">
          <Link href="/admin/about/groups" className="text-olive hover:underline">المجموعات</Link>
          {" · "}
          <Link href="/admin/about/members" className="text-olive hover:underline">الأعضاء</Link>
        </p>
      ) : null}
      <div className="mt-8">
        <SectionForm section={section} action={updateSectionAction.bind(null, key)} />
      </div>
    </div>
  );
}
