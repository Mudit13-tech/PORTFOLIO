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
URL that server-renders on its own. The stylesheet hides the plain document,
and a `<style>` inside a `<noscript>` puts it back — so a visitor with
JavaScript disabled, and a crawler that does not execute it, both get the whole
portfolio as readable HTML, and neither state flashes, because the parser makes
both decisions before the first frame.

**Nothing is read from `localStorage` during a render.** The saved desk is
applied from an effect after mount. Reading it while rendering made the first
client render disagree with the server's; React threw the tree away and rebuilt
it, and on a document React owns that took `<html>`'s attributes with it — so
the entire operating system disappeared and the plain document showed up in its
place, for exactly the visitors who had been here before.

**One content layer, two shells.** The desktop gets a menu bar, a desk with
widgets and icons, a dock and a window manager; the phone gets a home screen
and full-screen sheets. Both render the identical app components. A 390px
screen never pretends to be a draggable desktop.

**The desk is drawn, not downloaded.** The wallpaper is four gradient layers —
an instrument grid, contour rings, two light sources and a base — so it costs
zero bytes and zero DOM nodes, and it re-values itself for the light theme
instead of shipping a second photograph. Every piece of chrome is one material:
the desk behind it, blurred, with a hairline of light along the top edge. Where
a browser cannot blur, the panel turns opaque; legibility never depends on the
effect.

**The heatmap shows two channels without lying about either.** GitHub
contributions fill the upper-left triangle of a day, LeetCode submissions the
lower-right, and the two are never summed — a commit count plus a problem count
is a number that means nothing. Each ramp is single-hue and steps from its own
quartiles over the sampled window, so the colour reads as busy-for-this-person
rather than busy-against-an-invented-ceiling. It carries a legend, a live
readout that arrow keys drive, and a monthly table for anyone reading it with a
screen reader or with colour turned off.

**The drag is 1:1.** No animation library. Pointer events write the transform
directly and React never sees the intermediate frames, because a window that
lags the cursor is the loudest possible counter-argument to "I can build a
system".

## Layout

```
data/                      content, typed. The only source of counts.
  activity.json            the sampled year behind the heatmap
src/os/                    the system: store, geometry, drag, shortcuts, routing, theme
src/apps/                  app content. No hooks — renders server-side and in a window
src/components/shell/      menu bar, desk icons, dock, phone home screen, boot
src/components/desktop/    desk widgets
src/components/window/     the window manager
src/components/system/     heatmap, launcher, desk menu, overlays
src/lib/                   derived.ts — counts and metrics; activity.ts — the heatmap model
src/app/                   routes. One per app, one per record
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

`?` shortcuts · `Ctrl` `K` search everything · `Esc` close · `Ctrl` `` ` ``
cycle · `Ctrl` `1`–`8` open by index · `Ctrl` `T` terminal · `Ctrl` `W` close ·
`Ctrl` `M` minimize · `Ctrl` `↑` maximize · `Ctrl` `←`/`→` snap ·
`Ctrl` `Shift` `D` dev mode · `Ctrl` `Shift` `R` reset and replay boot.

Right-click the desk for the same actions with a pointer. Arrow keys move
between desktop icons, and through the heatmap once it has focus.

The terminal has tab completion, history, and `ls`/`cd`/`cat` over the real
content tree. `cat failures/ota-dev-bundle` prints the crash report.
