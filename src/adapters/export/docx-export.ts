// docx export via the `docx` vendor (wrapped here only). Block-level structure
// (headings, paragraphs, bullets) preserved from the document HTML.
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { type DocData } from '../../domain/doc/doc';
import { htmlToBlocks } from './html';

const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function exportDocx(data: DocData): Promise<Blob> {
  const blocks = htmlToBlocks(data.html);
  const source = blocks.length ? blocks : [{ tag: 'p' as const, text: '' }];
  const children = source.map((b) => {
    if (b.tag === 'h1') return new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_1 });
    if (b.tag === 'h2') return new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_2 });
    if (b.tag === 'h3') return new Paragraph({ text: b.text, heading: HeadingLevel.HEADING_3 });
    if (b.tag === 'li') return new Paragraph({ text: b.text, bullet: { level: 0 } });
    return new Paragraph({ text: b.text });
  });
  const doc = new Document({ creator: 'Keepvidya Office', sections: [{ children }] });
  return pack(doc);
}

async function pack(doc: Document): Promise<Blob> {
  /* v8 ignore next 3 -- browser path; node tests exercise the toBuffer branch below */
  if (typeof window !== 'undefined') {
    return await Packer.toBlob(doc);
  }
  const buf = await Packer.toBuffer(doc);
  return new Blob([buf as unknown as BlobPart], { type: MIME });
}
