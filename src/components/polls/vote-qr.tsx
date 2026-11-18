import { VOTE_QR } from "@/lib/polls/vote-qr";

/** Which fixed QR to show: the one for this deployment's own address. */
export function voteQrFor(siteUrl: string) {
  let host = "nadawat.org";
  try {
    host = new URL(siteUrl).hostname;
  } catch {
    // Fall through to production.
  }
  const qr = VOTE_QR[host] ?? VOTE_QR["nadawat.org"];
  return { ...qr, label: new URL(qr.url).host + "/vote" };
}

/** Black modules on white with the standard 4-module quiet zone. */
export function VoteQr({ size, d, className }: { size: number; d: string; className?: string }) {
  const q = 4;
  return (
    <svg
      viewBox={`${-q} ${-q} ${size + 2 * q} ${size + 2 * q}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="رمز QR لصفحة التصويت"
    >
      <rect x={-q} y={-q} width={size + 2 * q} height={size + 2 * q} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}
