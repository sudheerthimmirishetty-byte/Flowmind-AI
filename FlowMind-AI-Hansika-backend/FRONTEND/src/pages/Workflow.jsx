import { useState } from "react";
import {
  UserCheck, FileText, Cpu, Monitor, BookOpen,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Sparkles, MessageSquare, ThumbsUp, ThumbsDown,
  PlusCircle, Calendar, User, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/helpers";

const steps = [
  {
    id: 1, label: "HR Verification", icon: UserCheck, status: "completed",
    desc: "Initial profile and eligibility check",
    completedBy: "Sarah Johnson", completedAt: "2026-06-28",
    remarks: "All documents look good. Proceeding to next stage.",
  },
  {
    id: 2, label: "Document Upload", icon: FileText, status: "completed",
    desc: "Employee uploads required documents",
    completedAt: "2026-06-29",
    remarks: "Aadhar, PAN, Degree uploaded successfully.",
  },
  {
    id: 3, label: "AI Verification", icon: Cpu, status: "active",
    desc: "AI validates document authenticity",
    remarks: "Processing... Estimated completion: 2 hours",
  },
  { id: 4, label: "Manager Approval", icon: UserCheck, status: "pending", desc: "Department manager reviews and approves" },
  { id: 5, label: "IT Setup", icon: Monitor, status: "pending", desc: "Laptop, accounts, and tools provisioned" },
  { id: 6, label: "Orientation", icon: BookOpen, status: "pending", desc: "Company culture and policy orientation" },
  { id: 7, label: "Completed", icon: CheckCircle2, status: "pending", desc: "Onboarding process finalized" },
];

const statusConfig = {
  completed: { circle: "bg-emerald-500", ring: "", text: "text-emerald-600", label: "Completed", connector: "bg-emerald-400", panelFrom: "from-emerald-50", border: "border-emerald-100", iconBg: "bg-emerald-100" },
  active:    { circle: "bg-blue-500",    ring: "ring-4 ring-blue-200 animate-pulse", text: "text-blue-600",    label: "In Progress", connector: "bg-slate-200",   panelFrom: "from-blue-50",    border: "border-blue-100",    iconBg: "bg-blue-100"    },
  pending:   { circle: "bg-slate-200",   ring: "", text: "text-slate-400",   label: "Pending",      connector: "bg-slate-200",   panelFrom: "from-slate-50",   border: "border-slate-100",   iconBg: "bg-slate-100"   },
  rejected:  { circle: "bg-red-500",     ring: "", text: "text-red-600",     label: "Rejected",     connector: "bg-slate-200",   panelFrom: "from-red-50",     border: "border-red-100",     iconBg: "bg-red-100"     },
};

const estimatedDates = { 4: "July 5, 2026", 5: "July 8, 2026", 6: "July 12, 2026", 7: "July 15, 2026" };

function StepItem({ step, isSelected, isLast, onClick }) {
  const cfg = statusConfig[step.status];
  const Icon = step.icon;
  return (
    <div className="flex gap-3 cursor-pointer group" onClick={() => onClick(step.id)}>
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200", cfg.circle, cfg.ring, isSelected && "ring-4 ring-offset-2 ring-blue-300")}
        >
          <Icon size={18} className="text-white" />
        </motion.div>
        {!isLast && <div className={cn("w-0.5 flex-1 mt-1 min-h-[28px]", cfg.connector)} />}
      </div>
      <div className={cn("flex-1 pb-5 rounded-xl px-3 py-2 transition-all duration-150", isSelected ? "bg-blue-50 border border-blue-100" : "group-hover:bg-slate-50")}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm font-semibold", step.status === "pending" ? "text-slate-400" : "text-slate-800")}>{step.label}</span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            step.status === "completed" && "bg-emerald-50 text-emerald-600 border-emerald-200",
            step.status === "active"    && "bg-blue-50 text-blue-600 border-blue-200",
            step.status === "pending"   && "bg-slate-50 text-slate-400 border-slate-200",
            step.status === "rejected"  && "bg-red-50 text-red-600 border-red-200"
          )}>{cfg.label}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

function DetailPanel({ step, onApprove, onReject, onAddNote }) {
  const cfg = statusConfig[step.status];
  const Icon = step.icon;
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        {/* Header */}
        <div className={cn("rounded-xl border bg-gradient-to-br to-white p-6 mb-4", cfg.panelFrom, cfg.border)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", cfg.iconBg)}>
                <Icon size={28} className={cfg.text} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900 font-[Poppins]">{step.label}</h2>
                  <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                    step.status === "completed" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    step.status === "active"    && "bg-blue-50 text-blue-700 border-blue-200",
                    step.status === "pending"   && "bg-slate-100 text-slate-500 border-slate-200",
                    step.status === "rejected"  && "bg-red-50 text-red-700 border-red-200"
                  )}>{cfg.label}</span>
                </div>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 mt-1">Step {step.id} of {steps.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Completion info */}
          {(step.completedBy || step.completedAt) && (
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Info size={13}/> Completion Info</h3>
              <div className="flex flex-wrap gap-6">
                {step.completedBy && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><User size={15} className="text-emerald-600"/></div>
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wide">Completed By</p><p className="text-sm font-semibold text-slate-700">{step.completedBy}</p></div>
                  </div>
                )}
                {step.completedAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Calendar size={15} className="text-blue-600"/></div>
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wide">Date</p><p className="text-sm font-semibold text-slate-700">{new Date(step.completedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated start for pending */}
          {step.status === "pending" && estimatedDates[step.id] && (
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock size={13}/> Estimated Start</h3>
              <p className="text-sm font-semibold text-slate-700">{estimatedDates[step.id]}</p>
            </div>
          )}

          {/* Remarks */}
          {step.remarks && (
            <div className={cn("rounded-xl border p-4 shadow-sm",
              step.status === "active"    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100" :
              step.status === "completed" ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100" :
              "bg-white border-slate-100"
            )}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {step.status === "active" ? <Sparkles size={13} className="text-blue-500"/> : <MessageSquare size={13}/>}
                {step.status === "active" ? "AI Remarks" : "Remarks / Notes"}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.remarks}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {step.status === "active" && (
                <>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={onApprove} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"><ThumbsUp size={15}/> Approve</motion.button>
                  <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={onReject}  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"><ThumbsDown size={15}/> Reject</motion.button>
                </>
              )}
              {step.status === "pending" && (
                <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={onApprove} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"><ThumbsUp size={15}/> Mark as Active</motion.button>
              )}
              {step.status === "completed" && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 size={16}/> This step is complete</span>
              )}
              {step.status === "rejected" && (
                <span className="flex items-center gap-1.5 text-sm text-red-600 font-semibold"><AlertCircle size={16}/> This step was rejected</span>
              )}
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={onAddNote} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"><PlusCircle size={15}/> Add Note</motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Workflow() {
  const [selectedId, setSelectedId] = useState(3);
  const [stepsState, setStepsState] = useState(steps);
  const [notification, setNotification] = useState(null);

  const selectedStep = stepsState.find((s) => s.id === selectedId);
  const completedCount = stepsState.filter((s) => s.status === "completed").length;
  const progressPct = Math.round((completedCount / stepsState.length) * 100);

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprove = () => {
    setStepsState((prev) =>
      prev.map((s) => {
        if (s.id === selectedId) return { ...s, status: "completed", completedAt: new Date().toISOString().split("T")[0], completedBy: "Admin" };
        if (s.id === selectedId + 1 && s.status === "pending") return { ...s, status: "active" };
        return s;
      })
    );
    showToast(`"${selectedStep.label}" approved successfully!`, "success");
  };

  const handleReject = () => {
    setStepsState((prev) => prev.map((s) => s.id === selectedId ? { ...s, status: "rejected", remarks: "Rejected by admin." } : s));
    showToast(`"${selectedStep.label}" has been rejected.`, "error");
  };

  const handleAddNote = () => showToast("Note feature coming soon.", "info");

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AnimatePresence>
        {notification && (
          <motion.div initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
            className={cn("fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2",
              notification.type === "success" && "bg-emerald-600 text-white",
              notification.type === "error"   && "bg-red-600 text-white",
              notification.type === "info"    && "bg-blue-600 text-white"
            )}>
            <CheckCircle2 size={16}/> {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-8 bg-blue-600 rounded-full"/>
            <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Onboarding Workflow</h1>
          </div>
          <p className="text-slate-500 ml-4">Manage employee onboarding stages</p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${progressPct}%`}} transition={{duration:0.9,ease:"easeOut"}}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"/>
          </div>
          <div className="flex justify-between mt-2.5">
            {stepsState.map((s) => (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                className={cn("w-2 h-2 rounded-full transition-all",
                  s.status === "completed" ? "bg-emerald-500" : s.status === "active" ? "bg-blue-500" : "bg-slate-200",
                  s.id === selectedId && "scale-125 ring-2 ring-offset-1 ring-blue-400"
                )}/>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{completedCount} of {stepsState.length} steps completed</p>
        </motion.div>

        {/* Main Layout */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stepper */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm lg:col-span-1 h-fit">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Workflow Steps</h2>
            <div>
              {stepsState.map((step, idx) => (
                <StepItem key={step.id} step={step} isSelected={step.id === selectedId} isLast={idx === stepsState.length - 1} onClick={setSelectedId}/>
              ))}
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2">
            {selectedStep && (
              <DetailPanel step={selectedStep} onApprove={handleApprove} onReject={handleReject} onAddNote={handleAddNote}/>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
