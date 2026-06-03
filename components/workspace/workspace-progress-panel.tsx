"use client";

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
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  actionProgressAddCustomSubtask,
  actionProgressAddCustomTask,
  actionProgressAddCustomTaskList,
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
import { SkillRecommendMenu } from "@/components/workspace/skill-recommend-menu";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import type {
  WorkspaceProgressChecklist,
  WorkspaceProgressTask,
  WorkspaceProgressTaskList,
} from "@/lib/workspace-progress-checklist";
import {
  categoryAllLeavesComplete,
  collectLeavesForCategory,
} from "@/lib/workspace-progress-checklist";

function slotBadge(status: ArenaCategorySlot["status"]): {
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
};

function SkillProgressBody({
  projectId,
  slot,
  taskLists,
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
}: SkillProgressBodyProps) {
  const category = slot.category as ProfessionalJobCategory;

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

  const handleToggleLeaf = useCallback(
    (leafId: string, completed: boolean) => {
      onRun(() =>
        actionProgressToggleLeaf(projectId, category, leafId, completed),
      );
    },
    [category, onRun, projectId],
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

  return (
    <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50/40">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || counts.total === 0}
          onClick={() =>
            onRun(() =>
              actionProgressSetCategoryLeaves(projectId, category, true),
            )
          }
          className="text-xs font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Check all
        </button>
        <button
          type="button"
          disabled={pending || counts.total === 0}
          onClick={() =>
            onRun(() =>
              actionProgressSetCategoryLeaves(projectId, category, false),
            )
          }
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

              return (
                <li
                  key={taskList.id}
                  className="rounded-xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTaskList(taskList.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50/80 rounded-xl"
                    aria-expanded={taskListOpen}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${taskListOpen ? "rotate-0" : "-rotate-90"}`}
                      aria-hidden
                    />
                    <span className="min-w-0">{taskList.title}</span>
                    {!taskList.standard ? (
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        Custom
                      </span>
                    ) : null}
                  </button>
                  {taskListOpen ? (
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
                            newSubtaskTitle={newSubtaskTitle[task.id] ?? ""}
                            onToggleTask={onToggleTask}
                            onToggleLeaf={handleToggleLeaf}
                            onNewSubtaskTitleChange={onNewSubtaskTitleChange}
                            onAddSubtask={handleAddSubtask}
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

      {allDone && counts.total > 0 ? (
        <p className="text-xs text-emerald-800 font-medium">
          All subtasks for this skill are done — the Idea Arena card shows this
          slot as complete.
        </p>
      ) : null}
    </div>
  );
}

type WorkspaceProgressPanelProps = {
  projectId: string;
  projectTitle: string;
  checklist: WorkspaceProgressChecklist;
  categoryStatuses: ArenaCategorySlot[];
};

export function WorkspaceProgressPanel({
  projectId,
  projectTitle,
  checklist,
  categoryStatuses,
}: WorkspaceProgressPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(
    () => new Set(categoryStatuses.map((s) => s.category)),
  );
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

  const toggleSkill = useCallback((category: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

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

  const leafCounts = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const slot of categoryStatuses) {
      const leaves = collectLeavesForCategory(checklist[slot.category]);
      const total = leaves.length;
      const done = leaves.filter((l) => l.completed).length;
      map.set(slot.category, { done, total });
    }
    return map;
  }, [checklist, categoryStatuses]);

  if (categoryStatuses.length === 0) {
    return (
      <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-600">
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
          const block = checklist[slot.category];
          const taskLists = block?.taskLists ?? [];
          const counts = leafCounts.get(slot.category) ?? { done: 0, total: 0 };
          const badge = slotBadge(slot.status);
          const skillOpen = expandedSkills.has(slot.category);
          const allDone = categoryAllLeavesComplete(block);
          const showRecommend =
            !slot.teamCoversCategory && slot.status !== "complete";

          return (
            <li
              key={slot.category}
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
                        className={`text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {counts.total === 0
                        ? "No subtasks yet"
                        : `${counts.done} / ${counts.total} subtasks done`}
                    </p>
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
                <SkillProgressBody
                  projectId={projectId}
                  slot={slot}
                  taskLists={taskLists}
                  counts={counts}
                  allDone={allDone}
                  pending={pending}
                  expandedTaskLists={expandedTaskLists}
                  expandedTasks={expandedTasks}
                  newTaskListTitle={newTaskListTitle[slot.category] ?? ""}
                  newTaskTitle={newTaskTitle}
                  newSubtaskTitle={newSubtaskTitle}
                  onToggleTaskList={toggleTaskList}
                  onToggleTask={toggleTask}
                  onExpandTask={expandTask}
                  onNewTaskListTitleChange={(value) =>
                    setNewTaskListTitle((prev) => ({
                      ...prev,
                      [slot.category]: value,
                    }))
                  }
                  onNewTaskTitleChange={(taskListId, value) =>
                    setNewTaskTitle((prev) => ({
                      ...prev,
                      [taskListId]: value,
                    }))
                  }
                  onNewSubtaskTitleChange={(taskId, value) =>
                    setNewSubtaskTitle((prev) => ({
                      ...prev,
                      [taskId]: value,
                    }))
                  }
                  onRun={run}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
