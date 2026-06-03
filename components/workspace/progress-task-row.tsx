"use client";

import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical } from "lucide-react";

import type {
  WorkspaceProgressLeaf,
  WorkspaceProgressSubtask,
  WorkspaceProgressTask,
} from "@/lib/workspace-progress-checklist";

export function taskSortableId(taskId: string): string {
  return `task:${taskId}`;
}

export function subtaskSortableId(subtaskId: string): string {
  return `subtask:${subtaskId}`;
}

type ProgressTaskRowProps = {
  projectId: string;
  task: WorkspaceProgressTask;
  taskListId: string;
  taskOpen: boolean;
  pending: boolean;
  newSubtaskTitle: string;
  onToggleTask: (taskId: string) => void;
  onToggleLeaf: (leafId: string, completed: boolean) => void;
  onNewSubtaskTitleChange: (taskId: string, value: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
};

function headerCheckboxLeaf(
  task: WorkspaceProgressTask,
): WorkspaceProgressLeaf | null {
  if (task.subtasks.length === 0) {
    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
    };
  }
  if (task.subtasks.length === 1) {
    return task.subtasks[0];
  }
  return null;
}

type SortableSubtaskRowProps = {
  projectId: string;
  subtask: WorkspaceProgressSubtask;
  taskId: string;
  pending: boolean;
  onToggleLeaf: (leafId: string, completed: boolean) => void;
};

function SortableSubtaskRow({
  projectId,
  subtask,
  taskId,
  pending,
  onToggleLeaf,
}: SortableSubtaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtaskSortableId(subtask.id),
    data: { type: "subtask", subtaskId: subtask.id, taskId },
    disabled: pending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex gap-2 items-start"
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 touch-none text-slate-400 hover:text-slate-600 disabled:opacity-50"
        aria-label="Drag to reorder subtask"
        aria-grabbed={isDragging}
        disabled={pending}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <input
        type="checkbox"
        id={`${projectId}-${subtask.id}`}
        checked={subtask.completed}
        disabled={pending}
        onChange={(e) => onToggleLeaf(subtask.id, e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d]"
      />
      <label
        htmlFor={`${projectId}-${subtask.id}`}
        className={`text-sm leading-snug cursor-pointer ${subtask.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
      >
        {subtask.title}
      </label>
    </li>
  );
}

export function ProgressTaskRow({
  projectId,
  task,
  taskListId,
  taskOpen,
  pending,
  newSubtaskTitle,
  onToggleTask,
  onToggleLeaf,
  onNewSubtaskTitleChange,
  onAddSubtask,
}: ProgressTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskSortableId(task.id),
    data: { type: "task", taskId: task.id, taskListId },
    disabled: pending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const checkboxLeaf = headerCheckboxLeaf(task);
  const showSubtaskList = taskOpen && task.subtasks.length > 1;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-100 bg-slate-50/50"
    >
      <div className="flex items-center gap-1.5 px-1.5 py-1.5">
        <button
          type="button"
          className="shrink-0 touch-none text-slate-400 hover:text-slate-600 disabled:opacity-50"
          aria-label="Drag to reorder task"
          aria-grabbed={isDragging}
          disabled={pending}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        {checkboxLeaf ? (
          <input
            type="checkbox"
            id={`${projectId}-${checkboxLeaf.id}`}
            checked={checkboxLeaf.completed}
            disabled={pending}
            onChange={(e) =>
              onToggleLeaf(checkboxLeaf.id, e.target.checked)
            }
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d]"
          />
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => onToggleTask(task.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50/80 rounded-md px-1 py-0.5"
          aria-expanded={taskOpen}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${taskOpen ? "rotate-0" : "-rotate-90"}`}
            aria-hidden
          />
          <span className="min-w-0">{task.title}</span>
          {!task.standard ? (
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              Custom
            </span>
          ) : null}
        </button>
      </div>

      {taskOpen ? (
        <div className="border-t border-slate-100 px-2.5 py-2 space-y-2">
          {showSubtaskList ? (
            <SortableContext
              items={task.subtasks.map((s) => subtaskSortableId(s.id))}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <SortableSubtaskRow
                    key={sub.id}
                    projectId={projectId}
                    subtask={sub}
                    taskId={task.id}
                    pending={pending}
                    onToggleLeaf={onToggleLeaf}
                  />
                ))}
              </ul>
            </SortableContext>
          ) : null}

          <div className="flex gap-2 items-center pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) =>
                onNewSubtaskTitleChange(task.id, e.target.value)
              }
              placeholder="New subtask…"
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const t = newSubtaskTitle.trim();
                if (!t) return;
                onAddSubtask(task.id, t);
              }}
              className="text-xs font-semibold text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
            >
              Add subtask
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
