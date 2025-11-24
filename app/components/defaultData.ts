import type { BoardState } from "./types";

const now = () => new Date().toISOString();

export const createDefaultBoard = (): BoardState => ({
  tasks: {
    "task-inbox-1": {
      id: "task-inbox-1",
      title: "Collect project requirements",
      description: "Schedule kick-off call and gather user stories from stakeholders.",
      createdAt: now(),
      tags: ["discovery"],
    },
    "task-inbox-2": {
      id: "task-inbox-2",
      title: "audit existing workflows",
      description: "Capture current process pain points and blockers.",
      createdAt: now(),
      tags: ["research"],
    },
    "task-progress-1": {
      id: "task-progress-1",
      title: "Design kanban board UI",
      description: "Create layout wireframes and color palette.",
      createdAt: now(),
      tags: ["design", "ui"],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    "task-review-1": {
      id: "task-review-1",
      title: "Conduct usability testing",
      description: "Test drag & drop interactions with 5 users.",
      createdAt: now(),
      tags: ["research", "ux"],
    },
  },
  columns: {
    inbox: {
      id: "inbox",
      title: "Backlog",
      taskIds: ["task-inbox-1", "task-inbox-2"],
    },
    progress: {
      id: "progress",
      title: "In Progress",
      taskIds: ["task-progress-1"],
    },
    review: {
      id: "review",
      title: "Review",
      taskIds: ["task-review-1"],
    },
    done: {
      id: "done",
      title: "Done",
      taskIds: [],
    },
  },
  columnOrder: ["inbox", "progress", "review", "done"],
});
