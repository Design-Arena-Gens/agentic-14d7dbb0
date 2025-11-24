"use client";

import { useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import clsx from "clsx";
import { Search, Trash2, X } from "lucide-react";

import { useBoardState } from "./useBoardStorage";
import type { BoardState, Task } from "./types";

const randomId = () => crypto.randomUUID();

const columnBackgrounds = [
  "linear-gradient(180deg, rgba(8,145,178,0.25), rgba(15,23,42,0.9))",
  "linear-gradient(180deg, rgba(99,102,241,0.25), rgba(15,23,42,0.9))",
  "linear-gradient(180deg, rgba(236,72,153,0.25), rgba(15,23,42,0.9))",
  "linear-gradient(180deg, rgba(34,197,94,0.25), rgba(15,23,42,0.9))",
];

const getColumnAccent = (index: number) => {
  const accents = ["#22d3ee", "#a855f7", "#f472b6", "#4ade80", "#38bdf8"];
  return accents[index % accents.length];
};

const createTask = (title: string): Task => ({
  id: randomId(),
  title,
  description: "",
  createdAt: new Date().toISOString(),
  tags: [],
});

export default function KanbanBoard() {
  const { board, setBoard, hydrated } = useBoardState();
  const [newColumnName, setNewColumnName] = useState("");
  const [composerColumnId, setComposerColumnId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerDescription, setComposerDescription] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tagEntry, setTagEntry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedTask = selectedTaskId
    ? board.tasks[selectedTaskId] ?? null
    : null;

  const filteredBoard = useMemo(() => {
    if (!searchTerm.trim()) return board;
    const term = searchTerm.toLowerCase();
    const filteredTaskIds = Object.values(board.tasks)
      .filter((task) => {
        const haystack = [
          task.title.toLowerCase(),
          task.description.toLowerCase(),
          task.tags.join(" ").toLowerCase(),
        ].join(" ");
        return haystack.includes(term);
      })
      .map((task) => task.id);

    const filteredColumns: BoardState["columns"] = {};
    board.columnOrder.forEach((columnId) => {
      const column = board.columns[columnId];
      filteredColumns[columnId] = {
        ...column,
        taskIds: column.taskIds.filter((id) => filteredTaskIds.includes(id)),
      };
    });

    return {
      ...board,
      columns: filteredColumns,
    } satisfies BoardState;
  }, [board, searchTerm]);

  if (!hydrated) {
    return (
      <div className="board-shell">
        <header className="board-header">
          <div>
            <h1>FlowForge Kanban</h1>
            <p>Preparing your workspace...</p>
          </div>
        </header>
      </div>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      setBoard((prev) => {
        const newOrder = Array.from(prev.columnOrder);
        newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, draggableId);
        return { ...prev, columnOrder: newOrder };
      });
      return;
    }

    setBoard((prev) => {
      const startColumn = prev.columns[source.droppableId];
      const finishColumn = prev.columns[destination.droppableId];
      if (!startColumn || !finishColumn) return prev;

      if (startColumn === finishColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);
        return {
          ...prev,
          columns: {
            ...prev.columns,
            [startColumn.id]: { ...startColumn, taskIds: newTaskIds },
          },
        };
      }

      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [startColumn.id]: { ...startColumn, taskIds: startTaskIds },
          [finishColumn.id]: { ...finishColumn, taskIds: finishTaskIds },
        },
      };
    });
  };

  const handleAddColumn = () => {
    const title = newColumnName.trim();
    if (!title) return;
    const columnId = randomId();

    setBoard((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: { id: columnId, title, taskIds: [] },
      },
      columnOrder: [...prev.columnOrder, columnId],
    }));
    setNewColumnName("");
  };

  const handleAddTask = (columnId: string) => {
    const title = composerTitle.trim();
    const description = composerDescription.trim();
    if (!title) return;
    const task = {
      ...createTask(title),
      description,
    };

    setBoard((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [task.id]: task,
      },
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          taskIds: [...prev.columns[columnId].taskIds, task.id],
        },
      },
    }));

    setComposerTitle("");
    setComposerDescription("");
    setComposerColumnId(null);
    setSelectedTaskId(task.id);
  };

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;
      const { [taskId]: _removed, ...restTasks } = prev.tasks;
      return {
        columnOrder: prev.columnOrder,
        tasks: restTasks,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            taskIds: column.taskIds.filter((id) => id !== taskId),
          },
        },
      };
    });

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    let clearSelection = false;
    setBoard((prev) => {
      const { [columnId]: removedColumn, ...restColumns } = prev.columns;
      if (!removedColumn) return prev;

      const remainingTasks = { ...prev.tasks };
      removedColumn.taskIds.forEach((taskId) => {
        delete remainingTasks[taskId];
      });

      if (
        selectedTaskId &&
        removedColumn.taskIds.includes(selectedTaskId)
      ) {
        clearSelection = true;
      }

      const newColumnOrder = prev.columnOrder.filter((id) => id !== columnId);
      return {
        tasks: remainingTasks,
        columns: restColumns,
        columnOrder: newColumnOrder,
      };
    });
    if (clearSelection) {
      setSelectedTaskId(null);
    }
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: { ...prev.columns[columnId], title },
      },
    }));
  };

  const commitColumnTitle = (columnId: string) => {
    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;
      const nextTitle = column.title.trim() || "Untitled column";
      if (nextTitle === column.title) return prev;
      return {
        ...prev,
        columns: {
          ...prev.columns,
          [columnId]: { ...column, title: nextTitle },
        },
      };
    });
  };

  const handleTaskFieldChange = (taskId: string, changes: Partial<Task>) => {
    setBoard((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          ...changes,
        },
      },
    }));
  };

  const handleAddTag = () => {
    const tag = tagEntry.trim();
    if (!selectedTask || !tag) return;
    if (selectedTask.tags.includes(tag)) {
      setTagEntry("");
      return;
    }
    handleTaskFieldChange(selectedTask.id, {
      tags: [...selectedTask.tags, tag],
    });
    setTagEntry("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedTask) return;
    handleTaskFieldChange(selectedTask.id, {
      tags: selectedTask.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="board-shell">
          <header className="board-header">
            <div>
              <span className="board-product">FlowForge</span>
              <h1>Kanban Workspace</h1>
          <p>
            Track initiatives, manage priorities, and keep momentum with a board
            tuned for high-performing teams.
          </p>
        </div>
        <div className="board-actions">
          <div className="search-field">
            <input
              placeholder="Filter tasks by title, description, or tag"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Search aria-hidden="true" />
          </div>
          <div className="summary">
            <div>
              <strong>{Object.keys(board.tasks).length}</strong>
              <span>Tasks</span>
            </div>
            <div>
              <strong>{board.columnOrder.length}</strong>
              <span>Columns</span>
            </div>
          </div>
        </div>
      </header>

      <div className="board-controls">
        <div className="add-column">
          <input
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
            placeholder="Add column"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddColumn();
              }
            }}
          />
          <button type="button" onClick={handleAddColumn}>
            + Column
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="board"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <div
              className="column-list"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {filteredBoard.columnOrder.map((columnId, index) => {
                const column = filteredBoard.columns[columnId];
                const originalColumn = board.columns[columnId];
                const tasks = column.taskIds.map((taskId) => board.tasks[taskId]);
                const accent = getColumnAccent(index);
                const background = columnBackgrounds[index % columnBackgrounds.length];

                return (
                  <Draggable key={columnId} draggableId={columnId} index={index}>
                    {(dragProvided) => (
                      <section
                        className="column"
                        style={{
                          ...(dragProvided.draggableProps.style ?? {}),
                          borderTopColor: accent,
                          background,
                        }}
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <header className="column-header" {...dragProvided.dragHandleProps}>
                          <input
                            className="column-title"
                            value={originalColumn.title}
                            onChange={(event) =>
                              handleRenameColumn(columnId, event.target.value)
                            }
                            onBlur={() => commitColumnTitle(columnId)}
                          />
                          <div className="column-meta">
                            <span className="count-chip">{originalColumn.taskIds.length}</span>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => handleDeleteColumn(columnId)}
                              title="Delete column"
                            >
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                        </header>

                        <Droppable droppableId={columnId} type="task">
                          {(columnProvided, snapshot) => (
                            <div
                              className={clsx("task-stack", {
                                "is-dragging-over": snapshot.isDraggingOver,
                              })}
                              ref={columnProvided.innerRef}
                              {...columnProvided.droppableProps}
                            >
                              {tasks.map((task, taskIndex) => (
                                <Draggable
                                  draggableId={task.id}
                                  index={taskIndex}
                                  key={task.id}
                                >
                                  {(taskProvided, taskSnapshot) => (
                                    <article
                                      className={clsx("task-card", {
                                        "is-active": selectedTaskId === task.id,
                                        "is-dragging": taskSnapshot.isDragging,
                                      })}
                                      style={taskProvided.draggableProps.style ?? {}}
                                      ref={taskProvided.innerRef}
                                      {...taskProvided.draggableProps}
                                      {...taskProvided.dragHandleProps}
                                      onClick={() => setSelectedTaskId(task.id)}
                                    >
                                      <h3>{task.title}</h3>
                                      {task.description && (
                                        <p>{task.description.slice(0, 120)}</p>
                                      )}
                                      <footer>
                                        <div className="tag-list">
                                          {task.tags.map((tag) => (
                                            <span key={tag} className="tag-chip">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                        <button
                                          type="button"
                                          className="icon-button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeleteTask(task.id, columnId);
                                          }}
                                          title="Delete task"
                                        >
                                          <X aria-hidden="true" />
                                        </button>
                                      </footer>
                                    </article>
                                  )}
                                </Draggable>
                              ))}
                              {columnProvided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {composerColumnId === columnId ? (
                          <div className="composer">
                            <input
                              placeholder="Task title"
                              value={composerTitle}
                              onChange={(event) => setComposerTitle(event.target.value)}
                            />
                            <textarea
                              placeholder="Description (optional)"
                              value={composerDescription}
                              onChange={(event) =>
                                setComposerDescription(event.target.value)
                              }
                            />
                            <div className="composer-actions">
                              <button
                                type="button"
                                onClick={() => handleAddTask(columnId)}
                              >
                                Create task
                              </button>
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => {
                                  setComposerColumnId(null);
                                  setComposerDescription("");
                                  setComposerTitle("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              setComposerColumnId(columnId);
                              setComposerTitle("");
                              setComposerDescription("");
                            }}
                          >
                            + Add task
                          </button>
                        )}
                      </section>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {selectedTask && (
        <aside className="task-detail">
          <header>
            <input
              className="detail-title"
              value={selectedTask.title}
              onChange={(event) =>
                handleTaskFieldChange(selectedTask.id, {
                  title: event.target.value,
                })
              }
              onBlur={(event) =>
                handleTaskFieldChange(selectedTask.id, {
                  title: event.target.value.trim() || "Untitled task",
                })
              }
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setSelectedTaskId(null)}
              title="Close"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <section>
            <label>
              <span>Description</span>
              <textarea
                value={selectedTask.description}
                placeholder="Capture context, requirements, or notes"
                onChange={(event) =>
                  handleTaskFieldChange(selectedTask.id, {
                    description: event.target.value,
                  })
                }
              />
            </label>

            <label className="inline">
              <span>Due date</span>
              <input
                type="date"
                value={selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : ""}
                onChange={(event) =>
                  handleTaskFieldChange(selectedTask.id, {
                    dueDate: event.target.value
                      ? new Date(event.target.value + "T23:59:59Z").toISOString()
                      : undefined,
                  })
                }
              />
            </label>

            <div className="tags">
              <span>Tags</span>
              <div className="tag-editor">
                <div className="tag-list">
                  {selectedTask.tags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className="tag-chip removable"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X aria-hidden="true" size={14} />
                    </button>
                  ))}
                </div>
                <div className="tag-input">
                  <input
                    value={tagEntry}
                    onChange={(event) => setTagEntry(event.target.value)}
                    placeholder="Add tag"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </section>
          <footer>
            <span>
              Created {new Date(selectedTask.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                const columnId = board.columnOrder.find((colId) =>
                  board.columns[colId].taskIds.includes(selectedTask.id)
                );
                if (!columnId) return;
                handleDeleteTask(selectedTask.id, columnId);
              }}
            >
              Delete task
            </button>
          </footer>
        </aside>
      )}
    </div>
  );
}
