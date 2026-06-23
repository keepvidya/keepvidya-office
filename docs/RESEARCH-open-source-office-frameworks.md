# Open-source office frameworks — the landscape (research)

> Researched June 2026 for Keepvidya. Question: *what open-source framework should an
> MS-Office competitor be built on?* This is the web-research half of the build; the
> conclusions match the existing internal `keepvidya-workspace/OFFICE-ENGINE-SPEC.md`.

## TL;DR

| If you want… | Use | Licence | Why |
|---|---|---|---|
| **One framework, all three apps, embeddable, no server** | **Univer** (`dream-num/univer`) | **Apache-2.0** | Sheets + Docs + Slides, canvas renderer, 450+ Excel-compatible formula functions, runs in browser **and** Node, plugin architecture, Office-format import/export. The closest thing to "MS Office as an embeddable SDK." |
| **Maximum `.docx/.xlsx/.pptx` fidelity + real-time collab** | **ONLYOFFICE Docs** (DocumentServer) | AGPL-3.0 / commercial | Built natively around OOXML — best round-trip fidelity of any OSS suite. Heavier (ship a Document Server); AGPL means comply or buy a licence. |
| **LibreOffice fidelity, self-hosted** | **Collabora Online** | MPL-2.0 / commercial | LibreOffice core behind a web UI. Maximum compatibility, heaviest deploy. |
| **A full desktop app for end users (not embedding)** | **LibreOffice** / OnlyOffice Desktop | MPL / AGPL | Mature, complete, not a framework you build *on*. |

## Full suites (one dependency → all three document types)

- **Univer** — Apache-2.0. Isomorphic (browser + server) framework. Sheets are production-ready; Docs are a release candidate; Slides are in active development. Canvas rendering scales to hundreds of thousands of cells; the formula engine can run in a Web Worker or fully server-side. **Top pick** for an embeddable, permissively-licensed suite.
- **ONLYOFFICE Docs** — AGPL-3.0. Full docx/xlsx/pptx + PDF editors with the best MS-format fidelity, plus real-time collaboration. Open-source DesktopEditors (Electron) exists.
- **Collabora Online** — MPL-2.0. Embeddable LibreOffice.

## Best-of-breed components (more glue, mostly permissive)

- **Sheets:** FortuneSheet (MIT, Luckysheet's successor), Jspreadsheet CE (MIT; formulas/xlsx are paid), Luckysheet (MIT, stalled — team moved to Univer).
- **Formula engine (headless):** HyperFormula (GPL-3 / commercial), 400+ Excel-compatible functions. Pair with any grid.
- **Docs:** TipTap / ProseMirror (MIT) — the best Word-like rich-text editor; DOCX import/export via extensions.
- **Slides:** PPTist (AGPL-3.0) — a Vue web PowerPoint clone with text/image/shape/chart/table and a built-in AI-deck feature; reveal.js (MIT) for present-only decks.

## Headless generation / export (Node, MIT) — emit real Office files

- **ExcelJS** — `.xlsx` with formulas, freeze panes, number formats, fills, borders, data validation.
- **docx** (docx.js) — `.docx` with headings, tables, images, headers/footers, TOC, styles, lists.
- **pptxgenjs** — `.pptx` with backgrounds, ~200 shapes, charts, tables, master slides, transitions.
- **SheetJS/xlsx** — read/write many spreadsheet formats (best for import/parsing).
- Import/preview: **mammoth.js** (docx→html), **docx-preview**, **PPTXjs**.

## Decision for Keepvidya

1. **Edit engine → Univer (Apache-2.0).** One SDK for all three apps, embeds in an Electron/Tauri shell with no server, real formula + layout engine, exports Office formats, lowest licence risk.
2. **Export / batch generation → Univer's writers, backed by ExcelJS / docx / pptxgenjs** for precise or server-side ("an agent makes a deck without opening the editor") output.
3. **Fidelity fallback → ONLYOFFICE Docs** only if real-world `.docx/.pptx` round-trip or multi-user collab demands it (AGPL — comply or licence).

This repository (`keepvidya-office`) is the **clean-room edit-UX implementation** of that decision: a working
local-first suite with its own deterministic formula engine, structured along the *edit engine + export writers*
split so the Univer engine drops straight in. See [`UPGRADE-to-univer.md`](./UPGRADE-to-univer.md).

## Sources
- Univer — https://github.com/dream-num/univer · https://docs.univer.ai
- ONLYOFFICE — https://www.onlyoffice.com/ · https://github.com/ONLYOFFICE
- LibreOffice — https://www.libreoffice.org/
- Collabora Online — https://www.collaboraonline.com/
- FortuneSheet — https://github.com/ruilisi/fortune-sheet · HyperFormula — https://hyperformula.handsontable.com/
- TipTap — https://tiptap.dev/ · PPTist — https://github.com/pipipi-pikachu/PPTist
- ExcelJS — https://github.com/exceljs/exceljs · docx — https://docx.js.org/ · pptxgenjs — https://gitbrent.github.io/PptxGenJS/
