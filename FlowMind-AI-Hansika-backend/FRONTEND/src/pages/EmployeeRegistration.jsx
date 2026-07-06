import axios from "axios";
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
} from "lucide-react";

import Card from "../components/ui/Card";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function EmployeeRegistration() {

  const [formData, setFormData] = useState({
    employee_name: "",
    employee_email: "",
    phone: "",
    role: "",
    department: "",
    joining_date: "",
    salary: "",
    manager_name: "",
  });
  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};
const handleSubmit = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/v1/employees",
      formData
    );

    alert(response.data.message);

    setFormData({
      employee_name: "",
      employee_email: "",
      phone: "",
      role: "",
      department: "",
      joining_date: "",
      salary: "",
      manager_name: "",
    });
  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
      "Employee registration failed."
    );
  }
};
  return (
    <div className="space-y-6">

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

        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Sparkles size={16} />
          AI Autofill
        </button>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <Card>

          <Card.Header border>
            <Card.Title>Personal Information</Card.Title>
          </Card.Header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Full Name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
              type="text"
              name="employee_name"
              value={formData.employee_name}
              onChange={handleChange}
              placeholder="Enter employee name"
              className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
              <input
                type="email"
                name="employee_email"
                value={formData.employee_email}
                onChange={handleChange}
                placeholder="employee@company.com"
                className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Date of Birth
              </label>

              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Gender
              </label>

              <select className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Address
              </label>

              <input
                type="text"
                placeholder="Employee Address"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

        </Card>
      </motion.div>
            {/* Employment Details */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <Card>

          <Card.Header border>
            <Card.Title>Employment Details</Card.Title>
          </Card.Header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Department
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                 <select
  name="department"
  value={formData.department}
  onChange={handleChange}
  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Select Department</option>
  <option value="Engineering">Engineering</option>
  <option value="Human Resources">Human Resources</option>
  <option value="Finance">Finance</option>
  <option value="Marketing">Marketing</option>
  <option value="Sales">Sales</option>
  <option value="Operations">Operations</option>
  <option value="IT">IT</option>
</select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Role
              </label>

              <div className="relative">
                <Briefcase
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="AI Engineer"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Joining Date
              </label>

              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reporting Manager
              </label>

              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  name="manager_name"
                  value={formData.manager_name}
                  onChange={handleChange}
                  placeholder="Manager Name"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Salary
              </label>

              <div className="relative">
                <IndianRupee
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="800000"
                  className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Employment Type
              </label>

              <select className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Full Time</option>
                <option>Intern</option>
                <option>Contract</option>
              </select>
            </div>

          </div>

        </Card>
      </motion.div>

      {/* Upload Documents */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <Card>

          <Card.Header border>
            <Card.Title>Upload Documents</Card.Title>
          </Card.Header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Resume
              </label>

              <input
                type="file"
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Passport Photo
              </label>

              <input
                type="file"
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                ID Proof
              </label>

              <input
                type="file"
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

          </div>

        </Card>
      </motion.div>

      {/* Buttons */}

      {/* Buttons */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex justify-end"
>
    <button
  type="button"
  onClick={handleSubmit}
  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition shadow-sm"
>
    <UserPlus size={18} />
    Register Employee
  </button>
</motion.div>

    </div>
  );
}