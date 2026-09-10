import {
  PersonAvatarSmall,
  PersonPortrait,
} from "@/components/ui/person-portrait";
import type { DebateParticipant, Person } from "@/lib/types";

/** Compact lineup for the upcoming-debate hero. */
export function SpeakerLineup({
  participants,
  moderator,
}: {
  participants: DebateParticipant[];
  moderator: Person | null;
}) {
  const speakers = participants.filter((p) => p.role === "speaker");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-kicker font-medium uppercase text-muted">المتناظران</p>
      <ul className="grid grid-cols-2 gap-5 sm:gap-6">
        {speakers.map(({ person, position_label_ar }) => (
          <li key={person.id} className="flex flex-col gap-3">
            <PersonPortrait person={person} className="w-full max-w-[9rem]" />
            <div>
              <p className="font-display text-[1.05rem] font-medium text-ink">
                {person.name_ar}
              </p>
              {person.title_ar ? (
                <p className="mt-0.5 text-[0.85rem] text-muted">
                  {person.title_ar}
                </p>
              ) : null}
              {position_label_ar ? (
                <p className="mt-1.5 text-[0.85rem] leading-6 text-olive">
                  {position_label_ar}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {moderator ? (
        <div className="flex items-center gap-3 border-t border-line pt-4">
          <PersonAvatarSmall person={moderator} />
          <p className="text-meta text-muted">
            إدارة الجلسة:{" "}
            <span className="text-ink">{moderator.name_ar}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Full profiles for the debate archive page. */
export function ParticipantProfiles({
  participants,
  moderator,
}: {
  participants: DebateParticipant[];
  moderator: Person | null;
}) {
  const speakers = participants.filter((p) => p.role === "speaker");

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-8 sm:grid-cols-2">
        {speakers.map(({ person, position_label_ar }) => (
          <article key={person.id} className="flex gap-4">
            <PersonPortrait
              person={person}
              className="w-24 shrink-0"
              ratio="square"
            />
            <div>
              <h3 className="font-display text-[1.1rem] font-medium text-ink">
                {person.name_ar}
              </h3>
              {person.title_ar ? (
                <p className="mt-0.5 text-[0.85rem] text-muted">
                  {person.title_ar}
                </p>
              ) : null}
              {position_label_ar ? (
                <p className="mt-1 text-[0.85rem] text-olive">
                  {position_label_ar}
                </p>
              ) : null}
              {person.bio_ar ? (
                <p className="mt-2 text-[0.9rem] leading-7 text-muted">
                  {person.bio_ar}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {moderator ? (
        <div className="flex gap-4 border-t border-line pt-8">
          <PersonPortrait
            person={moderator}
            className="w-24 shrink-0"
            ratio="square"
          />
          <div>
            <p className="text-kicker font-medium uppercase text-muted">
              إدارة الجلسة
            </p>
            <h3 className="mt-1 font-display text-[1.1rem] font-medium text-ink">
              {moderator.name_ar}
            </h3>
            {moderator.title_ar ? (
              <p className="mt-0.5 text-[0.85rem] text-muted">
                {moderator.title_ar}
              </p>
            ) : null}
            {moderator.bio_ar ? (
              <p className="mt-2 text-[0.9rem] leading-7 text-muted">
                {moderator.bio_ar}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
