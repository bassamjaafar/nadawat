import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminGetEvent } from "@/lib/admin/events";
import { adminListPeople } from "@/lib/admin/people";
import { EventForm } from "@/components/admin/event-form";
import { ParticipantsEditor } from "@/components/admin/participants-editor";
import { Button } from "@/components/ui/button";
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

      <form
        action={deleteEventAction}
        className="mt-14 border-t border-line pt-8"
      >
        <input type="hidden" name="id" value={event.id} />
        <input type="hidden" name="slug" value={event.slug} />
        <p className="text-[0.85rem] text-muted">
          حذف الندوة نهائي ولا يمكن التراجع عنه.
        </p>
        <div className="mt-3">
          <Button type="submit" variant="outline" size="sm">
            حذف الندوة
          </Button>
        </div>
      </form>
    </div>
  );
}
