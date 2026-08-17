# Focus To-Do App

A task management web application built with React, TypeScript, Tailwind CSS, Framer Motion, and Supabase.

## Features

- **Task Management:** Add, complete, filter, and delete tasks.
- **Inline Notes:** Add and edit notes attached to each task.
- **Due Dates:** Assign due dates with quick shortcuts (Today, Tomorrow, Next Week, or custom date) and overdue indicators.
- **Drag-and-Drop Reordering:** Reorder tasks by dragging them into position.
- **User Authentication:** Multi-user support with registration and login powered by Supabase Auth.
- **Database Storage:** Tasks are stored in Supabase PostgreSQL with Row Level Security (RLS) ensuring each user accesses only their own data.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling & Motion:** Tailwind CSS, Framer Motion, Lucide React
- **Backend & Database:** Supabase Auth, PostgreSQL

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Jagmohan27/focus-todo.git
cd focus-todo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Database Setup

Run the following SQL in the Supabase SQL Editor to create the required table and policies:

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

In Supabase Dashboard under **Authentication -> Providers -> Email**, disable **Confirm email** for instant registration.

### 5. Run the Application

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## License

MIT
