# Design system

The app is one object made from a few parts. Every screen is judged against the vision first;
the mechanics below only serve it. The design lab (`/design-lab`, a full page outside the app
shell) shows the parts live.

## Vision

1. **Related things share geometry.** Nothing picks a corner, an edge or a line for itself; it
   takes them from what it relates to.
   - Inside something: concentric. A surface's corner is the distance to its content: holding
     text (which has no corner), corner equals inset; holding rounded things, their corner plus
     the gap. Controls are the exception: their corner is a quarter of their height (decision 1).
   - Beside something: the same corner, the same top edge, the same text line.
   - Above or below, in a column: the same edges.
   - In a row: the same centre line, where the letters' centre counts, not their box's.
2. **One character.** Rounded, soft, minimal. Surfaces separate by shape and space, not by lines
   and boxes.
3. **One part, one make.** The same thing is built the same way everywhere: an icon button is the
   same square, a row is the same row. Consistency comes from reusing a part, not fixing copies.
   A spacing belongs to the part that owns it, so reading the code tells you the result; if you
   have to measure the page to know an inset, the code is wrong.
4. **Few elements.** No tool-panel density (rails, dividers, key chips, segmented bars) unless it
   earns its place. Say a thing once: nothing repeats what its container or neighbour already
   shows (a pane doesn't repeat its tab's title or close, a preview doesn't repeat its row).
5. **Content first.** Show the things themselves, calmly; controls appear when you act on them,
   they are not the layout.

## Decisions

Settled per component in review, in order. Each one applies to every later component too.

<!-- One entry per component: what was wrong, the layout chosen, and the rule it adds. -->

1. **Buttons: shadcn's sizes.** Was fourteen size variants. Now shadcn's ladder, text and icon
   paired: `xs` 24, `sm` 32, `default` 36, `lg` 40, and the squares `icon-xs` 24, `icon-sm` 32,
   `icon` 36, `icon-lg` 40. `xs` is for inline actions (message and row actions), with 12px icons;
   every other size has 16px icons. A button's corner is a quarter of its height (6, 8, 9, 10).
   No circles, except the one send button. A control holding only an icon (Button, Toggle,
   composer control) is an icon size, never a text size with an icon in it. Actions in one group
   share one variant. Long labels use `wrap`, not a size. No separate mobile heights; touch gets
   a larger hit area instead.
   Fields stand on the same ladder: an input, select or number field of a size is exactly as
   tall as a button of that size (`default` 36, `sm` 32, `lg` 40, `compact`/`xs` 24), so a field
   and its button line up.

2. **Row.** Lines share one rhythm: each sits in a 20px slot, one step (8) apart, and the row's
   height comes from its lines (two lines 64, three 92), never a fixed height. An icon or chip
   beside text centres on the text's x-height, not its line box: `optical-centre` moves it down
   0.09em (about 1px), so the line keeps one baseline and the lowercase letters sit on the chip's
   centre. A part that always sits beside text carries it itself (`ProjectFavicon` does).

3. **Cards and nesting.** Corners only come from the rings (24, 16, 8), each one step inside the
   last, so an inner corner is the outer corner less a step. Gaps are counted from the outer edge,
   so a 1px border sits inside the gap and never produces an off-step corner. The chat window
   (pane) is a region, 24, so the rings run whole inside it: the thread details card one step in is
   a box, 16, and its rows one step inside that are 8. (At 16 the pane had room for one ring, so a
   padded card could not sit in its corner.) A card is a box, 16, with its rows one step in on
   every side.
   It owns that inset and spaces its groups one step apart; the sections inside add no padding of
   their own. Rows are one make: a row's label is `text-body` at normal weight wherever the row
   appears (menus, sidebar, cards), and `text-meta` is only for what is secondary inside it (a
   status, a count, a hint). Groups are one step apart and named by a label, like a menu's
   (decision 5), but only a list (side chats, servers) or a group of two or more rows gets one: a
   lone row names itself, so its group is just the space above it. A label holding actions always
   shows. Roots are rem, so the
   whole system scales with the base font size.

4. **Titlebar.** A header's content lines up with the pane below it: the first and last glyphs
   sit one step (8) inside the pane's edges, whether they are text, a chip or an icon button
   (whose glyph is already one step inside its box, so the box sits flush with the edge). Every
   titlebar button is the `icon-sm` square.

5. **Floats.** A menu separates its groups with one step of space and their labels, no lines.
   Its rows are shadcn's: 32 tall, body text (14), 16px icons, at every window size, in every
   menu part (menus, selects, comboboxes, the context menu). A checkbox row keeps its check's
   column when unchecked, so every label starts on one edge. A
   hover preview is an extension of its row: the row's corner (`corner="row"`), its top edge and
   its text line, and only what the row doesn't already show.

6. **Pane bars.** Every bar of controls inside a pane is the one `pane-bar` part: its end
   controls sit in the pane's corners, so it insets them by the pane's corner less theirs (24 − 8
   = 16) on every side and meets the content with that space, no line. It holds only what the tab doesn't: the side chat's bar
   is Bring back (`sm`) and Delete (`icon-sm`); its title and close are the tab's.

7. **Model picker.** Built like a menu with the provider strip beside it, not like a small app.
   It is as tall as its content: the list sizes to the tab it shows (up to a cap, then scrolls),
   the strip and the reasoning column end with it, and the reasoning column is only as wide as
   its levels. Reasoning stays one click away once the picker is open. No lines between regions;
   each insets its content a step. A selected strip item is a filled `icon-sm` square, not a tick;
   shortcuts are a hint on the row you point at, not a key chip; the check sits at the row's end.
   A two-way choice (Standard or Fast) is the app's segmented toggle group, whose 32 tall,
   8-cornered track is concentric in the popup's corner. A longer choice whose options need names
   (the permission modes) is plain menu rows, the current one checked; a row's description is a
   tooltip that opens for the pointer only, so Escape still closes the menu and nothing reflows. A search field anywhere is a filled row,
   not an underline.

8. **Selection.** The chosen item of any list is marked one way: its row is filled
   (`bg-foreground/8`), like the selected thread in the sidebar. No check mark for a single
   choice, in any part (menus, selects, comboboxes, pickers, the model strip, segmented toggles),
   and none for a list that takes several either: each chosen row is filled. A checkbox control
   stays a checkbox.
   A check is for a status (copied, connected, the effective layer), never for "this one".

9. **Settings is the app.** Not a modal over it: the sidebar holds the settings nav (a Back row,
   search, the sections as sidebar rows), the page is the main pane, and the titlebar breadcrumb
   says Settings / Section. A section is a group label and its rows, no box. A setting is a row:
   its name and description, its control at the end. A value is the plain value button (a ghost
   select, as wide as its value); a status is coloured text, not a chip; a link is brighter text,
   underlined only on hover; nothing repeats what its control already shows ("Off" beside a switch).
   A description says only what the setting's name and control don't: no "Adjust the contrast"
   under Contrast, no list of the options its control already offers. A section named like its
   page shows no label (only its actions). A
   page uses only these parts. Appearance: colour scheme is the segmented toggle; themes are a
   gallery of box tiles (orbs over the name), the theme on screen filled, the other half's orb
   dimmed, actions on hover; no previews, since the app around you is the preview.

10. **Fields and buttons are filled, not boxed.** Every text field, number field, textarea, select
    field and outline button is a filled row (`bg-foreground/6`, no border, no edge shadow),
    like the search field; focus keeps its ring.
    Adding to a list is one make everywhere: an `xs` `ghost-muted` button with a plus, on the
    list's label or title row ("Add option", "Add hub"). A filled button is a form's own action.

11. **A long list scrolls in place.** A list that can outgrow the page (a provider's models) sits
    in a `ScrollArea` capped so a row is cut in half: the cut and the edge fade say there is more.
    The scrollbar overlays, so the rows' controls stay on the column edge. The page shows what
    people come back for first; set-once configuration (paths, arguments, variables) folds under
    a closed label that opens like any section label.
    A list where some items are set aside (models hidden from the picker) has no control column:
    the set-aside ones sit under their own label, and the move is a word ("Hide", "Show") that
    appears on the row you point at. A column of switches puts the page's weight on one edge.
    A list of things that each take a few fields (snooze options) reads as it does where it is
    used: each row is what the menu says and when. Its fields open in a float on click, a small
    form of the parts at one height (32), each line edge to edge; the row stays in view and
    updates, so the float never repeats it.

12. **Every modal is one make.** A dialog is a float (16): what it holds (rows, fields, buttons)
    sits one step in (8), text sits on its rows' text edge (16), and the footer is the actions in
    the corner, no band. Three widths: `sm` a question, `md` a form, `lg` content to read. The
    title is `text-heading`, left-aligned, the same in alerts. A form is fields from `ui/field`:
    a row (name left, control right) or, for long free text, the name above the control; groups
    of fields sit under section labels. No stacked bold labels, no paragraph saying what the
    title already says.

13. **Height.** Depth is said by how high a thing sits, and only floats are shaded. Each height
    has one make:
    - **Flat**, part of the plane: a tint. Panes, rows, fields, tracks, unchecked boxes, ghost
      buttons. A field is a place you put things, not something you press.
    - **Raised**, a thing you press: a lighter tint, no shading (`raised`). Outline buttons,
      triggers, the chosen segment or toggle. Filled buttons keep their own colour. A switch's
      knob is the one thing sitting on another, so it alone casts a soft shadow; it is the same
      white on and off, and only the track changes.
    - **Floating**, level with the frame (see Levels): glass a shade lighter than the panes, as
      see-through as the Glass opacity setting says, a light edge and a soft shadow that falls on
      the chat. Thread details, menus, popovers, dialogs, toasts, tooltips. No highlight. The
      composer is chat, not a float; its drawers (notices, stash, queue) stand on its top edge
      one corner in, behind it: its glass a shade darker.

    The levels themselves follow one ladder: lower is darker. Every level is the frame's colour
    moved by its own lightness offset, neighbours kept close: a float +0.015, chat (messages, composer) -0.005, a composer
    drawer halfway to the floor, the window's floor (and the sky's paper) -0.01. In dark themes
    the frame is never darker than 0.155, so the floor stops at 0.145 instead of black; a theme with
    a darker frame is lifted to that anchor.

    Higher is lighter, in fixed steps. Three tints and nothing between: `tint-1` (a field, a
    track, a selected row), `tint-2` (hover, a highlighted row, an off switch or box) and the
    raised face, two steps above its track. Hover is a step up from where you are. Pressing lowers
    a thing to `tint-2` while held or while its popup is open; choosing raises one. In light
    themes the same mixes step darker. `t3code/no-off-ladder-tints` holds `components/ui` to the
    ladder.

14. **Pages with lists.** The sidebar lists, the window works, floats glance. Pull requests and
    issues follow the thread rule: their footer icons swap what the sidebar lists (the thread
    list's header row, then `SidebarItemCard`s under `SidebarItemGroupHeading`s: where and when,
    the title, the key and one word of state), and the open item fills the window like a thread,
    its crumbs and actions in the frame header at the header's height (`ListPageWindow`,
    `BarContext`). No tabs, no columns of controls on the page. Usage, a thing you glance at, is a
    float from its icon (`UsageGlance`); the full cost and tokens open from it as a page.
    A page that is not a thread is solid, as Settings is: no sky, no glass, Settings' container,
    parts labelled the way Settings labels its groups (`WindowPage`, `PageSection`). Figures are
    rows like Settings rows: name and detail left, value and detail right (`UsageRow`), in the
    four type sizes. No tables, no custom figure sizes.

## Mechanics

- **Nest.** Rings build every inset and corner: `nest-region` (24), `nest-box` (16), `nest-row`
  (8), `nest-text`. Each insets what it holds by one step (8) and is one step rounder.
- **Space.** Rows in a list sit half a step apart (`gap-1`), so a hovered row beside a selected one
  stays two shapes; related things one step apart (`gap-2`); separate things three (`gap-6`).
- **Size.** Layout is whole steps (rows `h-6`, `h-8`, `h-10`). Inside a control, or anything
  smaller than a row, half steps work too (`h-7`, `px-3`, `rounded-chip`).
- **Type.** `text-title`, `text-heading`, `text-body`, `text-meta`. **Ink:** `text-ink-1/2/3`.
- **Roots** (`index.css`): `--step` 0.5rem (8px), `--type-base` 0.875rem (14px), `--type-ratio` 1.2.
- **Levels.** Three heights, top first, like a black slab with the chat window carved in it as a
  bowl. Top: the frame (sidebar, header) and, level with it but not part of it, the floats
  (thread details, menus, popovers, dialogs, toasts, tooltips). Chat: messages, code, changed
  files, cards and the composer, a little below the top, no shadow. Sky: the bottom of the bowl.
  Every item on a level looks the same: its background, blur, edge, shadow and corner all come
  from `level-frame`, `level-chat` or `level-float`, and it sets none of them itself
  (`t3code/one-look-per-level`). A corner in the OS window's corner follows the OS curve
  (`--window-corner`).
- **Enforcement.** `pnpm tokens` moves classes onto the grid and `pnpm lint` fails while anything
  is off; `shadcn/no-arbitrary-values` bans raw values. Option+Shift+G (dev) draws the grid and
  shades every ring, so anything unshaded is off the system.
