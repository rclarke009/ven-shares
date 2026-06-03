---
name: Recommend Team Member label
overview: Rename the existing skill Recommend button label from "Recommend" to "Recommend Team Member" in the shared menu component. Visibility stays unchanged — only users with workspace access see the Organizer panel where the button lives.
todos:
  - id: rename-button-label
    content: Update SkillRecommendMenu button text to "Recommend Team Member" and add aria-label
    status: completed
  - id: verify-layout
    content: Check narrow-width skill row header; add whitespace-nowrap or padding tweak if needed
    status: completed
isProject: false
---

# Rename Recommend → Recommend Team Member

## Goal

Update the green outline button on unassigned skill rows so it reads **Recommend Team Member** instead of **Recommend**, matching your mockup annotation.

No new surfaces, no behavior changes — email invite and copy-link actions stay the same.

## Where the button lives today

The label is defined in one place: [`components/workspace/skill-recommend-menu.tsx`](components/workspace/skill-recommend-menu.tsx) (line 93).

That component is rendered from [`WorkspaceOrganizerPanel`](components/workspace/workspace-progress-panel.tsx) when:

```ts
showRecommend = !slot.teamCoversCategory && slotStatus !== "complete"
```

It appears on:

- **Workspace Organizer tab** (`/idea-arena/{id}/workspace?tab=organizer`) — for owners and joined professionals
- **Dashboard progress cards** — embedded `WorkspaceOrganizerPanel` for inventors

It does **not** appear on the Idea Arena **project detail page** ([`project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx)). Your mockup’s white skill cards match the Organizer row layout; this change updates that existing control only.

## Visibility (no code change needed)

You chose **anyone with workspace access**. That is already how it works:

- The workspace page is gated by [`getWorkspaceAccessFlags`](lib/workspace-access.ts) (owner or `project_members` row)
- `showRecommend` is not restricted to `isProjectOwner` — joined professionals see it on unassigned skills too
- Dashboard cards are owner-only, which is a subset of workspace access

## Implementation

### 1. Update button label

In [`skill-recommend-menu.tsx`](components/workspace/skill-recommend-menu.tsx):

- Change visible text: `"Recommend"` → `"Recommend Team Member"`
- Keep `"Copied!"` feedback after copy-link
- Add `aria-label={`Recommend team member for ${skillCategory}`}` on the trigger button (clearer for screen readers with the longer visible label)

### 2. Minor layout check

The longer label may need a small tweak so it doesn’t crowd the skill header on narrow widths:

- Add `whitespace-nowrap` to the button (preferred — keeps one line)
- If it overflows on very small screens, slightly reduce horizontal padding (`px-2` instead of `px-2.5`) — only if manual check shows clipping

No changes to [`lib/skill-recommend-invite.ts`](lib/skill-recommend-invite.ts) email copy unless you want the phrase “Recommend Team Member” in the mailto body (not requested).

## Files to touch

| File | Change |
|------|--------|
| [`components/workspace/skill-recommend-menu.tsx`](components/workspace/skill-recommend-menu.tsx) | Label + optional `aria-label` + layout tweak |

## Manual test

1. Open workspace Organizer for a project with at least one **unassigned** skill (no team coverage, not complete).
2. Confirm button reads **Recommend Team Member** (not **Recommend**).
3. Click → menu still offers **Email invite** and **Copy invite link**; copy still shows **Copied!**
4. Covered or complete skills — button still hidden.
5. As a joined professional (non-owner) with workspace access — button still visible on unassigned skills.
6. Dashboard inventor card — same updated label on embedded Organizer rows.

## Out of scope

- Adding the control to the Idea Arena project detail page (separate feature if desired later)
- In-app messaging recommend flow (deferred in original plan)
