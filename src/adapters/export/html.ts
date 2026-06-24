// Small regex HTML reader for export (no DOM — works in node + browser). Handles the
// block tags our editor/appliers produce; inline tags are stripped, entities decoded.
export interface HtmlBlock {
  tag: 'h1' | 'h2' | 'h3' | 'p' | 'li';
  text: string;
}

export function htmlToBlocks(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  const re = /<(h[1-3]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) blocks.push({ tag: m[1].toLowerCase() as HtmlBlock['tag'], text });
  }
  return blocks;
}

export function htmlToText(html: string): string {
  return stripTags(html.replace(/<br\s*\/?>/gi, '\n'));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
