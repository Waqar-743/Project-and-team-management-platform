"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SquaresFour,
  CheckSquare,
  Folder,
  Users,
  SignOut,
  Plus,
  ArrowUpRight,
  ChartLineUp,
  X,
  Bell,
  ChartBar,
  DownloadSimple,
  Timer,
  ChatCircle,
} from "@phosphor-icons/react";
type Data = Record<string, any>;
const STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
];
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function DashboardClient({
  session,
  projects,
  tasks: initialTasks,
  users,
  assignableUsers,
  activities,
  notifications,
  auditCount,
}: {
  session: Data;
  projects: Data[];
  tasks: Data[];
  users: Data[];
  assignableUsers: Data[];
  activities: Data[];
  notifications: Data[];
  auditCount: number;
}) {
  const router = useRouter();
  const [view, setView] = useState("overview");
  const [tasks, setTasks] = useState(initialTasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const done = tasks.filter((t) => t.status === "DONE").length;
  const dueSoon = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date(Date.now() + 7 * 864e5) &&
      t.status !== "DONE",
  ).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE",
  ).length;
  async function move(id: string, status: string) {
    const old = tasks;
    setMessage("");
    setTasks((v) => v.map((t) => (t.id === id ? { ...t, status } : t)));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setTasks(old);
      setMessage((await res.json()).error || "Task could not be moved.");
    } else router.refresh();
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }
  async function toggleNotices() {
    setNoticeOpen((v) => !v);
    if (notifications.some((n) => !n.readAt))
      await fetch("/api/notifications", { method: "PATCH" });
  }
  const nav = [
    ["overview", "Overview", SquaresFour],
    ["projects", "Projects", Folder],
    ["tasks", "Tasks", CheckSquare],
    ["reports", "Reports", ChartBar],
    ...(session.role === "ADMIN" ? [["team", "People", Users]] : []),
  ];
  return (
    <main className="min-h-[100dvh] md:grid md:grid-cols-[240px_1fr] max-w-[1600px] mx-auto">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-[#262821] text-white p-3 z-30"
      >
        Skip to content
      </a>
      <aside className="md:min-h-[100dvh] p-4 md:p-6 flex md:flex-col gap-5 md:gap-10 border-b md:border-r border-[#d9d3c5] overflow-x-auto">
        <div className="font-semibold tracking-[-.04em] text-xl flex items-center gap-2 mr-auto">
          <span className="h-7 w-7 rounded-lg bg-[#262821] text-[#e2a278] grid place-items-center text-xs">
            F
          </span>
          Forge
        </div>
        <nav className="flex md:flex-col gap-1">
          {nav.map(([id, name, Icon]: any) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`whitespace-nowrap flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${view === id ? "bg-[#ded8ca]" : "text-[#77756d] hover:bg-[#e9e4d9]"}`}
            >
              <Icon size={18} weight="light" />
              {name}
            </button>
          ))}
        </nav>
        <div className="hidden md:block mt-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-9 w-9 rounded-[12px] bg-[#d8c3a8] grid place-items-center text-xs font-semibold">
              {session.name
                .split(" ")
                .map((x: string) => x[0])
                .join("")}
            </span>
            <div>
              <p className="text-sm font-medium">{session.name}</p>
              <p className="text-[11px] text-[#77756d]">
                {label(session.role)}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-[#77756d] flex gap-2 items-center hover:text-[#a0442a]"
          >
            <SignOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
      <section
        id="workspace"
        className="p-4 md:p-8 lg:p-12 overflow-hidden relative"
      >
        <button
          aria-label="Notifications"
          onClick={toggleNotices}
          className="absolute right-5 top-5 md:right-10 md:top-9 h-10 w-10 rounded-full bg-[#e6e0d3] grid place-items-center"
        >
          <Bell size={18} />
          {notifications.some((n) => !n.readAt) && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#c66a31]" />
          )}
        </button>
        {noticeOpen && <Notices items={notifications} />}{" "}
        {message && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-[#efe1d6] px-4 py-3 text-sm text-[#934124]"
          >
            {message}
          </p>
        )}
        {view === "overview" && (
          <Overview
            role={session.role}
            projects={projects}
            tasks={tasks}
            activities={activities}
            done={done}
            dueSoon={dueSoon}
            overdue={overdue}
            auditCount={auditCount}
            create={() => setCreateOpen(true)}
            projectsView={() => setView("projects")}
          />
        )}{" "}
        {view === "projects" && (
          <Projects
            projects={projects}
            users={users}
            assignableUsers={assignableUsers}
            role={session.role}
          />
        )}{" "}
        {view === "tasks" && (
          <Board tasks={tasks} move={move} open={setSelected} role={session.role} />
        )}{" "}
        {view === "team" && <Team users={users} />}{" "}
        {view === "reports" && <Reports />}
      </section>
      {createOpen && (
        <TaskModal
          projects={projects}
          close={() => setCreateOpen(false)}
        />
      )}{" "}
      {selected && (
        <TaskDrawer
          id={selected}
          close={() => setSelected(null)}
          refresh={() => router.refresh()}
        />
      )}
    </main>
  );
}

function Heading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <header className="rise pr-12">
      <p className="font-mono text-[11px] tracking-[.16em] text-[#8a8376] mb-3">
        {eyebrow}
      </p>
      <h1 className="text-3xl md:text-5xl tracking-[-.055em] font-semibold text-balance">
        {children}
      </h1>
    </header>
  );
}
function Overview({
  role,
  projects,
  tasks,
  activities,
  done,
  dueSoon,
  overdue,
  auditCount,
  create,
  projectsView,
}: Data) {
  return (
    <>
      <div className="flex justify-between items-end">
        <Heading
          eyebrow={`WORKSPACE / ${new Date().toLocaleDateString("en", { month: "short", day: "2-digit", timeZone: "UTC" }).toUpperCase()}`}
        >
          Good work starts
          <br />
          with a clear view.
        </Heading>
        {role !== "TEAM_MEMBER" && (
          <button
            onClick={create}
            className="group rounded-full bg-[#262821] text-white pl-5 pr-2 py-2 flex items-center gap-5 active:scale-[.98]"
          >
            <span className="hidden sm:inline">New task</span>
            <span className="h-9 w-9 rounded-full bg-[#c66a31] grid place-items-center">
              <Plus size={16} />
            </span>
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-[1.2fr_.4fr_.4fr] gap-4 mt-12">
        <Metric
          title="Completion"
          value={`${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%`}
          detail={`${done} of ${tasks.length} tasks complete`}
          icon={<ChartLineUp />}
        />
        <Metric title="Due soon" value={dueSoon} detail="within seven days" />
        <Metric
          title="Overdue"
          value={overdue}
          detail={
            role === "ADMIN"
              ? `${auditCount} audit events`
              : "requires attention"
          }
        />
      </div>
      <div className="grid lg:grid-cols-[1.4fr_.6fr] gap-8 mt-10">
        <section>
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {role === "TEAM_MEMBER" ? "My assigned projects" : "Active projects"}
            </h2>
            <button onClick={projectsView} className="text-xs text-[#77756d]">
              View all
            </button>
          </div>
          {projects.map((p: Data) => (
            <button
              key={p.id}
              onClick={projectsView}
              className="w-full text-left py-5 grid grid-cols-[1fr_auto] border-t border-[#d9d3c5]"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-[#77756d] mt-1">
                  {p.code} · {p._count.tasks} tasks · {p.members.length} people
                </p>
              </div>
              <b className="font-mono text-sm">{p.progress}%</b>
            </button>
          ))}
        </section>
        <section>
          <h2 className="font-semibold text-lg mb-5">Recent motion</h2>
          {activities.map((a: Data) => (
            <div key={a.id} className="flex gap-3 mb-5">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-[#7d896f]" />
              <div>
                <p className="text-sm">
                  <b>{a.actor.name}</b> {a.action}
                </p>
                <p className="text-[11px] text-[#77756d] mt-1">
            {new Date(a.createdAt).toLocaleDateString("en-GB", {
              timeZone: "UTC",
            })}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
function Metric({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="shell rise">
      <div className="core p-6 min-h-40 flex flex-col">
        <div className="flex justify-between text-sm text-[#77756d]">
          <span>{title}</span>
          {icon}
        </div>
        <p className="text-4xl font-mono tracking-[-.06em] mt-4">{value}</p>
        <p className="text-xs text-[#77756d] mt-auto">{detail}</p>
      </div>
    </div>
  );
}
function Projects({
  projects,
  users,
  assignableUsers,
  role,
}: {
  projects: Data[];
  users: Data[];
  assignableUsers: Data[];
  role: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [staffing, setStaffing] = useState<Data | null>(null);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <div>
      <div className="flex justify-between items-end">
        <Heading eyebrow="PORTFOLIO">Projects in motion.</Heading>
        {role !== "TEAM_MEMBER" && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-[#262821] text-white px-5 py-3 text-sm"
          >
            New project
          </button>
        )}
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mt-12">
        {projects.map((p, i) => (
          <article
            className={`shell ${i % 3 === 0 ? "lg:col-span-2" : ""}`}
            key={p.id}
          >
            <div className="core p-7 min-h-52 flex flex-col">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-[#8a8376]">
                  {p.code}
                </span>
                {role !== "TEAM_MEMBER" ? (
                  <button
                    onClick={() => setStaffing(p)}
                    className="flex items-center gap-1 text-xs text-[#a85227]"
                  >
                    Manage team <ArrowUpRight size={17} />
                  </button>
                ) : (
                  <ArrowUpRight size={20} />
                )}
              </div>
              <h2 className="text-2xl tracking-[-.04em] font-semibold mt-7">
                {p.name}
              </h2>
              <p className="text-sm text-[#77756d] mt-2 max-w-xl">
                {p.description}
              </p>
              <div className="mt-auto pt-7 flex justify-between text-xs">
                <span>
                  {p.manager.name} · {p.members.length} people
                </span>
                <b>{p.progress}%</b>
              </div>
            </div>
          </article>
        ))}
      </div>
      {open && (
        <Modal close={() => setOpen(false)}>
          <h2 className="text-2xl font-semibold">Create a project</h2>
          <form onSubmit={submit} className="space-y-4 mt-7">
            <Field name="name" label="Project name" />
            <Field name="code" label="Project code" />
            <Field name="description" label="Description" />
            {role === "ADMIN" && (
              <Select
                name="managerId"
                label="Project manager"
                items={users
                  .filter(
                    (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN",
                  )
                  .map((u) => [u.id, u.name])}
              />
            )}{" "}
            {role !== "ADMIN" && (
              <input type="hidden" name="managerId" value="self" />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field name="startDate" label="Start date" type="date" />
              <Field name="dueDate" label="Due date" type="date" />
            </div>
            {error && <p className="text-sm text-[#a0442a]">{error}</p>}
            <Submit>Create project</Submit>
          </form>
        </Modal>
      )}
      {staffing && (
        <ProjectTeamModal
          project={staffing}
          candidates={assignableUsers}
          close={() => setStaffing(null)}
          refresh={() => router.refresh()}
        />
      )}
    </div>
  );
}
function ProjectTeamModal({
  project,
  candidates,
  close,
  refresh,
}: {
  project: Data;
  candidates: Data[];
  close: () => void;
  refresh: () => void;
}) {
  const [error, setError] = useState("");
  const memberIds = new Set(project.members.map((m: Data) => m.user.id));
  const available = candidates.filter((user) => !memberIds.has(user.id));
  async function add(form: HTMLFormElement) {
    const userId = new FormData(form).get("userId");
    const response = await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) return setError((await response.json()).error);
    refresh();
    close();
  }
  async function remove(userId: string) {
    const response = await fetch(`/api/projects/${project.id}/members`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) return setError((await response.json()).error);
    refresh();
    close();
  }
  return (
    <Modal close={close}>
      <p className="font-mono text-xs text-[#77756d]">PROJECT TEAM</p>
      <h2 className="text-2xl font-semibold mt-3">Staff {project.name}</h2>
      <p className="text-sm text-[#77756d] mt-3">
        Add an active team member here before assigning them work. This keeps project access and task ownership aligned.
      </p>
      <div className="mt-6 divide-y divide-[#d9d3c5]">
        {project.members.map((member: Data) => (
          <div key={member.user.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium">{member.user.name}</p>
              <p className="text-xs text-[#77756d]">{label(member.user.role)}</p>
            </div>
            {member.user.role === "TEAM_MEMBER" && (
              <button onClick={() => remove(member.user.id)} className="text-xs text-[#a0442a]">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {available.length ? (
        <form
          className="flex gap-2 mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            add(event.currentTarget);
          }}
        >
          <select name="userId" className="min-w-0 flex-1 rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3 text-sm">
            {available.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}{user.title ? ` — ${user.title}` : ""}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-[#262821] px-4 text-sm text-white">Add</button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-[#77756d]">All active team members are already assigned.</p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-[#a0442a]">{error}</p>}
    </Modal>
  );
}

function Board({
  tasks,
  move,
  open,
  role,
}: {
  tasks: Data[];
  move: (id: string, s: string) => void;
  open: (id: string) => void;
  role: string;
}) {
  const permitted = (from: string) => {
    if (role === "ADMIN") return STATUSES;
    if (role === "TEAM_MEMBER")
      return {
        TODO: ["TODO", "IN_PROGRESS", "BLOCKED"],
        IN_PROGRESS: ["IN_PROGRESS", "IN_REVIEW", "BLOCKED"],
        BLOCKED: ["BLOCKED", "IN_PROGRESS"],
        IN_REVIEW: ["IN_REVIEW"],
        BACKLOG: ["BACKLOG"],
        DONE: ["DONE"],
      }[from] || [from];
    return {
      BACKLOG: ["BACKLOG", "TODO", "BLOCKED"],
      TODO: ["TODO", "BACKLOG", "IN_PROGRESS", "BLOCKED"],
      IN_PROGRESS: ["IN_PROGRESS", "TODO", "IN_REVIEW", "BLOCKED"],
      IN_REVIEW: ["IN_REVIEW", "IN_PROGRESS", "DONE", "BLOCKED"],
      BLOCKED: ["BLOCKED", "TODO", "IN_PROGRESS"],
      DONE: ["DONE", "IN_PROGRESS"],
    }[from] || [from];
  };
  return (
    <div>
      <Heading eyebrow="DELIVERY BOARD">Tasks, without the noise.</Heading>
      <p className="text-sm text-[#77756d] mt-4">
        {role === "TEAM_MEMBER"
          ? "Start work, report blockers, then submit it for project-manager review."
          : "Plan work, review submitted tasks, and approve only after review."}
      </p>
      <div className="grid xl:grid-cols-6 gap-3 overflow-x-auto pb-5 mt-8">
        {STATUSES.map((s) => (
          <section
            key={s}
            className="min-w-[220px] rounded-[18px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/task-id");
              const task = tasks.find((item) => item.id === id);
              if (task && permitted(task.status).includes(s)) move(id, s);
            }}
          >
            <div className="flex justify-between text-xs mb-3 px-1">
              <span>{label(s)}</span>
              <span className="font-mono text-[#77756d]">
                {tasks.filter((t) => t.status === s).length}
              </span>
            </div>
            <div className="space-y-3 min-h-32">
              {tasks
                .filter((t) => t.status === s)
                .map((t) => (
                  <article
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/task-id", t.id)
                    }
                    key={t.id}
                    className="bg-[#fbf9f3] rounded-[18px] p-4 shadow-[0_12px_35px_rgba(73,57,35,.05)] cursor-grab active:cursor-grabbing"
                  >
                    <button
                      onClick={() => open(t.id)}
                      className="text-left w-full"
                    >
                      <span
                        className={`text-[10px] uppercase tracking-wider ${t.priority === "URGENT" ? "text-[#a0442a]" : "text-[#77756d]"}`}
                      >
                        {t.priority}
                      </span>
                      <h3 className="text-sm font-medium mt-3 leading-snug">
                        {t.title}
                      </h3>
                      <p className="text-[11px] text-[#77756d] mt-2">
                        {t.project.code} · {t.assignee?.name || "Unassigned"}
                      </p>
                      <p className="text-[10px] text-[#8a8376] mt-2">
                        {t._count?.subtasks || 0} subtasks ·{" "}
                        {t._count?.comments || 0} comments
                      </p>
                    </button>
                    <select
                      aria-label={`Status for ${t.title}`}
                      value={t.status}
                      onChange={(e) => move(t.id, e.target.value)}
                      className="w-full mt-4 bg-[#eee9de] rounded-lg px-2 py-2 text-[11px] outline-none"
                    >
                      {permitted(t.status).map((x) => (
                        <option key={x} value={x}>
                          {label(x)}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              {!tasks.some((t) => t.status === s) && (
                <div className="rounded-[18px] border border-dashed border-[#cfc8b9] p-5 text-xs text-[#8a8376] text-center">
                  Drop tasks here
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
function Team({ users }: { users: Data[] }) {
  const router = useRouter();
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  async function update(id: string, field: string, value: string) {
    const r = await fetch("/api/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    if (!r.ok) setError((await r.json()).error);
    else router.refresh();
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    setCreate(false);
    router.refresh();
  }
  return (
    <div>
      <div className="flex justify-between items-end">
        <Heading eyebrow="ACCESS DIRECTORY">People and permissions.</Heading>
        <button
          onClick={() => setCreate(true)}
          className="rounded-full bg-[#262821] text-white px-5 py-3 text-sm"
        >
          Add user
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-[#a0442a]">
          {error}
        </p>
      )}
      <div className="divide-y divide-[#d9d3c5] mt-12">
        {users.map((u) => (
          <div
            key={u.id}
            className="grid md:grid-cols-[44px_1fr_170px_140px] items-center gap-4 py-5"
          >
            <span className="h-11 w-11 rounded-[14px] bg-[#d8c3a8] grid place-items-center text-xs font-semibold">
              {u.name
                .split(" ")
                .map((x: string) => x[0])
                .join("")}
            </span>
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-[#77756d] mt-1">
                {u.title || "Team member"}
              </p>
            </div>
            <select
              aria-label={`Role for ${u.name}`}
              value={u.role}
              onChange={(e) => update(u.id, "role", e.target.value)}
              className="bg-[#e6e0d3] rounded-lg p-2 text-xs"
            >
              <option value="ADMIN">Administrator</option>
              <option value="PROJECT_MANAGER">Project manager</option>
              <option value="TEAM_MEMBER">Team member</option>
            </select>
            <select
              aria-label={`Status for ${u.name}`}
              value={u.status}
              onChange={(e) => update(u.id, "status", e.target.value)}
              className="bg-[#e6e0d3] rounded-lg p-2 text-xs"
            >
              <option>ACTIVE</option>
              <option>INVITED</option>
              <option>SUSPENDED</option>
            </select>
          </div>
        ))}
      </div>
      {create && (
        <Modal close={() => setCreate(false)}>
          <h2 className="text-2xl font-semibold">Add a user</h2>
          <form onSubmit={add} className="space-y-4 mt-7">
            <Field name="name" label="Full name" />
            <Field name="email" label="Email" type="email" />
            <Field name="password" label="Temporary password" type="password" />
            <Select
              name="role"
              label="Role"
              items={[
                ["TEAM_MEMBER", "Team member"],
                ["PROJECT_MANAGER", "Project manager"],
                ["ADMIN", "Administrator"],
              ]}
            />
            <Field name="title" label="Job title" />
            <Submit>Create account</Submit>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Notices({ items }: { items: Data[] }) {
  return (
    <aside className="absolute right-5 top-16 z-20 w-[min(360px,calc(100%-2.5rem))] rounded-[22px] bg-[#fbf9f3] shadow-[0_24px_70px_rgba(73,57,35,.18)] p-5">
      <h2 className="font-semibold mb-4">Notifications</h2>
      {items.length ? (
        items.map((n) => (
          <div key={n.id} className="py-3 border-t border-[#e2dccf]">
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-[#77756d] mt-1">{n.message}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-[#77756d] py-8 text-center">
          You are all caught up.
        </p>
      )}
    </aside>
  );
}
function Reports() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return (
    <div>
      <Heading eyebrow="OPERATIONS INTELLIGENCE">
        Workload and project health.
      </Heading>
      {!data ? (
        <div className="grid md:grid-cols-2 gap-4 mt-12">
          {[1, 2, 3, 4].map((x) => (
            <div
              key={x}
              className="h-28 rounded-[20px] bg-[#e6e0d3] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex justify-end mt-5">
            <a
              href="/api/reports?format=csv"
              className="flex items-center gap-2 text-sm"
            >
              <DownloadSimple />
              Export CSV
            </a>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <section>
              <h2 className="font-semibold mb-4">Project health</h2>
              {data.health.map((p: Data) => (
                <div
                  key={p.id}
                  className="flex justify-between py-4 border-t border-[#d9d3c5]"
                >
                  <span>{p.name}</span>
                  <b
                    className={
                      p.health === "ON_TRACK"
                        ? "text-[#66755d]"
                        : "text-[#a85227]"
                    }
                  >
                    {label(p.health)}
                  </b>
                </div>
              ))}
            </section>
            <section>
              <h2 className="font-semibold mb-4">Team workload</h2>
              {data.workload.map((u: Data) => (
                <div key={u.id} className="py-4 border-t border-[#d9d3c5]">
                  <div className="flex justify-between">
                    <span>{u.name}</span>
                    <b className="font-mono">{u.active} active</b>
                  </div>
                  <p className="text-xs text-[#77756d] mt-2">
                    {u.overdue} overdue · {Math.round(u.estimatedMinutes / 60)}h
                    estimated · {Math.round(u.actualMinutes / 60)}h logged
                  </p>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function TaskModal({
  projects,
  close,
}: {
  projects: Data[];
  close: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const selectedProject = projects.find((project) => project.id === projectId);
  const assignees = (selectedProject?.members || [])
    .map((member: Data) => member.user)
    .filter((user: Data) => user.role === "TEAM_MEMBER" && user.status === "ACTIVE");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    close();
    router.refresh();
  }
  return (
    <Modal close={close}>
      <h2 className="text-2xl font-semibold">Create a task</h2>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field name="title" label="Task title" />
        <Textarea name="description" label="Task description and acceptance criteria" />
        <label className="block text-sm">
          Project
          <select
            name="projectId"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
            className="mt-2 w-full rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3"
          >
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Assignee
          <select name="assigneeId" className="mt-2 w-full rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3">
            <option value="">Leave unassigned</option>
            {assignees.map((user: Data) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          {!assignees.length && (
            <span className="mt-2 block text-xs text-[#a0442a]">No team members are assigned to this project yet. Use “Manage team” first.</span>
          )}
        </label>
        <Select
          name="priority"
          label="Priority"
          items={["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => [x, label(x)])}
        />
        <Field name="estimate" label="Estimated minutes" type="number" />
        <Field name="dueDate" label="Deadline" type="date" />
        <p className="text-xs text-[#77756d]">
          After creating the task, open it to upload a supporting file or completion proof in the Files section.
        </p>
        {error && <p className="text-sm text-[#a0442a]">{error}</p>}
        <Submit>Create task</Submit>
      </form>
    </Modal>
  );
}
function TaskDrawer({
  id,
  close,
  refresh,
}: {
  id: string;
  close: () => void;
  refresh: () => void;
}) {
  const [task, setTask] = useState<Data | null>(null);
  const [error, setError] = useState("");
  async function reload() {
    setTask(await fetch(`/api/tasks/${id}`).then((x) => x.json()));
  }
  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTask)
      .catch(() => setError("Task details could not be loaded."));
  }, [id]);
  async function post(path: string, form: HTMLFormElement) {
    const body = Object.fromEntries(new FormData(form));
    const r = await fetch(`/api/tasks/${id}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    await reload();
    form.reset();
    refresh();
  }
  async function upload(form: HTMLFormElement) {
    const r = await fetch(`/api/tasks/${id}/attachments`, {
      method: "POST",
      body: new FormData(form),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    await reload();
    form.reset();
  }
  async function toggleSubtask(item: Data) {
    const r = await fetch(`/api/subtasks/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed: !item.completed }),
    });
    if (!r.ok) {
      setError("Checklist item could not be updated.");
      return;
    }
    await reload();
  }
  return (
    <div
      className="fixed inset-0 bg-[#191a17]/55 backdrop-blur-md z-30 flex justify-end"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <aside className="w-full max-w-xl bg-[#f3f0e8] min-h-[100dvh] overflow-y-auto p-6 md:p-9 rise">
        <button onClick={close} className="float-right">
          <X />
        </button>
        {error && (
          <p role="alert" className="text-sm text-[#a0442a] mb-4">
            {error}
          </p>
        )}
        {!task ? (
          <div className="space-y-4 mt-16">
            {[1, 2, 3].map((x) => (
              <div
                key={x}
                className="h-20 rounded-xl bg-[#e4ded1] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <p className="font-mono text-xs text-[#77756d]">
              {task.project.code} / {label(task.status)}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-.04em] mt-4">
              {task.title}
            </h2>
            <p className="text-sm text-[#77756d] mt-4">
              {task.description || "No description added."}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-7">
              <div className="core p-4">
                <p className="text-xs text-[#77756d]">Estimate</p>
                <b className="font-mono">{task.estimate || 0} min</b>
              </div>
              <div className="core p-4">
                <p className="text-xs text-[#77756d]">Logged</p>
                <b className="font-mono">
                  {task.timeEntries.reduce(
                    (a: number, x: Data) => a + x.minutes,
                    0,
                  )}{" "}
                  min
                </b>
              </div>
            </div>
            <section className="mt-9">
              <h3 className="font-semibold">Checklist</h3>
              {task.subtasks.map((s: Data) => (
                <label
                  className="text-sm py-3 border-b border-[#d9d3c5]"
                  key={s.id}
                >
                  <input
                    type="checkbox"
                    checked={s.completed}
                    onChange={() => toggleSubtask(s)}
                    className="mr-3 accent-[#c66a31]"
                  />
                  {s.title}
                </label>
              ))}
              <InlineForm
                button="Add subtask"
                onSubmit={(e) => post("subtasks", e.currentTarget)}
              >
                <Field name="title" label="New checklist item" />
              </InlineForm>
            </section>
            <section className="mt-9">
              <h3 className="font-semibold flex gap-2">
                <ChatCircle />
                Discussion
              </h3>
              {task.comments.map((c: Data) => (
                <div key={c.id} className="py-4 border-b border-[#d9d3c5]">
                  <b className="text-sm">{c.author.name}</b>
                  <p className="text-sm mt-1">{c.body}</p>
                </div>
              ))}
              <InlineForm
                button="Post comment"
                onSubmit={(e) => post("comments", e.currentTarget)}
              >
                <Field name="body" label="Comment" />
              </InlineForm>
            </section>
            <section className="mt-9">
              <h3 className="font-semibold flex gap-2">
                <Timer />
                Log time
              </h3>
              <InlineForm
                button="Save time"
                onSubmit={(e) => post("time", e.currentTarget)}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field name="minutes" label="Minutes" type="number" />
                  <Field name="workDate" label="Work date" type="date" />
                </div>
                <Field name="description" label="Work completed" />
              </InlineForm>
            </section>
            <section className="mt-9">
              <h3 className="font-semibold">Files</h3>
              {task.attachments.map((a: Data) => (
                <a
                  className="block text-sm py-2 text-[#a85227]"
                  href={a.url}
                  key={a.id}
                >
                  {a.name} · {Math.ceil(a.size / 1024)} KB
                </a>
              ))}
              <InlineForm
                button="Upload file"
                onSubmit={(e) => upload(e.currentTarget)}
              >
                <label className="block text-sm">
                  Attachment
                  <input
                    name="file"
                    type="file"
                    required
                    className="block mt-2 text-xs"
                  />
                </label>
              </InlineForm>
            </section>
            {task.dueDate && (
              <section className="mt-9">
                <h3 className="font-semibold">Request more time</h3>
                <InlineForm
                  button="Request extension"
                  onSubmit={(e) => post("deadline", e.currentTarget)}
                >
                  <Field
                    name="requestedDate"
                    label="Requested date"
                    type="date"
                  />
                  <Field name="reason" label="Reason" />
                </InlineForm>
              </section>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-[#191a17]/65 backdrop-blur-md z-30 grid place-items-center p-4"
      onMouseDown={(e) => e.currentTarget === e.target && close()}
    >
      <div className="w-full max-w-lg rounded-[26px] bg-[#f3f0e8] p-7 rise">
        <button onClick={close} className="float-right">
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
function Field({
  name,
  label: fieldLabel,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {fieldLabel}
      <input
        name={name}
        type={type}
        required
        className="mt-2 w-full rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3 outline-none focus:ring-2 focus:ring-[#c66a31]"
      />
    </label>
  );
}
function Textarea({ name, label: fieldLabel }: { name: string; label: string }) {
  return (
    <label className="block text-sm">
      {fieldLabel}
      <textarea
        name={name}
        required
        rows={4}
        className="mt-2 w-full resize-y rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3 outline-none focus:ring-2 focus:ring-[#c66a31]"
      />
    </label>
  );
}
function Select({
  name,
  label: fieldLabel,
  items,
}: {
  name: string;
  label: string;
  items: string[][];
}) {
  return (
    <label className="block text-sm">
      {fieldLabel}
      <select
        name={name}
        required
        className="mt-2 w-full rounded-xl bg-[#fbf9f3] ring-1 ring-[#d9d3c5] p-3"
      >
        {items.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Submit({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-full rounded-full bg-[#262821] text-white py-3 active:scale-[.98]">
      {children}
    </button>
  );
}
function InlineForm({
  children,
  button,
  onSubmit,
}: {
  children: React.ReactNode;
  button: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="space-y-3 mt-4"
    >
      {children}
      <button className="rounded-full bg-[#262821] text-white px-5 py-2 text-sm">
        {button}
      </button>
    </form>
  );
}
