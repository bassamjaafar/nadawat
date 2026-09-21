import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminGetPerson } from "@/lib/admin/people";
import { PersonForm } from "@/components/admin/person-form";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { DeleteForm } from "@/components/admin/delete-button";
import { deletePersonAction, updatePersonAction } from "../actions";

export const metadata: Metadata = {
  title: "تعديل الشخص",
  robots: { index: false, follow: false },
};

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await adminGetPerson(id);
  if (!person) notFound();

  const boundUpdate = updatePersonAction.bind(null, id);

  return (
    <div className="max-w-xl">
      <h1 className="text-h2 text-ink">{person.name_ar}</h1>

      <div className="mt-8">
        <PhotoUpload personId={person.id} initialUrl={person.image_url} />
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <PersonForm person={person} action={boundUpdate} submitLabel="حفظ التعديلات" />
      </div>

      <div className="mt-14 border-t border-line pt-8">
        <p className="mb-3 text-[0.85rem] text-muted">
          حذف الشخص نهائي. لن يكون ممكنًا إذا كان لا يزال ضيفًا أو محاورًا في
          ندوة.
        </p>
        <DeleteForm
          action={deletePersonAction}
          hiddenFields={{ id: person.id }}
          confirmMessage={`حذف "${person.name_ar}" نهائيًا؟`}
          buttonLabel="حذف الشخص"
        />
      </div>
    </div>
  );
}
