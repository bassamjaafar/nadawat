import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetMember, adminListGroups } from "@/lib/admin/about";
import { MemberForm } from "@/components/admin/about/member-form";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { updateMemberAction, uploadMemberPhotoAction } from "../../actions";

export const metadata: Metadata = {
  title: "تعديل عضو/ة",
  robots: { index: false, follow: false },
};

export default async function EditMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [member, groups] = await Promise.all([adminGetMember(id), adminListGroups()]);
  if (!member) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/about/members" className="text-[0.9rem] text-olive hover:underline">
        → كلّ الأعضاء
      </Link>
      <h2 className="mt-4 text-h3 text-ink">{member.full_name_ar}</h2>

      {created ? (
        <p
          role="status"
          className="mt-6 rounded-[var(--radius)] border border-line bg-[#eef2ea] px-4 py-3 text-[0.9rem] text-olive"
        >
          حُفظ الملف كمسودة. الخطوة التالية: رفع الصورة الشخصية.
        </p>
      ) : null}

      <div className="mt-8">
        <p className="mb-3 text-meta font-medium text-ink">الصورة الشخصية</p>
        <PhotoUpload
          personId={member.id}
          initialUrl={member.image_url}
          uploadAction={uploadMemberPhotoAction.bind(null, member.id)}
          hint="JPG أو PNG أو WEBP. تُعرض الصورة مربّعة، فيُفضَّل أن يكون الوجه في وسطها."
        />
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <MemberForm
          key={member.id}
          member={member}
          groups={groups}
          action={updateMemberAction.bind(null, member.id)}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
