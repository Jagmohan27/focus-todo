# Focus — Minimalist Apple-Inspired Task App ✦

A fast, beautifully animated, full-stack To-Do application built with **React**, **Tailwind CSS**, **Framer Motion**, and **Supabase**.

![Focus App Interface](https://img.shields.io/badge/Design-Apple%20SF%20Pro-0071E3?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Tailwind%20%7C%20Supabase-0071E3?style=flat-square)

---

## ✨ Features

- 🍏 **Apple-Inspired Design:** Soft monochrome palette (`#F5F5F7`), stark typography, glassmorphic headers (`backdrop-blur-xl`), and crisp white card containers.
- ⚡ **Fluid Spring Motion:** Apple-like spring physics (`stiffness: 400, damping: 30`) using Framer Motion for smooth mounting, deleting, checking, and tab transitions.
- 🖐️ **Drag & Drop Reordering:** Reorder tasks fluidly with drag-and-drop powered by Framer Motion `Reorder`.
- 📝 **Inline Task Notes:** Expandable note panel per task with auto-save.
- 📅 **Smart Due Dates & Overdue Chips:** Assign due dates with quick shortcuts (*Today*, *Tomorrow*, *Next week*, *Custom picker*). Overdue items highlighted with a red badge.
- 🔐 **Multi-User Auth (Supabase):** Secure user registration & login powered by Supabase Auth with Row Level Security (RLS).
- ☁️ **Cloud Database:** Real-time persistence with Supabase PostgreSQL database.

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS (v4), Lucide Icons
- **Animation:** Framer Motion
- **Backend & DB:** Supabase Auth & PostgreSQL

---

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/focus-todo-app.git
cd focus-todo-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Supabase Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase project credentials (from **Supabase Dashboard ➔ Project Settings ➔ API**):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Database Setup (Supabase SQL Editor)
Run the following SQL snippet in your **Supabase SQL Editor** to create the `todos` table with Row Level Security:

```sql
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  completed boolean default false not null,
  note text default '' not null,
  due_date date,
  created_at timestamptz default now() not null
);

alter table public.todos enable row level security;

create policy "Users manage their own todos"
  on public.todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index todos_user_id_idx on public.todos(user_id);
```

*Note: In your Supabase Dashboard under **Authentication ➔ Providers ➔ Email**, ensure **Confirm Email** is turned OFF for seamless signup.*

### 5. Run the app locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License

MIT License. Free to use and customize!
