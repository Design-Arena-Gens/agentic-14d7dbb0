# FlowForge Kanban

A modern Kanban board built with Next.js 14. Drag cards between columns, capture task details, and keep everything stored locally in the browser.

## ✨ Features

- Drag-and-drop columns and tasks powered by `@hello-pangea/dnd`
- Persistent local storage so work survives reloads
- Inline column renaming and quick task composer
- Rich task detail drawer with description, due date, and tag management
- Global search that filters by title, description, or tag
- Responsive, glassmorphic UI tuned for desktop and tablet use

## 🚀 Getting Started

### Requirements

- Node.js 18.17 or newer
- npm 9+ (ships with Node) or pnpm/yarn if you prefer

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` to explore the board. Edits hot-reload instantly.

### Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
npm run start
```

## 🧱 Project Structure

```
app/
  components/        // Kanban board components
  globals.css        // Global styles
  layout.tsx         // App shell + fonts
  page.tsx           // Root page renders the board
```

## 📄 License

MIT © 2025 FlowForge Kanban contributors
