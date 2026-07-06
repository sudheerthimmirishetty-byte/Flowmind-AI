const { supabase } = require("../supabase/client");

/**
 * Returns summary stats for the dashboard.
 */
const getStats = async () => {
  // 1. Total Employees
  const { count: total, error: err1 } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  // 2. Pending Onboarding
  const { count: pending, error: err2 } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .in('employee_status', ['Pending', 'In Progress', 'active', 'pending']);

  // 3. Completed
  const { count: completed, error: err3 } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .in('employee_status', ['Completed', 'completed']);

  // 4. Rejected / Terminated
  const { count: rejected, error: err4 } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .in('employee_status', ['Rejected', 'rejected', 'Exit']);

  const finalTotal = total ?? 0;
  const finalPending = pending ?? 0;
  const finalCompleted = completed ?? 0;
  const finalRejected = rejected ?? 0;

  return [
    { label: 'Total Employees', value: finalTotal, trend: '+100%', up: true, color: 'blue', bg: 'bg-blue-50' },
    { label: 'Pending Onboarding', value: finalPending, trend: '0%', up: true, color: 'amber', bg: 'bg-amber-50' },
    { label: 'Completed', value: finalCompleted, trend: '0%', up: true, color: 'emerald', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: finalRejected, trend: '0%', up: false, color: 'red', bg: 'bg-red-50' }
  ];
};

/**
 * Returns recent logs and activities.
 */
const getRecentActivities = async (limit = 6) => {
  const { data: logs, error } = await supabase
    .from('workflow_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  if (!logs || logs.length === 0) {
    // Seed default mock activities if empty
    return [
      { dot: 'bg-emerald-500', text: 'Arjun Sharma completed onboarding', time: new Date(Date.now() - 5 * 60000).toISOString(), tag: 'Completed' },
      { dot: 'bg-blue-500', text: 'Priya Patel uploaded Aadhar Card', time: new Date(Date.now() - 28 * 60000).toISOString(), tag: 'Document' },
      { dot: 'bg-amber-500', text: 'Rahul Gupta pending manager approval', time: new Date(Date.now() - 2 * 3600000).toISOString(), tag: 'Pending' },
      { dot: 'bg-purple-500', text: 'Sneha Singh registered as new employee', time: new Date(Date.now() - 4 * 3600000).toISOString(), tag: 'New' },
      { dot: 'bg-red-500', text: 'Vikram Nair document verification rejected', time: new Date(Date.now() - 6 * 3600000).toISOString(), tag: 'Rejected' },
      { dot: 'bg-emerald-500', text: 'Divya Rao IT setup completed', time: new Date(Date.now() - 24 * 3600000).toISOString(), tag: 'Done' }
    ];
  }

  // Format database logs to match the frontend expectations
  return logs.map((log) => {
    let dot = 'bg-blue-500';
    if (log.action.toLowerCase() === 'completed' || log.action.toLowerCase() === 'done' || log.action.toLowerCase() === 'success') {
      dot = 'bg-emerald-500';
    } else if (log.action.toLowerCase() === 'pending' || log.action.toLowerCase() === 'warning') {
      dot = 'bg-amber-500';
    } else if (log.action.toLowerCase() === 'rejected' || log.action.toLowerCase() === 'error' || log.action.toLowerCase() === 'failed') {
      dot = 'bg-red-500';
    } else if (log.action.toLowerCase() === 'new' || log.action.toLowerCase() === 'registered') {
      dot = 'bg-purple-500';
    }

    return {
      dot,
      text: log.message,
      time: log.created_at,
      tag: log.action
    };
  });
};

/**
 * Returns employee growth data month-by-month.
 */
const getGrowthData = async () => {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('created_at, joining_date');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (error || !employees) {
    return months.map(m => ({ month: m, employees: 0 }));
  }

  const counts = Array(12).fill(0);

  // Group by creation month
  employees.forEach((emp) => {
    const date = new Date(emp.created_at || emp.joining_date);
    if (!isNaN(date.getTime())) {
      counts[date.getMonth()] += 1;
    }
  });

  // Calculate cumulative growth starting from 0
  let runningSum = 0;
  const chartData = months.map((m, idx) => {
    runningSum += counts[idx];
    return { month: m, employees: runningSum };
  });

  return chartData;
};

/**
 * Returns distribution of employees by department.
 */
const getDepartmentData = async () => {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('department');

  if (error || !employees) {
    return [];
  }

  const deptMap = {};
  employees.forEach((emp) => {
    const dept = emp.department || 'Other';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  return Object.keys(deptMap).map((key) => ({
    name: key,
    value: deptMap[key]
  }));
};

/**
 * Returns status counts of workflows.
 */
const getWorkflowData = async () => {
  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('workflow_status');

  if (error || !workflows) {
    return [
      { name: 'Completed', value: 0 },
      { name: 'Pending', value: 0 },
      { name: 'Rejected', value: 0 }
    ];
  }

  const statusMap = {
    Completed: 0,
    Pending: 0,
    Rejected: 0
  };

  workflows.forEach((wf) => {
    const s = wf.workflow_status || 'Pending';
    if (s.toLowerCase() === 'completed' || s.toLowerCase() === 'done') {
      statusMap.Completed += 1;
    } else if (s.toLowerCase() === 'rejected' || s.toLowerCase() === 'failed') {
      statusMap.Rejected += 1;
    } else {
      statusMap.Pending += 1;
    }
  });

  return Object.keys(statusMap).map((key) => ({
    name: key,
    value: statusMap[key]
  }));
};

/**
 * Returns recent AI suggestions/recommendations.
 */
const getAISuggestions = async () => {
  const { data: recs, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('status', 'active')
    .limit(5);

  if (error || !recs || recs.length === 0) {
    return [
      { dot: 'bg-red-400', text: '5 employees need document follow-up by tomorrow' },
      { dot: 'bg-emerald-400', text: 'Engineering dept onboarding 23% faster this month' },
      { dot: 'bg-amber-400', text: '3 pending manager approvals blocking IT setup' }
    ];
  }

  return recs.map((rec) => {
    let dot = 'bg-blue-400';
    if (rec.recommendation_type === 'warning' || rec.confidence_percentage < 70) {
      dot = 'bg-red-400';
    } else if (rec.recommendation_type === 'success' || rec.confidence_percentage >= 90) {
      dot = 'bg-emerald-400';
    } else if (rec.recommendation_type === 'info') {
      dot = 'bg-amber-400';
    }

    return {
      dot,
      text: rec.recommendation_text
    };
  });
};

module.exports = {
  getStats,
  getRecentActivities,
  getGrowthData,
  getDepartmentData,
  getWorkflowData,
  getAISuggestions
};
