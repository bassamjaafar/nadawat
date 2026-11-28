import type { Metadata } from "next";
import Link from "next/link";
import { adminListGroups } from "@/lib/admin/about";
import { MemberForm } from "@/components/admin/about/member-form";
import { createMemberAction } from "../../actions";

export const metadata: Metadata = {
  title: "عضو/ة جديد/ة",
  robots: { index: false, follow: false },
};

export default async function NewMemberPage() {
  const groups = await adminListGroups();
  return (
    <div className="max-w-2xl">
      <Link href="/admin/about/members" className="text-[0.9rem] text-olive hover:underline">
        → كلّ الأعضاء
      </Link>
      <h2 className="mt-4 text-h3 text-ink">عضو/ة جديد/ة</h2>
      <div className="mt-8">
        <MemberForm groups={groups} action={createMemberAction} submitLabel="حفظ كمسودة" isNew />
      </div>
    </div>
  );
}
