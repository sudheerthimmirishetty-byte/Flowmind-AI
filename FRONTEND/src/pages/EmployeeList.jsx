import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Plus, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Users, Download, X, SlidersHorizontal,
  CheckCircle2, Clock, XCircle, AlertCircle, Mail, Building2, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getInitials, DEPARTMENTS, cn } from "../utils/helpers";
import { employeesAPI } from "../services/api";

/* ──────────────── CONSTANTS ─────────────────────────────────── */
const PAGE_SIZE = 8;
const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Completed", "Rejected"];
const avatarGradients = [
  "from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-purple-500 to-pink-600",
  "from-orange-500 to-rose-600","from-cyan-500 to-blue-600","from-fuchsia-500 to-purple-600",
  "from-rose-500 to-pink-600","from-amber-500 to-orange-600","from-teal-500 to-cyan-600",
];

/* ──────────────── HELPERS ───────────────────────────────────── */
function statusStyle(status) {
  switch (status) {
    case "Completed":   return "bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald";
    case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Pending":     return "bg-amber-50 text-amber-700 border-amber-200";
    case "Rejected":    return "bg-red-50 text-red-700 border-red-200";
    default:            return "bg-slate-50 text-slate-500 border-slate-200";
  }
}
function statusDot(status) {
  switch (status) {
    case "Completed":   return "bg-emerald-500";
    case "In Progress": return "bg-blue-500";
    case "Pending":     return "bg-amber-500";
    case "Rejected":    return "bg-red-500";
    default:            return "bg-slate-400";
  }
}
function StatusBadge({ status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", statusStyle(status))}>
      <span className={cn("w-1.5 h-1.5 rounded-full", statusDot(status))}/>
      {status}
    </span>
  );
}

function MiniProgress({ pct }) {
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-xs text-slate-400 font-medium w-7 text-right">{pct}%</span>
    </div>
  );
}

/* ──────────────── SKELETON ──────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }}/>
        </td>
      ))}
    </tr>
  );
}

/* ──────────────── MODAL: VIEW ───────────────────────────────── */
function ViewModal({ employee, gradIdx, onClose }) {
  if (!employee) return null;
  const grad = avatarGradients[gradIdx % avatarGradients.length];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 font-[Poppins]">Employee Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500"/></button>
        </div>
        <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
          <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-extrabold shadow", grad)}>
            {getInitials(employee.name)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">{employee.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{employee.id}</p>
            <div className="mt-1"><StatusBadge status={employee.status}/></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Department", employee.department, Building2],
            ["Email",      employee.email,      Mail],
            ["Joining",    employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—", Calendar],
            ["Progress",   `${employee.progress}%`, CheckCircle2],
          ].map(([label, val, Icon]) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1"><Icon size={11}/>{label}</div>
              <p className="font-semibold text-slate-700 truncate">{val}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">Close</button>
      </motion.div>
    </div>
  );
}

/* ──────────────── MODAL: EDIT ───────────────────────────────── */
function EditModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState({ name: employee.name, email: employee.email, department: employee.department, status: employee.status });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 font-[Poppins]">Edit Employee</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500"/></button>
        </div>
        <div className="space-y-4">
          {[["Full Name","name","text"],["Email","email","email"]].map(([label,key,type])=>(
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
              <input type={type} value={form[key]} onChange={set(key)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Department</label>
            <select value={form.department} onChange={set("department")}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {(DEPARTMENTS||["Engineering","HR","Finance","Marketing","Operations"]).map((d)=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
            <select value={form.status} onChange={set("status")}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {["Pending","In Progress","Completed","Rejected"].map((s)=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors">Cancel</button>
          <button onClick={()=>onSave({...employee,...form})} className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm transition-colors">Save Changes</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────── MODAL: DELETE ─────────────────────────────── */
function DeleteModal({ employee, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e)=>e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-600"/>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Delete Employee?</h2>
        <p className="text-sm text-slate-500 mb-6">Are you sure you want to remove <strong>{employee?.name}</strong> from the directory? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 text-sm transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────── SORT ICON ─────────────────────────────────── */
function SortIcon({ col, sortKey, dir }) {
  if (sortKey !== col) return <ArrowUpDown size={13} className="text-slate-300"/>;
  return dir === "asc" ? <ArrowUp size={13} className="text-blue-500"/> : <ArrowDown size={13} className="text-blue-500"/>;
}

/* ──────────────── MAIN PAGE ─────────────────────────────────── */
export default function EmployeeList() {
  const navigate = useNavigate();
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [deptFilter, setDeptFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [limit, setLimit]     = useState(PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [viewEmp, setViewEmp] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [toast, setToast]     = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        employee_status: statusFilter === "All" ? undefined : statusFilter,
        department: deptFilter === "All" ? undefined : deptFilter,
        sortBy: sortKey === "name" ? "employee_name" : sortKey === "joiningDate" ? "joining_date" : sortKey === "status" ? "employee_status" : sortKey,
        sortOrder: sortDir,
      };
      const res = await employeesAPI.getAll(params);
      const raw = res.data?.data?.data || [];
      const totalVal = res.data?.data?.total || 0;
      const pagesVal = res.data?.data?.totalPages || 1;
      const limitVal = res.data?.data?.limit || PAGE_SIZE;

      const normalized = Array.isArray(raw) ? raw.map(e => ({
        id: e.id,
        name: e.employee_name,
        email: e.employee_email,
        department: e.department,
        status: e.employee_status,
        progress: e.progress_percentage ?? 0,
        joiningDate: e.joining_date,
        role: e.role,
        salary: e.salary,
        manager_name: e.manager_name,
      })) : [];

      setAllEmployees(normalized);
      setTotal(totalVal);
      setTotalPages(pagesVal);
      setLimit(limitVal);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search, deptFilter, statusFilter, sortKey, sortDir]);

  const departments = useMemo(() => {
    return ["All", ...(DEPARTMENTS || ["Engineering", "HR", "Finance", "Marketing", "Operations"])];
  }, []);

  const filtered = allEmployees;
  const pageData = allEmployees;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await employeesAPI.update(updated.id, {
        employee_name: updated.name,
        employee_email: updated.email,
        department: updated.department,
        employee_status: updated.status,
        role: updated.role,
        salary: updated.salary,
        manager_name: updated.manager_name,
      });
      setAllEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditEmp(null);
      showToast(`${updated.name} updated successfully.`);
    } catch (err) {
      showToast('Update failed: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const handleDelete = async () => {
    const name = deleteEmp.name;
    const id = deleteEmp.id;
    setDeleteEmp(null);
    try {
      await employeesAPI.delete(id);
      setAllEmployees((prev) => prev.filter((e) => e.id !== id));
      showToast(`${name} removed from directory.`, 'error');
    } catch (err) {
      showToast('Delete failed: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const clearFilters = () => { setSearch(""); setDeptFilter("All"); setStatusFilter("All"); setPage(1); };
  const hasFilters = search || deptFilter !== "All" || statusFilter !== "All";

  const exportCSV = () => {
    const header = ["ID","Name","Email","Department","Status","Progress","Joining Date"];
    const rows = filtered.map((e) => [e.id, e.name, e.email, e.department, e.status, e.progress, e.joiningDate]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    console.log("CSV Export:\n", csv);
    showToast("CSV exported to console!", "info");
  };

  const thCls = "px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 whitespace-nowrap select-none";
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
            className={cn("fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2",
              toast.type === "success" ? "bg-emerald-600 text-white" :
              toast.type === "error"   ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            )}>
            <CheckCircle2 size={16}/>{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {viewEmp   && <ViewModal   employee={viewEmp}   gradIdx={allEmployees.indexOf(viewEmp)} onClose={()=>setViewEmp(null)}/>}
        {editEmp   && <EditModal   employee={editEmp}   onClose={()=>setEditEmp(null)} onSave={handleSaveEdit}/>}
        {deleteEmp && <DeleteModal employee={deleteEmp} onClose={()=>setDeleteEmp(null)} onConfirm={handleDelete}/>}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 bg-blue-600 rounded-full"/>
              <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Employee Directory</h1>
            </div>
            <p className="text-slate-500 ml-4">{total} employees in the system</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={15}/> Export CSV
            </button>
            <button onClick={() => navigate("/register-employee")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Plus size={15}/> Add Employee
            </button>
          </div>
        </motion.div>

        {/* ── Filter Bar ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-100 p-4 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by name, ID or email..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"/>
            </div>
            <select value={deptFilter} onChange={(e)=>{setDeptFilter(e.target.value);setPage(1);}}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]">
              {departments.map((d)=><option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value);setPage(1);}}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]">
              {STATUS_OPTIONS.map((s)=><option key={s}>{s}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-red-200 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
                <X size={14}/> Clear
              </button>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
              <SlidersHorizontal size={13}/> {total} result{total !== 1 ? "s" : ""}
            </div>
          </div>
        </motion.div>

        {/* ── Table Card ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className={cn(thCls, "w-10")}>#</th>
                  <th className={thCls} onClick={()=>handleSort("name")}>
                    <span className="flex items-center gap-1.5">Employee <SortIcon col="name" sortKey={sortKey} dir={sortDir}/></span>
                  </th>
                  <th className={thCls} onClick={()=>handleSort("department")}>
                    <span className="flex items-center gap-1.5">Department <SortIcon col="department" sortKey={sortKey} dir={sortDir}/></span>
                  </th>
                  <th className={thCls} onClick={()=>handleSort("joiningDate")}>
                    <span className="flex items-center gap-1.5">Joining Date <SortIcon col="joiningDate" sortKey={sortKey} dir={sortDir}/></span>
                  </th>
                  <th className={thCls} onClick={()=>handleSort("status")}>
                    <span className="flex items-center gap-1.5">Status <SortIcon col="status" sortKey={sortKey} dir={sortDir}/></span>
                  </th>
                  <th className={thCls} onClick={()=>handleSort("progress")}>
                    <span className="flex items-center gap-1.5">Progress <SortIcon col="progress" sortKey={sortKey} dir={sortDir}/></span>
                  </th>
                  <th className={cn(thCls, "text-center")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i}/>)
                  : pageData.length === 0
                  ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <Users size={64} className="text-slate-200 mb-4"/>
                          <h3 className="text-base font-semibold text-slate-400 mb-1">No employees found</h3>
                          <p className="text-sm text-slate-300">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : pageData.map((emp, idx) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + idx;
                    const grad = avatarGradients[globalIdx % avatarGradients.length];
                    return (
                      <motion.tr key={emp.id}
                        initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}
                        className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-4 text-xs text-slate-400 font-medium">{globalIdx + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm", grad)}>
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">{emp.name}</p>
                              <p className="text-xs text-slate-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600 flex items-center gap-1.5">
                            <Building2 size={13} className="text-slate-300"/>{emp.department}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={emp.status}/></td>
                        <td className="px-4 py-4"><MiniProgress pct={emp.progress ?? 0}/></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>setViewEmp(emp)} title="View"
                              className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors">
                              <Eye size={15}/>
                            </button>
                            <button onClick={()=>setEditEmp(emp)} title="Edit"
                              className="p-2 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400 transition-colors">
                              <Pencil size={15}/>
                            </button>
                            <button onClick={()=>setDeleteEmp(emp)} title="Delete"
                              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors">
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{(page-1)*PAGE_SIZE+1}</span>–<span className="font-semibold text-slate-600">{Math.min(page*PAGE_SIZE,total)}</span> of <span className="font-semibold text-slate-600">{total}</span> employees
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14}/> Prev
                </button>
                {[...Array(totalPages)].map((_,i)=>(
                  <button key={i} onClick={()=>setPage(i+1)}
                    className={cn("w-8 h-8 rounded-lg text-xs font-semibold border transition-colors",
                      page===i+1 ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-white"
                    )}>
                    {i+1}
                  </button>
                ))}
                <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
