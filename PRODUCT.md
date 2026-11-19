# PRODUCT.md — Product direction

> Why LifeRPG exists, what the finished product should feel like, and what the
> UI planning phase is deciding. The visual rules live in `DESIGN.md`; how to
> run the repository lives in `README.md`.

---

## 1. What LifeRPG is

LifeRPG is a to-do list played as a role-playing game. Real commitments are
written as **quests**; groups of quests become **milestones**; completed work
leaves a mark on the **journal** — a route that is inked, a seal that is set,
experience that accumulates.

The game is a reading layer over real work, not a second job:

- **The task is still the unit of work.** The game never hides what must be
  done or replaces the plain list with flavour text.
- **Progress is acknowledged, not shouted.** XP, levels and seals recognise
  effort; they do not decide whether the effort mattered.
- **The journal is home.** Paper is where the player writes; panel is where
  the world is read: character state, the route, meters and rewards.
- **The world has weather.** Eight palettes change the mood; structure,
  hierarchy and behaviour do not move.

## 2. Product pillars

1. **Capture is cheap.** Writing a task must cost less than postponing it.
2. **The log is honest.** A day with two completed quests does not pretend to
   be a heroic campaign; no inflated stats, no fake streak.
3. **Consequences are visible.** Locked milestones, overdue deadlines and
   completed routes are readable at a glance, with text and shape, not colour
   alone.
4. **The game serves the life, never the reverse.** No loss aversion, no streak
   guilt, no “do not break the chain”, no pay-to-win.
5. **Accessible by default.** Keyboard, screen reader, contrast and reduced
   motion are part of the visual system, not a patch added later.
6. **A journal, not a dashboard.** Density comes from the page; the interface
   should feel like an object that ages with use.

## 3. The loop (direction, not final spec)

1. **Capture.** The player writes a task.
2. **Place it.** It joins a milestone with a deadline or stays in the backlog;
   priority and tag say how it should be read.
3. **Complete.** The quest is checked; the journal records it.
4. **Apply the reward.** The character earns XP; the level moves; the next
   milestone can unlock when the previous one is complete.
5. **Review the route.** The journey shows what is done, what is overdue and
   what comes next.

The UI pieces for steps 2, 3 and 5 already exist (`Questline`, `TaskList`,
`ProgressBar`, `Card`, `Toast`). The economy in step 4 — how much XP, what
counts, how levels and rewards work — is **not designed yet**.

## 4. Current phase: UI planning

The repository is in the **UI planning phase**. It is not the app yet; it is
the place where the app's interface is being decided and verified.

**What exists:**

- The design system: invariant tokens, eight palettes, paper/panel surfaces,
  typography, motion and texture rules.
- The component set, built from the original `design/mockup.html` reference:
  controls, fields, date and time pickers, file uploader, overlays, containers
  and the task/questline composites.
- The **Component Codex** gallery: a single page that renders every component
  on both surfaces and in every theme. It is the review surface, not the
  product.
- The verification harness: Vitest for interaction, Playwright + axe for
  accessibility, overflow from 320 to 1440 px, keyboard and focus.

**Deliberately absent for now:**

- Application state and persistence beyond the theme preference.
- Routing and the real screens of the app (the daily journal, the route, the
  character sheet).
- Backend, accounts, sync and notifications.
- The XP economy, level curve, rewards and streaks.
- A mobile app, PWA/offline strategy and data import/export.

**Definition of done for the UI phase:**

- The core loop has screens composed only from documented components; no
  screen invents a pattern that is not in the codex.
- Every component is documented, keyboard-operable and named accessibly.
- `pnpm lint`, `pnpm test:run` and `pnpm test:e2e` pass on all eight themes
  and both surfaces, with no horizontal scroll from 320 to 1440 px.
- The open product questions below have an owner decision before the
  application layer starts.

## 5. Open product questions

- **What earns XP?** Every completion, only planned quests, or a weighted
  value per task size? Does an overdue task lose XP?
- **What is a level?** A pure progress meter, or does it unlock themes,
  ornaments or journal features?
- **What is a streak in a journal that must not punish rest?**
- **Do habits and recurring tasks exist**, or is every quest one-off?
- **Can a quest be abandoned?** What does the journal record — failure, a
  closed chapter, or nothing?
- **One character or several journals?**
- **Language and tone.** The code and docs are in English; a few defaults are
  in Spanish (`ariaLabel="Tareas"`, the empty state). The product's voice is
  not decided.
- **What ships first?** A local-first single-player journal is the smallest
  honest version; accounts and sync come only if the loop works without them.

## 6. Non-goals

- A generic public component library. Components exist for LifeRPG's screens;
  the gallery is a review surface.
- A gamification layer that rewards busyness or punishes a bad day.
- Storybook, a UI framework, a styling library or a date library.
- Backend, authentication or sync in the UI phase.

## 7. Documentation map

| File | Answers |
| --- | --- |
| `PRODUCT.md` | Why the product exists, the loop, the phase and the open questions. |
| `README.md` | How to run it, the stack, the gallery and the design system in brief. |
| `DESIGN.md` | Why the interface looks and behaves the way it does; tokens, themes, surfaces and components. |
| `AGENTS.md` | Commands, rules and traps for agents working in the repository. |
| `REVISION.md` | The closed technical review of the UI layer. |
| `e2e/FINDINGS.md` | The accessibility harness log. |
| `design/mockup.html` | The original static reference. |
