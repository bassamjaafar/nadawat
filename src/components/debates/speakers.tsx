import {
  PersonAvatar,
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
  // Three guests sit in one row; any other count falls back to two columns.
  const threeUp = speakers.length === 3;
  const cols = threeUp ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[0.975rem] leading-[1.6] font-medium uppercase text-muted">
        الضيوف
      </p>
      {/* Each card spans four shared rows (portrait, name, title, position)
          via subgrid, so names and titles start on the same line in every
          card even when one of them wraps onto more lines. */}
      <ul className={`grid ${cols} gap-x-3 sm:gap-x-5`}>
        {speakers.map(({ person, position_label_ar }) => (
          <li
            key={person.id}
            className={`row-span-4 grid grid-rows-subgrid ${threeUp ? "" : "pb-6"}`}
          >
            <PersonPortrait person={person} className="w-full max-w-[11rem]" />
            <p className="pt-3 font-display text-[0.95rem] leading-snug font-medium text-ink sm:text-[1.05rem]">
              {person.name_ar}
            </p>
            <div>
              {person.title_ar ? (
                <p className="pt-1 text-[0.8rem] leading-5 text-muted [text-wrap:pretty] sm:text-[0.85rem]">
                  {person.title_ar}
                </p>
              ) : null}
            </div>
            <div>
              {position_label_ar ? (
                <p className="pt-1.5 text-[0.8rem] leading-5 text-olive [text-wrap:pretty] sm:text-[0.85rem]">
                  {position_label_ar}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {moderator ? (
        // Moderator strip on the guests' column grid: the circle fills 80% of
        // the first column (so it is always 80% of a guest photo's width) and
        // the text spans the remaining columns. mt-4 + the gap-6 above puts
        // ~40px between the guest text and the separator.
        <div className={`mt-4 grid ${cols} items-center gap-3 border-t border-line pt-6 sm:gap-5`}>
          <PersonAvatar person={moderator} className="w-[80%] max-w-[8.8rem]" />
          <div className={threeUp ? "col-span-2" : undefined}>
            <p className="text-meta text-muted">المحاور/ة</p>
            <p className="mt-0.5 font-display text-[0.95rem] leading-snug font-medium text-ink sm:text-[1.05rem]">
              {moderator.name_ar}
            </p>
            {moderator.title_ar ? (
              <p className="mt-1 text-[0.8rem] leading-5 text-muted sm:text-[0.85rem]">
                {moderator.title_ar}
              </p>
            ) : null}
          </div>
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
              المحاور/ة
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
