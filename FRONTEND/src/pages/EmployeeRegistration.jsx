import { motion } from "framer-motion";
import { useState } from 'react'
import {
  UserPlus,
  Sparkles,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  IndianRupee,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeesAPI, aiAPI } from "../services/api";
import Card from "../components/ui/Card";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const INITIAL_FORM = {
  employee_name: '',
  employee_email: '',
  phone: '',
  role: '',
  department: 'Engineering',
  joining_date: '',
  salary: '',
  manager_name: '',
  employee_status: 'Pending',
};

const mapDepartment = (dept) => {
  if (!dept) return "Engineering";
  const lower = dept.toLowerCase().trim();
  if (lower.includes("eng")) return "Engineering";
  if (lower.includes("hr") || lower.includes("human")) return "HR";
  if (lower.includes("fin")) return "Finance";
  if (lower.includes("it")) return "IT";
  if (lower.includes("mark")) return "Marketing";
  if (lower.includes("oper")) return "Operations";
  if (lower.includes("sale")) return "Sales";
  if (lower.includes("admin") || lower.includes("admi")) return "Admin";
  return "Engineering";
};

const parseJoiningDate = (dateStr) => {
  if (!dateStr) return "";
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  const lower = dateStr.toLowerCase();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let foundMonth = -1;
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) {
      foundMonth = i;
      break;
    }
  }
  const dayMatch = lower.match(/\b\d{1,2}\b/);
  const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
  const yearMatch = lower.match(/\b\d{4}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
  
  if (foundMonth !== -1) {
    const date = new Date(year, foundMonth, day);
    return date.toISOString().split('T')[0];
  }
  return "";
};

const parseSalary = (salaryStr) => {
  if (!salaryStr) return "";
  const clean = salaryStr.replace(/[^\d.kKmLlpaA]/g, "");
  let num = parseFloat(clean);
  if (isNaN(num)) return "";
  const lower = clean.toLowerCase();
  if (lower.includes("l")) {
    num = num * 100000;
  } else if (lower.includes("m")) {
    num = num * 1000000;
  } else if (lower.includes("k")) {
    num = num * 1000;
  }
  return String(Math.round(num));
};

export default function EmployeeRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [aiCommand, setAiCommand] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    if (!form.employee_name.trim()) errors.employee_name = 'Full name is required'
    if (!form.employee_email.trim()) errors.employee_email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.employee_email)) errors.employee_email = 'Invalid email format'
    if (!form.role.trim()) errors.role = 'Role is required'
    if (!form.department) errors.department = 'Department is required'
    if (!form.joining_date) errors.joining_date = 'Joining date is required'
    if (!form.salary || isNaN(form.salary) || Number(form.salary) <= 0) errors.salary = 'Valid salary is required'
    return errors
  }

  const handleAIAutofill = async () => {
    if (!aiCommand.trim()) {
      setError("Please enter a natural language command in the AI Command box first.");
      return;
    }
    
    setAiLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      const res = await aiAPI.parseCommand(aiCommand.trim());
      const payload = res.data?.data;
      if (!res.data?.success || !payload?.success) {
        throw new Error(payload?.error?.message || "Failed to extract information from the command.");
      }
      
      const ext = payload.informationExtraction?.extractedInformation;
      if (!ext) {
        throw new Error("No structured information could be extracted.");
      }

      let email = ext.email;
      if (!email && ext.employeeName) {
        const first = ext.employeeName.trim().split(/\s+/)[0].toLowerCase();
        email = `${first}@company.com`;
      }

      const parsedForm = {
        employee_name: ext.employeeName || "",
        employee_email: email || "",
        phone: ext.phone || "",
        role: ext.role || "",
        department: mapDepartment(ext.department),
        joining_date: parseJoiningDate(ext.joiningDate),
        salary: parseSalary(ext.salary),
        manager_name: ext.reportingManager || "",
        employee_status: "Pending",
      };

      setForm(parsedForm);
      setSuccess("AI Autofill completed successfully! Please review the details below.");
    } catch (err) {
      console.error("AI Autofill error:", err);
      const msg = err?.response?.data?.message || err.message || "AI Autofill failed. Please check the command and try again.";
      setError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
      }
      const res = await employeesAPI.create(payload)
      const created = res.data?.data

      setSuccess(`Employee "${created?.employee_name || form.employee_name}" registered successfully! Workflow initiated.`)
      setForm(INITIAL_FORM)
      setFieldErrors({})

      setTimeout(() => navigate('/employees'), 2000)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to register employee. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`

  const inputClassNoIcon = (field) =>
    `w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-blue-600" size={28} />
            Register Employee
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create a new employee profile and begin the AI onboarding workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAIAutofill}
          disabled={aiLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-65 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              AI Autofill
            </>
          )}
        </button>
      </motion.div>

      {/* AI Command Section */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <Card.Header border>
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={18} />
              <Card.Title>✨ AI Command</Card.Title>
            </div>
          </Card.Header>
          <div className="p-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Enter Onboarding Command
            </label>
            <textarea
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              placeholder="Example:&#10;Hire Riya as AI Engineer under Sudheer.&#10;Joining Date: 15 July.&#10;Salary: 12 LPA."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 font-[Inter] resize-none"
            />
          </div>
        </Card>
      </motion.div>

      {/* Success Alert */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4"
        >
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{success}</p>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4"
        >
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Personal Information */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <Card.Header border>
            <Card.Title>Personal Information</Card.Title>
          </Card.Header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="employee_name"
                  value={form.employee_name}
                  onChange={handleChange}
                  placeholder="Enter employee name"
                  className={inputClass('employee_name')}
                />
              </div>
              {fieldErrors.employee_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.employee_name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="email"
                  name="employee_email"
                  value={form.employee_email}
                  onChange={handleChange}
                  placeholder="employee@company.com"
                  className={inputClass('employee_email')}
                />
              </div>
              {fieldErrors.employee_email && <p className="text-red-500 text-xs mt-1">{fieldErrors.employee_email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className={inputClass('phone')}
                />
              </div>
            </div>

          </div>
        </Card>
      </motion.div>

      {/* Employment Details */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <Card.Header border>
            <Card.Title>Employment Details</Card.Title>
          </Card.Header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={inputClass('department')}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Admin">Administration</option>
                </select>
              </div>
              {fieldErrors.department && <p className="text-red-500 text-xs mt-1">{fieldErrors.department}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Role / Position <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  className={inputClass('role')}
                />
              </div>
              {fieldErrors.role && <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Joining Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="date"
                  name="joining_date"
                  value={form.joining_date}
                  onChange={handleChange}
                  className={inputClass('joining_date')}
                />
              </div>
              {fieldErrors.joining_date && <p className="text-red-500 text-xs mt-1">{fieldErrors.joining_date}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Reporting Manager</label>
              <div className="relative">
                <Users size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="manager_name"
                  value={form.manager_name}
                  onChange={handleChange}
                  placeholder="Manager Name"
                  className={inputClass('manager_name')}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Salary (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="number"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="1200000"
                  min="0"
                  className={inputClass('salary')}
                />
              </div>
              {fieldErrors.salary && <p className="text-red-500 text-xs mt-1">{fieldErrors.salary}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Initial Status</label>
              <select
                name="employee_status"
                value={form.employee_status}
                onChange={handleChange}
                className={inputClassNoIcon('employee_status')}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

          </div>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end gap-3"
      >
        <button
          type="button"
          onClick={() => { setForm(INITIAL_FORM); setFieldErrors({}); setError(null); }}
          className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Register Employee
            </>
          )}
        </button>
      </motion.div>

    </form>
  );
}