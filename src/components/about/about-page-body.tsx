import Image from "next/image";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { BrandStatement } from "@/components/home/brand-statement";
import { RichText } from "@/components/about/rich-text";
import type { AboutSection } from "@/lib/about/content";
import type { PublicGroup, PublicMember } from "@/lib/about/team";

// Shared by the public /about page and the admin preview. In preview mode
// hidden or empty items are shown too, each with a label saying why the
// public won't see it.

export type ViewMember = PublicMember & { note?: string };
export type ViewGroup = Omit<PublicGroup, "members"> & { note?: string; members: ViewMember[] };

export function AboutHeader() {
  return (
    <PageHeader
      kicker="عن ندوات"
      title="مساحةٌ للاختلاف المنظَّم"
      lede="ندوات مبادرةٌ مستقلّة تنظّم ندوات عامة حول قضايا سوريا، وتحفظها أرشيفًا مفتوحًا للجميع."
    />
  );
}

/** Whether a shown section has anything to show. */
export function sectionHasContent(section: AboutSection, groups: ViewGroup[]): boolean {
  // In the preview, groups the public won't see carry a note.
  if (section.key === "team") return groups.some((g) => !g.note);
  if (section.key === "join") return Boolean(section.body_ar.trim() || hasLink(section));
  return Boolean(section.body_ar.trim());
}

function hasLink(s: AboutSection): boolean {
  return Boolean(s.link_label_ar?.trim() && s.link_url?.trim());
}

function PreviewNote({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[#d8b9ad] bg-[#f3e4de] px-2.5 py-0.5 font-sans text-[0.75rem] leading-5 font-normal text-[#8f3520]">
      {children}
    </span>
  );
}

function SectionRow({
  section,
  note,
  divider,
  children,
}: {
  section: AboutSection;
  note?: string;
  /** A hairline above — only between two plain sections. */
  divider: boolean;
  children: ReactNode;
}) {
  const id = `about-${section.key}`;
  return (
    <section aria-labelledby={id} className={divider ? "border-t border-line" : undefined}>
      <div className="container-page grid gap-x-14 gap-y-5 py-[clamp(2.75rem,5.5vw,4.5rem)] md:grid-cols-[0.7fr_1.3fr]">
        <div className="flex flex-col items-start gap-2">
          {note ? <PreviewNote>{note}</PreviewNote> : null}
          <h2 id={id} className="text-h2 text-ink [text-wrap:balance]">
            {section.title_ar}
          </h2>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function MemberCard({ member }: { member: ViewMember }) {
  return (
    <article className="flex flex-col items-start">
      <div className="relative aspect-square w-32 max-w-full overflow-hidden rounded-[var(--radius-md)] bg-cream">
        {member.image_url ? (
          <Image
            src={member.image_url}
            alt={member.full_name_ar}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : null}
      </div>
      {member.note ? (
        <div className="mt-3">
          <PreviewNote>{member.note}</PreviewNote>
        </div>
      ) : null}
      <h4 className="mt-4 font-display text-[1.125rem] leading-snug font-medium text-ink">
        {member.full_name_ar}
      </h4>
      {member.title_ar ? (
        <p className="mt-1 text-[0.9rem] leading-6 text-olive">{member.title_ar}</p>
      ) : null}
      {member.bio_ar ? (
        <p className="mt-3 text-[0.95rem] leading-8 text-muted [text-wrap:pretty]">
          {member.bio_ar}
        </p>
      ) : null}
    </article>
  );
}

function TeamSection({
  section,
  groups,
  note,
}: {
  section: AboutSection;
  groups: ViewGroup[];
  note?: string;
}) {
  const id = "about-team";
  return (
    <section aria-labelledby={id} className="bg-cream-deep">
      <div className="container-page py-[clamp(3rem,6vw,5rem)]">
        <div className="grid gap-x-14 gap-y-5 md:grid-cols-[0.7fr_1.3fr]">
          <div className="flex flex-col items-start gap-2">
            {note ? <PreviewNote>{note}</PreviewNote> : null}
            <h2 id={id} className="text-h2 text-ink [text-wrap:balance]">
              {section.title_ar}
            </h2>
          </div>
          {section.body_ar.trim() ? (
            <RichText text={section.body_ar} className="prose-ar min-w-0" />
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-12">
          {groups.map((g) => (
            <div key={g.id} className="border-t border-line-strong/60 pt-8">
              <div className="flex flex-col items-start gap-2">
                {g.note ? <PreviewNote>{g.note}</PreviewNote> : null}
                <h3 className="flex items-center gap-3 font-display text-h3 font-medium text-ink">
                  <span className="block h-px w-6 bg-gold" aria-hidden="true" />
                  {g.name_ar}
                </h3>
              </div>
              {g.description_ar.trim() ? (
                <RichText
                  text={g.description_ar}
                  className="mt-4 flex max-w-[44rem] flex-col gap-3 text-[1rem] leading-8 text-muted"
                />
              ) : null}
              {g.members.length ? (
                <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {g.members.map((m) => (
                    <MemberCard key={m.id} member={m} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-[0.9rem] text-muted">لا أعضاء في هذه المجموعة بعد.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The page below its header. Sections arrive in page order. Outside preview
 * they are already limited to shown ones, and empty ones are skipped here.
 */
export function AboutPageBody({
  sections,
  groups,
  preview = false,
}: {
  sections: AboutSection[];
  groups: ViewGroup[];
  preview?: boolean;
}) {
  const items: ReactNode[] = [];
  // Whether the previous item was a plain section (for the hairline), and
  // whether the slogan band has been placed yet.
  let afterPlain = false;
  let slogan = false;

  for (const section of sections) {
    const hasContent = sectionHasContent(section, groups);
    if (!preview && !hasContent) continue;

    const note = !preview
      ? undefined
      : !section.is_published
        ? "مخفي — لا يظهر للزوار"
        : !hasContent
          ? "فارغ — لن يظهر للزوار"
          : undefined;

    if (section.key === "team") {
      items.push(<TeamSection key="team" section={section} groups={groups} note={note} />);
      afterPlain = false;
      continue;
    }

    items.push(
      <SectionRow key={section.key} section={section} note={note} divider={afterPlain}>
        <RichText text={section.body_ar} className="prose-ar" />
        {section.key === "join" && hasLink(section) ? (
          <div className="mt-8">
            <ButtonLink href={section.link_url!}>{section.link_label_ar}</ButtonLink>
          </div>
        ) : null}
      </SectionRow>,
    );
    afterPlain = true;

    // The slogan follows the introduction.
    if (section.key === "intro") {
      items.push(<BrandStatement key="slogan" />);
      slogan = true;
      afterPlain = false;
    }
  }
  // …and is kept even if the introduction is hidden.
  if (!slogan) items.push(<BrandStatement key="slogan" />);

  return <div className="pb-4">{items}</div>;
}
