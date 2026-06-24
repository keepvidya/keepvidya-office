# BA — 04 AI Slides ("prompt → deck")

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
The owner's headline: **"Shiva really makes good PPT."** This slice delivers the flagship AI experience — describe a
presentation, get a real deck you can present. It reuses the M3 narrator spine: the model emits **slide content** (titles +
bullets), and **our deterministic code does the layout** and builds the slide objects. M4 also introduces the Slides editor
(render + navigate + **present mode**), replacing the placeholder. Mock model now; real Shiva swaps in behind `LlmPort`.

## 2. Users & jobs-to-be-done
- Primary user: someone who needs a deck fast. Job: "When I describe a presentation ('a 5-slide pitch for my app'), I want
  a real, presentable deck — and I trust the structure because our code laid it out."

## 3. User stories
- **US-1**: As a user, I want a Slides editor that shows a thumbnail rail + the current slide.
- **US-2**: As a user, I want a prompt bar to generate a deck from a description.
- **US-3**: As a user, I want the generated deck to have a title slide and content slides with titles + bullets.
- **US-4**: As a user, I want to **present** the deck full-screen and navigate with arrow keys.
- **US-5**: As a user, I want to edit a slide's text inline and add/delete slides.
- **US-6**: As a user, I want my deck saved and restored on reload.

## 4. Acceptance criteria (testable)
- **AC-1** (US-2/US-3): GIVEN a prompt, `validateDeckIntent` accepts `{slides:[{title,bullets[]}]}` and rejects malformed output; `applyDeckIntent` builds a `SlideDeck` where each intent slide becomes a slide with a **title element + a bullets element**, all geometry/styling from OUR code. *(→ TC-04.1.x)*
- **AC-2** (US-2): GIVEN the mock model, `buildDeck(prompt)` returns a multi-slide deck (title + content). *(→ TC-04.2.1)*
- **AC-3** (US-4): GIVEN a deck, present mode renders a slide scaled to the viewport and arrow keys change slides; Esc exits. *(→ TC-04.3.2)*
- **AC-4** (US-1/US-2): GIVEN the Slides editor, WHEN I type a prompt and Generate, THEN thumbnails + the stage show the deck (≥2 slides). *(→ TC-04.3.1)*
- **AC-5** (US-5/US-6): GIVEN a deck, editing a slide title and reloading restores it; add/delete change the slide count. *(→ TC-04.1.5, TC-04.3.3)*
- **AC-6** (eval): golden prompt → deck rubric (slide count, title present, bullets present) + trajectory (0 retries). *(→ TC-04.4.1)*

## 5. Scope
- **In**: Slides domain (`SlideDeck`/`Slide`/`Element`, `normalizeDeck`, deck ops add/delete/edit-text), `SlideIntent` + validator + `applyDeckIntent` (deterministic layout), `buildDeck` orchestrator, mock deck model, Slides editor (rail + stage + prompt bar + inline text edit + add/delete), **present mode**, autosave.
- **Out** (later): drag/resize elements, images/shapes/charts, themes/transitions, real `.pptx` export (M7), the real Shiva adapter (small follow-up).

## 6. Success metrics / done-signal
Prompt → a presentable multi-slide deck; present mode works; edits persist; 0 console errors.

## 7. AI acceptance (narrator boundary)
- The model emits **only** `SlideIntent` (slide `title` strings + `bullets` string arrays). It never sets positions, sizes,
  colours, or fonts — **our `applyDeckIntent` owns all layout**. Invalid intent is rejected before any slide is built.

## 8. Open questions / decisions for owner
- Manual element drag/resize deferred; M4 focuses on AI-generate + view + present + inline text edit. ✔ assumed OK.
