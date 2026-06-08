"use client";

import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { useWorkspaceSkillExpand } from "@/lib/use-workspace-skill-expand";
import { organizerSkillDomId } from "@/lib/workspace-progress-flowchart-layout";

import {
  actionProgressAddCustomSubtask,
  actionProgressAddCustomTask,
  actionProgressAddCustomTaskList,
  actionProgressArchiveCustomItem,
  actionProgressMoveTask,
  actionProgressReorderSubtasks,
  actionProgressSetCategoryLeaves,
  actionProgressToggleLeaf,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import {
  ProgressTaskRow,
  subtaskSortableId,
  taskSortableId,
} from "@/components/workspace/progress-task-row";
import { ProgressStatusIcon } from "@/components/workspace/progress-status-icon";
import { WorkspaceArchiveControl } from "@/components/workspace/workspace-archive-control";
import {
  OrganizerSkillFiles,
  OrganizerUncategorizedFiles,
} from "@/components/workspace/organizer-skill-files";
import { SkillRecommendMenu } from "@/components/workspace/skill-recommend-menu";
import { SkillTeamRoster } from "@/components/idea-arena/skill-team-roster";
import type { WorkspaceFileDTO } from "@/components/workspace/workspace-shell";
import type { ArenaCategoryCoverage } from "@/lib/arena-team-display";
import type {
  ArenaCategorySlot,
  ArenaCategorySlotStatus,
} from "@/lib/projects-arena";
import type {
  ArchivedProgressEntry,
  ProgressCustomItemKind,
  WorkspaceProgressCategoryBlock,
  WorkspaceProgressChecklist,
  WorkspaceProgressTask,
  WorkspaceProgressTaskList,
} from "@/lib/workspace-progress-checklist";
import {
  categoryAllLeavesComplete,
  categoryHasAnyLeafCompleted,
  collectArchivedProgressEntries,
  collectLeavesForCategory,
  deriveTaskListStatus,
  filterActiveTaskLists,
  progressItemStatusLabel,
  setAllLeavesInCategory,
  setLeafCompleted,
} from "@/lib/workspace-progress-checklist";

function formatArchivedTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function archivedEntryLabel(entry: ArchivedProgressEntry): string {
  if (entry.kind === "taskList") return entry.item.title;
  if (entry.kind === "task") return entry.item.title;
  return entry.item.title;
}

function archivedEntryKindLabel(kind: ArchivedProgressEntry["kind"]): string {
  switch (kind) {
    case "taskList":
      return "Task list";
    case "task":
      return "Task";
    default:
      return "Subtask";
  }
}

type ArchivedTasksSectionProps = {
  entries: ArchivedProgressEntry[];
};

function ArchivedTasksSection({ entries }: ArchivedTasksSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (entries.length === 0) return null;

  return (
    <div className="pt-2 border-t border-slate-200/80">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
          aria-hidden
        />
        Archived tasks ({entries.length})
      </button>
      {expanded ? (
        <ul className="mt-2 space-y-1.5">
          {entries.map((entry) => (
            <li
              key={`${entry.kind}-${entry.item.id}`}
              className="rounded-lg border border-slate-200 bg-white/80 px-2.5 py-2 text-xs text-slate-600"
            >
              <span className="font-medium text-slate-800">
                {archivedEntryLabel(entry)}
              </span>
              <span className="text-slate-400"> · </span>
              {archivedEntryKindLabel(entry.kind)}
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Archived {formatArchivedTime(entry.archived_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function deriveSlotStatus(
  block: WorkspaceProgressCategoryBlock | undefined,
  teamCoversCategory: boolean,
): ArenaCategorySlotStatus {
  if (categoryAllLeavesComplete(block)) return "complete";
  if (categoryHasAnyLeafCompleted(block) || teamCoversCategory) {
    return "in_progress";
  }
  return "needed";
}

function slotBadge(status: ArenaCategorySlotStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "complete":
      return {
        label: "Complete",
        className: "bg-emerald-100 text-emerald-900",
      };
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-sky-100 text-sky-900",
      };
    default:
      return {
        label: "Needed",
        className: "bg-amber-100 text-amber-900",
      };
  }
}

function findTaskInLists(
  taskLists: WorkspaceProgressTaskList[],
  taskId: string,
): WorkspaceProgressTask | undefined {
  for (const list of taskLists) {
    const task = list.tasks.find((t) => t.id === taskId);
    if (task) return task;
  }
  return undefined;
}

type TaskListDropZoneProps = {
  taskListId: string;
  children: React.ReactNode;
};

function TaskListDropZone({ taskListId, children }: TaskListDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tasklist:${taskListId}`,
    data: { type: "tasklist", taskListId },
  });

  return (
    <ul
      ref={setNodeRef}
      className={`space-y-2 min-h-[2rem] rounded-lg transition-colors ${isOver ? "bg-sky-50/80 ring-1 ring-sky-200" : ""}`}
    >
      {children}
    </ul>
  );
}

type SkillProgressBodyProps = {
  projectId: string;
  slot: ArenaCategorySlot;
  taskLists: WorkspaceProgressTaskList[];
  archivedEntries: ArchivedProgressEntry[];
  counts: { done: number; total: number };
  allDone: boolean;
  pending: boolean;
  expandedTaskLists: Set<string>;
  expandedTasks: Set<string>;
  newTaskListTitle: string;
  newTaskTitle: Record<string, string>;
  newSubtaskTitle: Record<string, string>;
  onToggleTaskList: (taskListId: string) => void;
  onToggleTask: (taskId: string) => void;
  onExpandTask: (taskId: string) => void;
  onNewTaskListTitleChange: (value: string) => void;
  onNewTaskTitleChange: (taskListId: string, value: string) => void;
  onNewSubtaskTitleChange: (taskId: string, value: string) => void;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
  onToggleLeaf: (leafId: string, completed: boolean) => void;
  onSetCategoryLeaves: (completed: boolean) => void;
  onCollapseTask: (taskId: string) => void;
  onCollapseTaskList: (taskListId: string) => void;
};

function SkillProgressBody({
  projectId,
  slot,
  taskLists,
  archivedEntries,
  counts,
  allDone,
  pending,
  expandedTaskLists,
  expandedTasks,
  newTaskListTitle,
  newTaskTitle,
  newSubtaskTitle,
  onToggleTaskList,
  onToggleTask,
  onExpandTask,
  onNewTaskListTitleChange,
  onNewTaskTitleChange,
  onNewSubtaskTitleChange,
  onRun,
  onToggleLeaf,
  onSetCategoryLeaves,
  onCollapseTask,
  onCollapseTaskList,
}: SkillProgressBodyProps) {
  const category = slot.category as ProfessionalJobCategory;
  const [pendingArchiveKey, setPendingArchiveKey] = useState<string | null>(null);

  const allTaskSortableIds = useMemo(
    () =>
      taskLists.flatMap((list) =>
        list.tasks.map((task) => taskSortableId(task.id)),
      ),
    [taskLists],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeType = active.data.current?.type;

      if (activeType === "subtask") {
        const taskId = active.data.current?.taskId as string | undefined;
        const overData = over.data.current;
        if (!taskId || overData?.type !== "subtask") return;
        if (overData.taskId !== taskId) return;

        const task = findTaskInLists(taskLists, taskId);
        if (!task) return;

        const oldIndex = task.subtasks.findIndex(
          (s) => subtaskSortableId(s.id) === active.id,
        );
        const newIndex = task.subtasks.findIndex(
          (s) => subtaskSortableId(s.id) === over.id,
        );
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return;
        }

        const newOrder = arrayMove(
          task.subtasks.map((s) => s.id),
          oldIndex,
          newIndex,
        );
        onRun(() =>
          actionProgressReorderSubtasks(
            projectId,
            category,
            taskId,
            newOrder,
          ),
        );
        return;
      }

      if (activeType === "task") {
        const taskId = active.data.current?.taskId as string | undefined;
        if (!taskId) return;

        const overData = over.data.current;
        let targetTaskListId: string;
        let targetIndex: number;

        if (overData?.type === "tasklist") {
          targetTaskListId = overData.taskListId as string;
          const list = taskLists.find((l) => l.id === targetTaskListId);
          targetIndex = list?.tasks.length ?? 0;
        } else if (overData?.type === "task") {
          targetTaskListId = overData.taskListId as string;
          const list = taskLists.find((l) => l.id === targetTaskListId);
          if (!list) return;
          targetIndex = list.tasks.findIndex(
            (t) => t.id === overData.taskId,
          );
          if (targetIndex === -1) return;
        } else {
          return;
        }

        const sourceList = taskLists.find((l) =>
          l.tasks.some((t) => t.id === taskId),
        );
        if (!sourceList) return;
        const sourceIndex = sourceList.tasks.findIndex((t) => t.id === taskId);
        if (
          sourceList.id === targetTaskListId &&
          sourceIndex === targetIndex
        ) {
          return;
        }

        onRun(() =>
          actionProgressMoveTask(
            projectId,
            category,
            taskId,
            targetTaskListId,
            targetIndex,
          ),
        );
      }
    },
    [category, onRun, projectId, taskLists],
  );

  const handleAddSubtask = useCallback(
    (taskId: string, title: string) => {
      onExpandTask(taskId);
      onRun(async () => {
        const r = await actionProgressAddCustomSubtask(
          projectId,
          category,
          taskId,
          title,
        );
        if (r.ok) {
          onNewSubtaskTitleChange(taskId, "");
          onExpandTask(taskId);
        }
        return r;
      });
    },
    [category, onExpandTask, onNewSubtaskTitleChange, onRun, projectId],
  );

  const handleRequestArchive = useCallback(
    (kind: ProgressCustomItemKind, itemId: string) => {
      setPendingArchiveKey(`${kind}:${itemId}`);
    },
    [],
  );

  const handleCancelArchive = useCallback(() => {
    setPendingArchiveKey(null);
  }, []);

  const handleConfirmArchive = useCallback(
    (kind: ProgressCustomItemKind, itemId: string) => {
      onRun(async () => {
        const r = await actionProgressArchiveCustomItem(
          projectId,
          category,
          kind,
          itemId,
        );
        if (r.ok) {
          setPendingArchiveKey(null);
          if (kind === "task") {
            onCollapseTask(itemId);
          } else if (kind === "taskList") {
            onCollapseTaskList(itemId);
          }
        }
        return r;
      });
    },
    [category, onCollapseTask, onCollapseTaskList, onRun, projectId],
  );

  return (
    <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50/40">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={counts.total === 0}
          onClick={() => onSetCategoryLeaves(true)}
          className="text-xs font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Check all
        </button>
        <button
          type="button"
          disabled={counts.total === 0}
          onClick={() => onSetCategoryLeaves(false)}
          className="text-xs font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Clear all
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allTaskSortableIds}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {taskLists.map((taskList) => {
              const taskListOpen = expandedTaskLists.has(taskList.id);
              const taskListConfirmKey = `taskList:${taskList.id}`;
              const showTaskListConfirm =
                pendingArchiveKey === taskListConfirmKey;
              const taskListStatus = deriveTaskListStatus(taskList);

              return (
                <li
                  key={taskList.id}
                  className="rounded-xl border border-slate-200 bg-white"
                >
                  {showTaskListConfirm ? (
                    <div className="px-3 py-2">
                      <WorkspaceArchiveControl
                        size="sm"
                        showConfirm
                        confirmMessage="Archive this task list? It will stay until the project ends."
                        pending={pending}
                        onCancel={handleCancelArchive}
                        onConfirm={() =>
                          handleConfirmArchive("taskList", taskList.id)
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onToggleTaskList(taskList.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50/80 rounded-xl py-0.5"
                        aria-expanded={taskListOpen}
                        aria-label={`${taskList.title}, ${progressItemStatusLabel(taskListStatus)}`}
                      >
                        <ProgressStatusIcon status={taskListStatus} />
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${taskListOpen ? "rotate-0" : "-rotate-90"}`}
                          aria-hidden
                        />
                        <span className="min-w-0">{taskList.title}</span>
                        {!taskList.standard ? (
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            Custom
                          </span>
                        ) : null}
                      </button>
                      {!taskList.standard ? (
                        <WorkspaceArchiveControl
                          size="sm"
                          pending={pending}
                          disabled={pending}
                          onRequestArchive={() =>
                            handleRequestArchive("taskList", taskList.id)
                          }
                        />
                      ) : null}
                    </div>
                  )}
                  {taskListOpen && !showTaskListConfirm ? (
                    <div className="border-t border-slate-100 px-3 py-2 space-y-2">
                      <TaskListDropZone taskListId={taskList.id}>
                        {taskList.tasks.map((task) => (
                          <ProgressTaskRow
                            key={task.id}
                            projectId={projectId}
                            task={task}
                            taskListId={taskList.id}
                            taskOpen={expandedTasks.has(task.id)}
                            pending={pending}
                            pendingArchiveKey={pendingArchiveKey}
                            newSubtaskTitle={newSubtaskTitle[task.id] ?? ""}
                            onToggleTask={onToggleTask}
                            onToggleLeaf={onToggleLeaf}
                            onNewSubtaskTitleChange={onNewSubtaskTitleChange}
                            onAddSubtask={handleAddSubtask}
                            onRequestArchive={handleRequestArchive}
                            onCancelArchive={handleCancelArchive}
                            onConfirmArchive={handleConfirmArchive}
                          />
                        ))}
                      </TaskListDropZone>

                    <div className="flex gap-2 items-center pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        value={newTaskTitle[taskList.id] ?? ""}
                        onChange={(e) =>
                          onNewTaskTitleChange(taskList.id, e.target.value)
                        }
                        placeholder="New task…"
                        className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const t = (newTaskTitle[taskList.id] ?? "").trim();
                          if (!t) return;
                          onRun(async () => {
                            const r = await actionProgressAddCustomTask(
                              projectId,
                              category,
                              taskList.id,
                              t,
                            );
                            if (r.ok) {
                              onNewTaskTitleChange(taskList.id, "");
                            }
                            return r;
                          });
                        }}
                        className="text-xs font-semibold text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
                      >
                        Add task
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-200/80">
        <input
          type="text"
          value={newTaskListTitle}
          onChange={(e) => onNewTaskListTitleChange(e.target.value)}
          placeholder="New task list…"
          className="flex-1 min-w-48 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const t = newTaskListTitle.trim();
            if (!t) return;
            onRun(async () => {
              const r = await actionProgressAddCustomTaskList(
                projectId,
                category,
                t,
              );
              if (r.ok) {
                onNewTaskListTitleChange("");
              }
              return r;
            });
          }}
          className="text-xs font-semibold rounded-md px-2.5 py-1.5 bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-50"
        >
          Add task list
        </button>
      </div>

      <ArchivedTasksSection entries={archivedEntries} />

      {allDone && counts.total > 0 ? (
        <p className="text-xs text-emerald-800 font-medium">
          All subtasks for this skill are done — the Idea Arena card shows this
          slot as complete.
        </p>
      ) : null}
    </div>
  );
}

type WorkspaceOrganizerPanelProps = {
  projectId: string;
  projectTitle: string;
  checklist: WorkspaceProgressChecklist;
  categoryStatuses: ArenaCategorySlot[];
  categoryCoverage: ArenaCategoryCoverage[];
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  currentUserId: string;
  viewerCoveredCategories: ProfessionalJobCategory[];
  isProjectOwner: boolean;
};

export function WorkspaceOrganizerPanel({
  projectId,
  projectTitle,
  checklist,
  categoryStatuses,
  categoryCoverage,
  files,
  nameMap,
  currentUserId,
  viewerCoveredCategories,
  isProjectOwner,
}: WorkspaceOrganizerPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightFileId = searchParams.get("file");
  const highlightSkill = searchParams.get("skill");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localChecklist, setLocalChecklist] =
    useState<WorkspaceProgressChecklist>(checklist);

  useEffect(() => {
    setLocalChecklist(checklist);
  }, [checklist]);

  const { expandedSkills, toggleSkill, expandSkill } = useWorkspaceSkillExpand({
    projectId,
    userId: currentUserId,
    userSkills: viewerCoveredCategories,
    allCategories: categoryStatuses.map((s) => s.category),
  });

  useEffect(() => {
    if (!highlightFileId) return;
    const target = files.find((f) => f.id === highlightFileId);
    if (!target?.job_category) return;
    expandSkill(target.job_category);
  }, [highlightFileId, files, expandSkill]);

  useEffect(() => {
    if (!highlightSkill) return;
    if (!categoryStatuses.some((s) => s.category === highlightSkill)) return;
    expandSkill(highlightSkill);
    requestAnimationFrame(() => {
      const el = document.getElementById(organizerSkillDomId(highlightSkill));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [highlightSkill, categoryStatuses, expandSkill]);
  const [expandedTaskLists, setExpandedTaskLists] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    () => new Set(),
  );
  const [newTaskListTitle, setNewTaskListTitle] = useState<
    Record<string, string>
  >({});
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>(
    {},
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<
    Record<string, string>
  >({});

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const toggleTaskList = useCallback((taskListId: string) => {
    setExpandedTaskLists((prev) => {
      const next = new Set(prev);
      if (next.has(taskListId)) next.delete(taskListId);
      else next.add(taskListId);
      return next;
    });
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const expandTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
  }, []);

  const collapseTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const collapseTaskList = useCallback((taskListId: string) => {
    setExpandedTaskLists((prev) => {
      const next = new Set(prev);
      next.delete(taskListId);
      return next;
    });
  }, []);

  const run = useCallback(
    (fn: () => Promise<{ ok: boolean; error?: string }>) => {
      setError(null);
      startTransition(() => {
        void (async () => {
          const result = await fn();
          if (!result.ok) {
            setError(
              "error" in result && result.error
                ? result.error
                : "Something went wrong.",
            );
            return;
          }
          refresh();
        })();
      });
    },
    [refresh],
  );

  const toggleLeaf = useCallback(
    async (
      category: ProfessionalJobCategory,
      leafId: string,
      completed: boolean,
    ) => {
      setError(null);
      setLocalChecklist((prev) => {
        const next = setLeafCompleted(prev, category, leafId, completed);
        return next ?? prev;
      });

      const result = await actionProgressToggleLeaf(
        projectId,
        category,
        leafId,
        completed,
      );
      if (!result.ok) {
        setLocalChecklist((prev) => {
          const reverted = setLeafCompleted(prev, category, leafId, !completed);
          return reverted ?? prev;
        });
        setError(
          "error" in result && result.error
            ? result.error
            : "Something went wrong.",
        );
      }
    },
    [projectId],
  );

  const setCategoryLeaves = useCallback(
    async (category: ProfessionalJobCategory, completed: boolean) => {
      setError(null);
      setLocalChecklist((prev) => {
        const next = setAllLeavesInCategory(prev, category, completed);
        return next ?? prev;
      });

      const result = await actionProgressSetCategoryLeaves(
        projectId,
        category,
        completed,
      );
      if (!result.ok) {
        setLocalChecklist((prev) => {
          const reverted = setAllLeavesInCategory(prev, category, !completed);
          return reverted ?? prev;
        });
        setError(
          "error" in result && result.error
            ? result.error
            : "Something went wrong.",
        );
      }
    },
    [projectId],
  );

  const leafCounts = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const slot of categoryStatuses) {
      const leaves = collectLeavesForCategory(localChecklist[slot.category]);
      const total = leaves.length;
      const done = leaves.filter((l) => l.completed).length;
      map.set(slot.category, { done, total });
    }
    return map;
  }, [localChecklist, categoryStatuses]);

  const coverageByCategory = useMemo(
    () => new Map(categoryCoverage.map((c) => [c.category, c])),
    [categoryCoverage],
  );

  if (categoryStatuses.length === 0) {
    return (
      <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-base text-slate-600">
        This project doesn’t list team skills yet. The inventor can add them
        from the dashboard.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {categoryStatuses.map((slot) => {
          const block = localChecklist[slot.category];
          const taskLists = filterActiveTaskLists(block);
          const archivedEntries = collectArchivedProgressEntries(block);
          const counts = leafCounts.get(slot.category) ?? { done: 0, total: 0 };
          const slotStatus = deriveSlotStatus(block, slot.teamCoversCategory);
          const badge = slotBadge(slotStatus);
          const skillOpen = expandedSkills.has(slot.category);
          const allDone = categoryAllLeavesComplete(block);
          const showRecommend =
            !slot.teamCoversCategory && slotStatus !== "complete";
          const cov = coverageByCategory.get(slot.category);
          const category = slot.category as ProfessionalJobCategory;

          return (
            <li
              key={slot.category}
              id={organizerSkillDomId(slot.category)}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50/80 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSkill(slot.category)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={skillOpen}
                >
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${skillOpen ? "rotate-0" : "-rotate-90"}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {slot.category}
                      </span>
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {counts.total === 0
                        ? "No subtasks yet"
                        : `${counts.done} / ${counts.total} subtasks done`}
                    </p>
                    <SkillTeamRoster
                      teamLead={cov?.teamLead ?? null}
                      otherMembers={cov?.otherMembers ?? []}
                      variant="compact"
                      complete={slotStatus === "complete"}
                    />
                  </div>
                </button>
                {showRecommend ? (
                  <SkillRecommendMenu
                    projectId={projectId}
                    projectTitle={projectTitle}
                    skillCategory={slot.category}
                  />
                ) : null}
              </div>

              {skillOpen ? (
                <>
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-600">
                      Tasks and milestones for this skill are on the{" "}
                      <Link
                        href={`/workspace/${projectId}?tab=journey`}
                        className="font-semibold text-[#15803d] hover:underline"
                      >
                        Journey
                      </Link>{" "}
                      tab.
                    </p>
                  </div>
                  <OrganizerSkillFiles
                    projectId={projectId}
                    projectTitle={projectTitle}
                    category={slot.category as ProfessionalJobCategory}
                    files={files}
                    nameMap={nameMap}
                    currentUserId={currentUserId}
                    isProjectOwner={isProjectOwner}
                    highlightFileId={highlightFileId}
                  />
                </>
              ) : null}
            </li>
          );
        })}
      </ul>

      <OrganizerUncategorizedFiles
        projectId={projectId}
        projectTitle={projectTitle}
        files={files}
        nameMap={nameMap}
        currentUserId={currentUserId}
        isProjectOwner={isProjectOwner}
        highlightFileId={highlightFileId}
      />
    </div>
  );
}

/** @deprecated Use WorkspaceOrganizerPanel */
export const WorkspaceProgressPanel = WorkspaceOrganizerPanel;
