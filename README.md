# MUDIT OS

A developer portfolio built as a personal operating system. Projects are
applications, skills are installed modules, experiments are test builds,
abandoned work sits in the bin, and the things that broke are filed as crash
reports rather than hidden.

> There is no final version. Only the next build.

```bash
npm run dev        # http://localhost:3000
npm run build      # stamps the build date, then prerenders every route
npm run typecheck  # next typegen && tsc --noEmit
```

## What holds it together

**Every count is derived.** No component contains a number that describes the
content. The boot screen says nine crash reports because `failures.length === 9`;
add a tenth and the boot screen, the desktop icon, the dock and the system
monitor all change together. `src/lib/derived.ts` is the only place that counts.

**Every number carries its source.** The system monitor renders the method
beside the measurement — which API, which file, which date it was sampled. A
metric without a definition is decoration, so `stability` shows its formula
(`resolved ÷ total`) next to its value.

**Every failure is anchored to a commit.** Each crash report cites a real sha
and the verbatim commit message, so anyone can open it on GitHub and check.

**The OS sits on top of a document, not instead of one.** Every app is a real
URL that server-renders on its own. An inline script sets `data-os="on"` before
first paint; with it the window manager renders, without it the CSS shows the
plain document instead. So a visitor with JavaScript disabled, and a crawler
that does not execute it, both get the whole portfolio as readable HTML — and
neither state flashes, because the choice is made before the first frame.

**One content layer, three shells.** Desktop gets a window manager, tablet a
single maximised window, phone a stack of full-screen sheets. All three render
the identical app components. A 390px screen never pretends to be a draggable
desktop.

**The drag is 1:1.** No animation library. Pointer events write the transform
directly and React never sees the intermediate frames, because a window that
lags the cursor is the loudest possible counter-argument to "I can build a
system".

## Layout

```
data/            content, typed. The only source of counts.
src/os/          the system: store, geometry, drag, shortcuts, routing
src/apps/        app content. No hooks — renders server-side and in a window
src/components/  window manager, shells, overlays, primitives
src/lib/         derived.ts — every count, cross-link and metric
src/app/         routes. One per app, one per record
```

## Before this is ready to send to anyone

The system is complete; some of the content is still yours to write.

1. **Crash reports are drafts.** All nine are reconstructed from real commits and
   carry `confirmed: false`, which renders a visible "drafted from commit
   history" marker. Read each one, correct what is wrong, fill in `cost` where
   you remember it, then set `confirmed: true`. The interface stops marking them
   the moment you do.
2. **`contribution` and `retrospective`** on each project say `TODO`. They render
   as honest empty states until you write them. These are the two fields that
   separate this from every other portfolio — "what I built", specifically, and
   "what I'd do differently".
3. **Contact is unpublished.** `data/profile.ts` has `email`, `linkedin` and
   `resume` set to `null`, which render as designed empty states rather than dead
   links. Drop a PDF in `/public`, set `resume: '/your-file.pdf'`, and the top-bar
   Résumé link goes live.
4. **`currently` is dated.** Review it quarterly — the date renders next to it,
   so a stale entry is visible rather than silent.
5. **`metadataBase`** in `src/app/layout.tsx` and the origin in `sitemap.ts` /
   `robots.ts` point at localhost. Change them when you pick a domain.

## Keyboard

`?` shortcuts · `Esc` close · `Ctrl` `` ` `` cycle · `Ctrl` `1`–`8` open by index ·
`Ctrl` `T` terminal · `Ctrl` `W` close · `Ctrl` `M` minimize · `Ctrl` `↑`
maximize · `Ctrl` `←`/`→` snap · `Ctrl` `Shift` `D` dev mode ·
`Ctrl` `Shift` `R` reset and replay boot.

The terminal has tab completion, history, and `ls`/`cd`/`cat` over the real
content tree. `cat failures/ota-dev-bundle` prints the crash report.
