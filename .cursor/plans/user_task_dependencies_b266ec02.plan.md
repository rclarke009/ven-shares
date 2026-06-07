---
name: User task dependencies
overview: Let workspace users set prerequisites on any Journey item (milestones + skill tasks) via the expanded row on the Journey tab. Per-project overrides replace template defaults for edited nodes; server validates DAG integrity before persisting to the existing `workspace_progress_dependencies` JSON column.
todos:
  - id: graph-overrides
    content: "Extend workspace-progress-graph.ts: parse/store nodeDependencies, resolveDependsOn, cycle validation, strip-on-archive helper"
    status: completed
  - id: sync-persist
    content: Wire nodeDependencies through dependencies-sync, organizer bundle, and workspace page props
    status: completed
  - id: server-actions
    content: Add actionProgressSetNodeDependencies + actionProgressResetNodeDependencies; hook archive cleanup
    status: completed
  - id: journey-ui
    content: Add Prerequisites editor (add/remove/reset) to expanded MilestoneRow in project-journey-panel.tsx
    status: completed
isProject: false
---

# User-defined task dependencies

## Goal

Users can mark that one Journey item depends on another from the **Journey** tab (`/workspace/[projectId]?tab=journey`). Any node (milestone or skill leaf) can have its prerequisites edited. User edits **replace** the built-in template for that node; a **Reset to defaults** action restores template edges.

## Current state

- Dependencies are hard-coded in [`lib/workspace-progress-graph.ts`](lib/workspace-progress-graph.ts) (`PROGRESS_GRAPH_TEMPLATE`, `dependsOnForNode`).
- [`components/workspace/project-journey-panel.tsx`](components/workspace/project-journey-panel.tsx) renders nodes and lock/blocker UX but has no dependency editor.
- [`workspace_progress_dependencies`](supabase/migrations/016_workspace_progress_dependencies.sql) stores milestone completion only — no edge overrides yet.
- No DB migration needed; extend the JSON shape in-place.

## Data model

Extend the persisted JSON (same column):

```ts
type WorkspaceProgressDependenciesJson = {
  milestones?: { id: string; completed: boolean }[];
  /** When present for a nodeId, fully replaces template dependsOn for that node. */
  nodeDependencies?: Record<string, string[]>;
};
```

Resolution rule in graph builder:

```ts
dependsOn(nodeId) = nodeDependencies[nodeId] ?? templateDependsOn(nodeId) ?? []
```

- Untouched nodes keep template behavior.
- Edited nodes use the stored list exactly (including empty `[]`).
- Clearing a key (reset) falls back to template.

```mermaid
flowchart LR
  template[PROGRESS_GRAPH_TEMPLATE] --> resolve[resolveDependsOn]
  overrides[nodeDependencies JSON] --> resolve
  resolve --> graph[buildProgressGraph]
  checklist[checklist completion] --> graph
  milestones[milestone completion] --> graph
  graph --> ui[ProjectJourneyPanel]
```

## Graph library changes — [`lib/workspace-progress-graph.ts`](lib/workspace-progress-graph.ts)

Add helpers:

| Helper | Purpose |
|--------|---------|
| `parseNodeDependencies(raw)` | Parse / sanitize `nodeDependencies` from JSON |
| `resolveDependsOn(nodeId, overrides)` | Template fallback vs override |
| `getDefaultDependsOn(nodeId)` | Expose template default for reset UI |
| `validateNodeDependencies(view, nodeId, dependsOn)` | Reject self-deps, unknown ids, cycles |
| `detectCycle(allNodes)` | DFS cycle check on proposed graph |
| `stripNodeFromDependencies(overrides, removedNodeId)` | Remove archived/deleted node from all lists |
| `applyNodeDependencies(overrides, nodeId, dependsOn)` | Immutable update; `null`/`undefined` key = reset |

Update `buildProgressGraph(...)` signature to accept `nodeDependencies: Record<string, string[]>` and use `resolveDependsOn` instead of `dependsOnForNode` directly.

Update `parseWorkspaceProgressDependencies` / `milestoneStateToJson` → rename export to something like `dependenciesStateToJson` that includes both `milestones` and `nodeDependencies` (keep backward compat for existing rows).

## Server layer

### [`lib/workspace-progress-dependencies-sync.ts`](lib/workspace-progress-dependencies-sync.ts)

- Load `nodeDependencies` alongside milestone state in `ensureWorkspaceProgressDependenciesSynced` / `buildProgressGraphForProject`.
- Add `persistNodeDependencies(projectId, nodeDependencies)` or extend `persistWorkspaceProgressGraphToggle` to accept optional dependency updates.
- Return `{ milestoneState, nodeDependencies }` from bundle loader.

### [`app/idea-arena/[projectId]/workspace/actions.ts`](app/idea-arena/[projectId]/workspace/actions.ts)

New server actions:

1. **`actionProgressSetNodeDependencies(projectId, nodeId, dependsOn: string[])`**
   - Auth + workspace access (same pattern as `actionProgressToggleGraphNode`).
   - Load graph + overrides; validate node exists; run `validateNodeDependencies`.
   - Persist updated `nodeDependencies`; `revalidateArenaAndWorkspace` + dashboard.

2. **`actionProgressResetNodeDependencies(projectId, nodeId)`**
   - Delete override key for `nodeId`; persist; revalidate.

Hook archive cleanup: when [`actionProgressArchiveCustomItem`](app/idea-arena/[projectId]/workspace/actions.ts) succeeds, also call a helper to strip the archived leaf id from all `nodeDependencies` entries (and delete its own override key if present).

## UI — [`components/workspace/project-journey-panel.tsx`](components/workspace/project-journey-panel.tsx)

In the **expanded row** (below description / blocker list), add a **Prerequisites** section:

```
Prerequisites
  [x] Crowdfunding funded          Remove
  [x] Product built and launched   Remove
  [+ Add prerequisite ▼]  (select grouped: VenShares journey → milestones; then each skill section)
  Reset to defaults  (only when override exists AND template default is non-empty or differs)
```

Behavior:

- **Add**: native `<select>` + Add button listing all other graph nodes (exclude self), grouped by section title from `ProgressGraphView.sections`.
- **Remove**: removes one id from the list and saves via `actionProgressSetNodeDependencies`.
- **Reset**: calls `actionProgressResetNodeDependencies`.
- Optimistic local update with rollback on error (same pattern as checkbox toggle).
- Show a subtle “Custom prerequisites” hint when override is active; show template defaults read-only when no override (still editable via add/remove, which creates an override starting from current resolved list).

Pass `nodeDependencies` into `ProjectJourneyPanel` from [`components/workspace/workspace-shell.tsx`](components/workspace/workspace-shell.tsx) (loaded server-side via organizer bundle).

## Validation rules

- No self-dependency.
- All `dependsOn` ids must exist in the current graph node set.
- Graph must remain a DAG (reject updates that introduce a cycle).
- Empty `dependsOn` is valid (fully unlocks a node that had template locks).

## Edge cases

| Case | Handling |
|------|----------|
| User removes all prereqs from a milestone | Allowed (full control); node becomes Ready unless completed |
| Archived custom task | Strip from all dependency lists; remove its override key |
| Node not in graph (wrong category removed) | Stale ids ignored at build time; optional cleanup on load |
| Concurrent edits | Last write wins (consistent with checklist toggles today) |

## Files to touch

| File | Change |
|------|--------|
| [`lib/workspace-progress-graph.ts`](lib/workspace-progress-graph.ts) | Override resolution, validation, cycle detection |
| [`lib/workspace-progress-dependencies-sync.ts`](lib/workspace-progress-dependencies-sync.ts) | Load/persist `nodeDependencies`; pass to graph builder |
| [`lib/workspace-organizer-bundle.server.ts`](lib/workspace-organizer-bundle.server.ts) | Include `nodeDependencies` in bundle returned to workspace page |
| [`app/workspace/[projectId]/page.tsx`](app/workspace/[projectId]/page.tsx) | Pass `nodeDependencies` into shell |
| [`components/workspace/workspace-shell.tsx`](components/workspace/workspace-shell.tsx) | Thread prop to Journey panel |
| [`components/workspace/project-journey-panel.tsx`](components/workspace/project-journey-panel.tsx) | Prerequisites editor UI |
| [`app/idea-arena/[projectId]/workspace/actions.ts`](app/idea-arena/[projectId]/workspace/actions.ts) | Set/reset dependency actions + archive cleanup |

No new migration file.

## Out of scope

- Visual DAG diagram
- Drag-and-drop edge drawing
- Bulk dependency editing
- Dependency editing from Organizer tab (Journey remains canonical)

## Test plan

1. Expand a skill task on Journey → add prerequisite on a milestone → task becomes Locked until milestone is checked.
2. Remove a built-in template prerequisite from a milestone → milestone unlocks early (override persisted).
3. Reset to defaults → template chain restored.
4. Attempt to add a circular dependency (A→B, then B→A) → server rejects with clear error.
5. Archive a custom task that another task depends on → dependent task no longer blocked by archived id.
6. Refresh page → overrides persist; lock/checkbox behavior unchanged for toggles.
