import type { ReactNode } from "react";

// Plain-text formatting for editable About-page text, so admins never deal
// with HTML:
//   * a blank line starts a new paragraph;
//   * lines starting with "-" (or "•") form a bulleted list;
//   * in a bullet, a short label before a colon is shown in bold
//     ("الاستقلالية: …").

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

const BULLET = /^\s*[-•]\s+/u;

export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (BULLET.test(line)) {
      flushPara();
      list.push(line.replace(BULLET, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

// A label is at most five words and contains no sentence punctuation.
const LABEL = /^([^:،.؛]{1,40}?):\s+(.+)$/u;

function Item({ text }: { text: string }) {
  const m = LABEL.exec(text);
  if (m && m[1].trim().split(/\s+/u).length <= 5) {
    return (
      <>
        <strong>{m[1]}:</strong> {m[2]}
      </>
    );
  }
  return <>{text}</>;
}

function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  lines.forEach((l, i) => {
    if (i > 0) out.push(<br key={`br${i}`} />);
    out.push(l);
  });
  return <>{out}</>;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (!blocks.length) return null;
  return (
    <div className={className}>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>
            <Lines text={b.text} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Item text={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
