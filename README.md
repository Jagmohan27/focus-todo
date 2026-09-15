# Focus - Minimalist Task Management Web App

An offline-first task management web app built with React, Vite, Framer Motion, Tailwind CSS, and LocalStorage.

## 🚀 Key Features

- **Task Scheduling & Custom Time Selector:** Interactive time picker popover with quick presets (*Morning 9 AM, Afternoon 1 PM, Evening 6 PM, Night 9 PM*), 5-minute step selectors, 12-hour/24-hour options, and direct exact time input.
- **Drag-and-Drop Reordering:** Fluid task reordering using Framer Motion physics.
- **Due Dates & Time Badges:** Smart date shortcuts (*Today, Tomorrow, Next Week*) with color-coded overdue and upcoming status badges.
- **Inline Task Editing & Notes:** Double-click inline task editing and expandable task notes saved instantly.
- **Priority & Tag Classification:** Organize tasks with high/medium/low priority indicators and visual tags (*Work, Personal, Idea, Urgent*).
- **Instant Search & Filters:** Filter tasks by active status, due date, or priority with real-time text search.
- **Offline-First Storage:** 100% client-side data persistence via LocalStorage with zero-latency state synchronization.

## ⚡ Tech Stack & Performance

- **Core:** React 18, ES6+ JavaScript, Vite
- **Performance:** Optimized build pipeline with **<350ms** build execution
- **Styling & Motion:** Tailwind CSS, Framer Motion, Lucide React
- **Persistence:** Offline-first LocalStorage & optional Supabase sync

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Jagmohan27/focus-todo.git
cd focus-todo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📄 License

MIT
