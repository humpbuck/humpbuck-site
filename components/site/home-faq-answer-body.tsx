type FaqBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseFaqAnswer(text: string): FaqBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim());
  const blocks: FaqBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ type: "list", items: [...list] });
    list = [];
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    if (/^[•\-–—]\s/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[•\-–—]\s*/, ""));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushList();
  flushParagraph();
  return blocks;
}

function FaqListItem({ item }: { item: string }) {
  const dash = item.match(/^(.+?)\s[—–-]\s(.+)$/);
  if (!dash) {
    return <span>{item}</span>;
  }

  return (
    <>
      <span className="font-medium text-ink/85">{dash[1]}</span>
      <span className="text-muted"> — {dash[2]}</span>
    </>
  );
}

export function HomeFaqAnswerBody({ text }: { text: string }) {
  const blocks = parseFaqAnswer(text);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`p-${index}`} className="leading-relaxed">
              {block.text}
            </p>
          );
        }

        return (
          <ul key={`ul-${index}`} className="space-y-2.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2.5 leading-relaxed">
                <span
                  className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-ink/30"
                  aria-hidden
                />
                <span className="min-w-0">
                  <FaqListItem item={item} />
                </span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
