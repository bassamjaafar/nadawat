import type { Metadata } from "next";
import Link from "next/link";
import { adminListGroups } from "@/lib/admin/about";
import { GroupForm } from "@/components/admin/about/group-form";
import { createGroupAction } from "../../actions";

export const metadata: Metadata = {
  title: "مجموعة جديدة",
  robots: { index: false, follow: false },
};

export default async function NewGroupPage() {
  const groups = await adminListGroups();
  const nextOrder = groups.reduce((max, g) => Math.max(max, g.sort_order), 0) + 10;
  return (
    <div className="max-w-2xl">
      <Link href="/admin/about/groups" className="text-[0.9rem] text-olive hover:underline">
        → كلّ المجموعات
      </Link>
      <h2 className="mt-4 text-h3 text-ink">مجموعة جديدة</h2>
      <div className="mt-8">
        <GroupForm action={createGroupAction} nextOrder={nextOrder} submitLabel="إضافة المجموعة" />
      </div>
    </div>
  );
}
