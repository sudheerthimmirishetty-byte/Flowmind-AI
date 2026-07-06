import { useState, useMemo } from "react";
import {
  CheckCircle2, FileText, Cpu, UserCheck, Monitor,
  BookOpen, ChevronDown, Sparkles, ListTodo,
  Mail, Phone, Building2, User, Shield, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateMockEmployees, getInitials, cn } from "../utils/helpers";

/* ─────────────── TIMELINE DATA ─────────────────────────────── */
const buildTimeline = () => [
  { title: "HR Verification",  status: "completed", description: "Profile verified by Sarah Johnson",  time: "June 28",    icon: CheckCircle2, color: "emerald" },
  { title: "Document Upload",  status: "completed", description: "All 6 documents uploaded",           time: "June 29",    icon: FileText,     color: "emerald" },
  { title: "AI Verification",  status: "active",    description: "Documents being verified by AI",     time: "In progress",icon: Cpu,          color: "blue"    },
  { title: "Manager Approval", status: "pending",   description: "Awaiting department manager",        time: "Upcoming",   icon: UserCheck,    color: "slate"   },
  { title: "IT Setup",         status: "pending",   description: "Laptop and accounts provisioning",   time: "Upcoming",   icon: Monitor,      color: "slate"   },
  { title: "Orientation",      status: "pending",   description: "Company orientation session",         time: "July 15",    icon: BookOpen,     color: "slate"   },
];

const remainingTasks = [
  "Manager approval for offer confirmation",
  "IT to provision laptop and system accounts",
  "Company orientation session on July 15",
  "Badge and access card issuance",
];

const avatarGradients = [
  "from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-purple-500 to-pink-600",
  "from-orange-500 to-rose-600","from-cyan-500 to-blue-600","from-fuchsia-500 to-purple-600",
];

/* ─────────────── SVG PROGRESS CIRCLE ───────────────────────── */
function ProgressCircle({ pct }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (pct / 100) * circumference;
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} strokeWidth="8" className="stroke-slate-100 fill-none"/>
        <motion.circle
          cx="50" cy="50" r={r} strokeWidth="8" fill="none"
          strokeLinecap="round"
          stroke="url(#grad)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB"/>
            <stop offset="100%" stopColor="#10b981"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-800">{pct}%</span>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Done</span>
      </div>
    </div>
  );
}

/* ─────────────── TIMELINE ITEM ─────────────────────────────── */
function TimelineItem({ item, isLast }) {
  const Icon = item.icon;
  const statusColors = {
    completed: { icon: "bg-emerald-100 text-emerald-600", line: "bg-emerald-300", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
    active:    { icon: "bg-blue-100 text-blue-600",       line: "bg-blue-200",    badge: "bg-blue-50 text-blue-600 border-blue-200",           dot: "bg-blue-500"    },
    pending:   { icon: "bg-slate-100 text-slate-400",     line: "bg-slate-200",   badge: "bg-slate-50 text-slate-400 border-slate-200",         dot: "bg-slate-300"   },
  };
  const cfg = statusColors[item.status];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", cfg.icon,
          item.status === "active" && "ring-4 ring-blue-100 animate-pulse"
        )}>
          <Icon size={15}/>
        </div>
        {!isLast && <div className={cn("w-0.5 flex-1 mt-1 min-h-[24px]", cfg.line)}/>}
      </div>
      <div className="pb-5 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("font-semibold text-sm", item.status === "pending" ? "text-slate-400" : "text-slate-800")}>{item.title}</span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.badge)}>
            {item.status === "completed" ? "Done" : item.status === "active" ? "Active" : "Pending"}
          </span>
        </div>
        <p className="text-xs text-slate-500">{item.description}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
      </div>
    </div>
  );
}

/* ─────────────── MAIN PAGE ──────────────────────────────────── */
export default function StatusTracker() {
  const employees = useMemo(() => generateMockEmployees(20), []);
  const [selectedId, setSelectedId] = useState(employees[0]?.id || "");
  const employee = employees.find((e) => e.id === selectedId) || employees[0];

  const gradientIdx = employees.indexOf(employee) % avatarGradients.length;
  const avatarGrad  = avatarGradients[gradientIdx];

  const timeline = buildTimeline();
  const progressPct = employee?.progress ?? 65;

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

  const statusBadge = (status) => {
    if (!status) return null;
    const map = {
      Completed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
      "In Progress":"bg-blue-50 text-blue-700 border-blue-200",
      Pending:     "bg-amber-50 text-amber-700 border-amber-200",
      Rejected:    "bg-red-50 text-red-700 border-red-200",
    };
    const cls = map[status] || "bg-slate-50 text-slate-600 border-slate-200";
    return <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", cls)}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div variants={cardVariants} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-8 bg-blue-600 rounded-full"/>
            <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Status Tracker</h1>
          </div>
          <p className="text-slate-500 ml-4">Monitor individual employee onboarding progress</p>
        </motion.div>

        {/* ── Employee Selector ── */}
        <motion.div variants={cardVariants} className="bg-white rounded-xl border border-slate-100 p-4 mb-6 shadow-sm flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5"><User size={15}/> Select Employee</label>
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} — {emp.id}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={selectedId} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.3}}>

            {/* ── Profile Header Card ── */}
            <motion.div variants={cardVariants} className="bg-white rounded-xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
              <div className="flex items-stretch">
                {/* Left gradient accent */}
                <div className="w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 flex-shrink-0"/>
                <div className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
                    {/* Avatar + Details */}
                    <div className="flex items-center gap-5">
                      <div className={cn("w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-extrabold shadow-md", avatarGrad)}>
                        {getInitials(employee?.name || "UN")}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 font-[Poppins] mb-0.5">{employee?.name}</h2>
                        <p className="text-xs text-slate-400 font-mono mb-2">{employee?.id}</p>
                        <div className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-500"><Building2 size={12}/>{employee?.department}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-500"><Shield size={12}/>{employee?.role || "New Hire"}</span>
                          {employee?.manager && <span className="flex items-center gap-1 text-xs text-slate-500"><User size={12}/>Reports to {employee.manager}</span>}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11}/>{employee?.email}</span>
                          {employee?.phone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11}/>{employee.phone}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Progress circle + badge */}
                    <div className="flex flex-col items-center gap-2">
                      <ProgressCircle pct={progressPct}/>
                      {statusBadge(employee?.status)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Progress Bar Section ── */}
            <motion.div variants={cardVariants} className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Stage</p>
                  <p className="text-base font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                    <Cpu size={16} className="text-blue-600"/> AI Verification
                    <span className="text-xs font-normal bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">In Progress</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Est. Completion</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-1 mt-0.5 justify-end"><Calendar size={13} className="text-slate-400"/> July 10, 2026</p>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${progressPct}%`}} transition={{duration:1,ease:"easeOut"}}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"/>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-400">0%</span>
                <span className="text-xs font-semibold text-blue-600">{progressPct}% Complete</span>
                <span className="text-xs text-slate-400">100%</span>
              </div>
            </motion.div>

            {/* ── Bottom 2-col: Timeline + Right cards ── */}
            <motion.div variants={cardVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Timeline (left 60%) */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm lg:col-span-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Onboarding Timeline</h3>
                <div>
                  {timeline.map((item, idx) => (
                    <TimelineItem key={item.title} item={item} isLast={idx === timeline.length - 1}/>
                  ))}
                </div>
              </div>

              {/* Right column (40%) */}
              <div className="lg:col-span-2 flex flex-col gap-4">

                {/* Remaining Tasks */}
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <ListTodo size={13}/> Remaining Tasks
                  </h3>
                  <ul className="space-y-2.5">
                    {remainingTasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <span className="text-[9px] text-slate-400 font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm text-slate-600 leading-snug">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Remarks */}
                <div className="rounded-xl border border-indigo-200 p-5 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles size={13}/> AI Remarks
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Documents appear authentic. One minor discrepancy found in degree certificate date.
                    Awaiting manual review. <span className="font-semibold text-indigo-600">Estimated clearance: 2 hours.</span>
                  </p>
                  <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Cpu size={12} className="text-white"/>
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold">AI Engine v2.4 · Just now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
