# BA — 06 AI Writer ("prompt → document")

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
Sheets and Slides have real editors + AI; the Writer is still a placeholder. M6 completes the trifecta: a rich-text
document editor and **"prompt → document"** on the same narrator spine — the model emits document **structure** (headings,
paragraphs, bullets), and our applier builds the HTML deterministically. Mock now; real Shiva/BYOK (M5) drives it when set.

## 2. Users & jobs-to-be-done
- Primary user. Job: "When I describe a document ('a one-page project proposal'), I want a formatted draft I can edit — and
  I want to write and format normally too."

## 3. User stories
- **US-1**: As a user, I want a document page I can type into, with a toolbar (headings, bold/italic/underline, lists, undo/redo).
- **US-2**: As a user, I want a live word count.
- **US-3**: As a user, I want a prompt bar to generate a structured draft (title, headings, paragraphs, bullets).
- **US-4**: As a user, I want edits saved and restored on reload.

## 4. Acceptance criteria (testable)
- **AC-1** (US-3): `validateDocIntent` accepts `{blocks:[{type:'heading',level,text}|{type:'paragraph',text}|{type:'bullets',items[]}]}` and rejects malformed output; `applyDocIntent` builds HTML (`<h1>/<h2>/<p>/<ul><li>`) — all formatting from OUR code. *(→ TC-06.1.x)*
- **AC-2** (US-3): `buildDoc(prompt)` (mock) returns a `DocData` whose HTML contains a heading + a paragraph + a list. *(→ TC-06.2.1)*
- **AC-3** (US-2): `wordCount` + `normalizeDoc` behave (empty → default doc; counts words). *(→ TC-06.1.4)*
- **AC-4** (US-1/US-4): the Writer editor renders an editable page + toolbar; typing updates the word count; reload restores content. *(→ TC-06.3.1, TC-06.3.3)*
- **AC-5** (US-3): prompt + Generate populates the page with the generated document. *(→ TC-06.3.2)*
- **AC-6** (eval): golden prompt → doc rubric (has a heading, ≥1 paragraph, ≥1 bullet) + trajectory (0 retries). *(→ TC-06.4.1)*

## 5. Scope
- **In**: doc domain (`DocData`, `normalizeDoc`, `wordCount`), `DocIntent` + validator + `applyDocIntent`, `buildDoc` orchestrator, mock doc fixture, Writer editor (page + toolbar + prompt bar + word count + autosave).
- **Out** (later): tables/images, real `.docx` export (M7), comments/track-changes, collaborative editing.

## 6. Success metrics / done-signal
Prompt → a formatted draft; manual typing + formatting work; word count live; edits persist; 0 console errors.

## 7. AI acceptance (narrator boundary)
- The model emits **only** `DocIntent` (block types + text/items). It never emits HTML, styles or layout — `applyDocIntent`
  owns all formatting. Invalid intent is rejected before the document changes.

## 8. Open questions / decisions for owner
- Toolbar uses the browser's `execCommand` (pragmatic, dependency-free, as in the prototype). A ProseMirror/TipTap upgrade is a later option. ✔ assumed OK.
