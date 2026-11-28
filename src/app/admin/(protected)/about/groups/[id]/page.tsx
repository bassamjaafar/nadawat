import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetGroup } from "@/lib/admin/about";
import { GroupForm } from "@/components/admin/about/group-form";
import { updateGroupAction } from "../../actions";

export const metadata: Metadata = {
  title: "تعديل مجموعة",
  robots: { index: false, follow: false },
};

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const group = await adminGetGroup(id);
  if (!group) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/about/groups" className="text-[0.9rem] text-olive hover:underline">
        → كلّ المجموعات
      </Link>
      <h2 className="mt-4 text-h3 text-ink">{group.name_ar}</h2>
      <div className="mt-8">
        <GroupForm group={group} action={updateGroupAction.bind(null, id)} submitLabel="حفظ التعديلات" />
      </div>
    </div>
  );
}
