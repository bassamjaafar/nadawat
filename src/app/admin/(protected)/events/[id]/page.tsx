import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminGetEvent } from "@/lib/admin/events";
import { adminListPeople } from "@/lib/admin/people";
import { EventForm } from "@/components/admin/event-form";
import { ParticipantsEditor } from "@/components/admin/participants-editor";
import { DeleteForm } from "@/components/admin/delete-button";
import { deleteEventAction, updateEventAction } from "../actions";

export const metadata: Metadata = {
  title: "تعديل الندوة",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, people] = await Promise.all([
    adminGetEvent(id),
    adminListPeople(),
  ]);

  if (!event) notFound();

  const boundUpdate = updateEventAction.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-ink">{event.title_ar}</h1>

      <div className="mt-8">
        <EventForm event={event} action={boundUpdate} submitLabel="حفظ التعديلات" />
      </div>

      <div className="mt-14 border-t border-line pt-10">
        <h2 className="text-h3 text-ink">الضيوف والمحاور</h2>
        <div className="mt-6">
          <ParticipantsEditor
            debateId={event.id}
            allPeople={people}
            initialModeratorId={event.moderator?.id ?? null}
            initialSpeakers={event.participants
              .filter((p) => p.role === "speaker")
              .map((p) => ({
                personId: p.person.id,
                positionLabel: p.position_label_ar,
              }))}
          />
        </div>
      </div>

      <div className="mt-14 border-t border-line pt-8">
        <p className="mb-3 text-[0.85rem] text-muted">
          حذف الندوة نهائي ولا يمكن التراجع عنه.
        </p>
        <DeleteForm
          action={deleteEventAction}
          hiddenFields={{ id: event.id, slug: event.slug }}
          confirmMessage={`حذف ندوة "${event.title_ar}" نهائيًا؟`}
          buttonLabel="حذف الندوة"
        />
      </div>
    </div>
  );
}
