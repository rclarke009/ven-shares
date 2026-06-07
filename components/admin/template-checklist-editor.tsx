"use client";

import type {
  ChecklistDefinition,
  TemplateTaskListDef,
} from "@/lib/project-templates";

type TemplateChecklistEditorProps = {
  categories: string[];
  definition: ChecklistDefinition;
  onChange: (next: ChecklistDefinition) => void;
};

function emptyTaskList(): TemplateTaskListDef {
  return {
    title: "New milestone group",
    tasks: [{ title: "New task", subtasks: [{ title: "New task" }] }],
  };
}

export function TemplateChecklistEditor({
  categories,
  definition,
  onChange,
}: TemplateChecklistEditorProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Select skill categories on the Skills tab first.
      </p>
    );
  }

  function updateCategory(category: string, taskLists: TemplateTaskListDef[]) {
    onChange({
      ...definition,
      [category]: { taskLists },
    });
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const taskLists = definition[category]?.taskLists ?? [];
        return (
          <details
            key={category}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
            open
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-slate-900">
              {category}
              <span className="ml-2 text-xs font-normal text-slate-500">
                {taskLists.length} group{taskLists.length === 1 ? "" : "s"}
              </span>
            </summary>
            <div className="space-y-4 border-t border-slate-100 px-4 py-4">
              {taskLists.map((list, li) => (
                <div
                  key={`${category}-${li}`}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={list.title}
                      onChange={(e) => {
                        const next = [...taskLists];
                        next[li] = { ...list, title: e.target.value };
                        updateCategory(category, next);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Milestone group title"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = taskLists.filter((_, i) => i !== li);
                        updateCategory(category, next);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove group
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {list.tasks.map((task, ti) => (
                      <li key={`${category}-${li}-${ti}`} className="pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => {
                              const next = [...taskLists];
                              const tasks = [...list.tasks];
                              tasks[ti] = { ...task, title: e.target.value };
                              next[li] = { ...list, tasks };
                              updateCategory(category, next);
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                            placeholder="Task title"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...taskLists];
                              const tasks = list.tasks.filter((_, i) => i !== ti);
                              next[li] = { ...list, tasks };
                              updateCategory(category, next);
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        {task.subtasks.map((sub, si) => (
                          <div
                            key={`${category}-${li}-${ti}-${si}`}
                            className="mt-1 flex flex-wrap items-center gap-2 pl-4"
                          >
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => {
                                const next = [...taskLists];
                                const tasks = [...list.tasks];
                                const subtasks = [...task.subtasks];
                                subtasks[si] = { title: e.target.value };
                                tasks[ti] = { ...task, subtasks };
                                next[li] = { ...list, tasks };
                                updateCategory(category, next);
                              }}
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                              placeholder="Subtask"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...taskLists];
                            const tasks = [...list.tasks];
                            const subtasks = [
                              ...task.subtasks,
                              { title: "New subtask" },
                            ];
                            tasks[ti] = { ...task, subtasks };
                            next[li] = { ...list, tasks };
                            updateCategory(category, next);
                          }}
                          className="mt-1 pl-4 text-xs text-[#15803d] hover:underline"
                        >
                          Add subtask
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...taskLists];
                      const tasks = [
                        ...list.tasks,
                        {
                          title: "New task",
                          subtasks: [{ title: "New task" }],
                        },
                      ];
                      next[li] = { ...list, tasks };
                      updateCategory(category, next);
                    }}
                    className="mt-2 text-xs text-[#15803d] hover:underline"
                  >
                    Add task
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateCategory(category, [...taskLists, emptyTaskList()])
                }
                className="text-sm font-medium text-[#15803d] hover:underline"
              >
                Add milestone group
              </button>
            </div>
          </details>
        );
      })}
    </div>
  );
}
