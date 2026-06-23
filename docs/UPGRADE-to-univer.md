# Upgrade path: dropping the Univer engine in

This suite was built along the **edit engine + export writers** split from `OFFICE-ENGINE-SPEC.md`,
so the hand-written engines can be swapped for **Univer** (Apache-2.0) without touching the shell.

## What stays vs. what swaps

| Layer | Today (this repo) | After Univer |
|---|---|---|
| Shell — rail, launcher, routing, file store, theme | `src/main.js`, `src/store.js` | **unchanged** |
| Sheets edit engine | `src/sheets.js` + `src/formula.js` | Univer Sheets preset mounted in the editor host |
| Docs edit engine | `src/writer.js` (contentEditable) | Univer Docs preset |
| Slides edit engine | `src/slides.js` | Univer Slides (when GA) or keep this one |
| Export | `src/*` exporters (CSV, Excel-XML, HTML, MD) | Univer export + ExcelJS / docx / pptxgenjs |

The contract each editor module already exposes — `mount(host, file, ctx) → { destroy, exports, onPresent? }`
— is exactly the seam where a Univer instance gets created per open file (`ctx.save(data)` persists its snapshot).

## Steps

1. `npm i @univerjs/presets` (plus the sheets/docs core preset packages and their CSS).
2. In a new `src/sheets-univer.js`, replace the body of `mount` with:
   ```js
   import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets';
   import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
   import sheetsEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
   import '@univerjs/presets/lib/styles/preset-sheets-core.css';

   export function mountSheets(host, file, ctx) {
     const { univerAPI } = createUniver({
       locale: LocaleType.EN_US,
       locales: { [LocaleType.EN_US]: merge({}, sheetsEnUS) },
       theme: defaultTheme,
       presets: [UniverSheetsCorePreset({ container: host })],
     });
     const wb = univerAPI.createWorkbook(file.data.univer || {});
     univerAPI.onCommandExecuted(() => ctx.save({ univer: wb.save() }));
     return { destroy: () => univerAPI.dispose(), exports: [/* xlsx via ExcelJS */] };
   }
   ```
3. Point `main.js`'s `mounters.sheets` at the new module. Repeat for Docs.
4. Wrap exports with **ExcelJS / docx / pptxgenjs** for true `.xlsx/.docx/.pptx`.
5. Package the whole thing in **Electron** (like Keepvidya Flows / Knovex) with `electron-updater`.

Because the shell, file model and routing never assumed anything about the engine internals, this is an
**additive** change — the current deterministic engine remains a zero-dependency fallback.
