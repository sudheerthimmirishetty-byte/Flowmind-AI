import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const data = [
  { stage: 'HR Check', completed: 45, pending: 12, rejected: 3 },
  { stage: 'Docs', completed: 38, pending: 18, rejected: 4 },
  { stage: 'AI Verify', completed: 35, pending: 20, rejected: 5 },
  { stage: 'Manager', completed: 30, pending: 22, rejected: 8 },
  { stage: 'IT Setup', completed: 28, pending: 25, rejected: 4 },
  { stage: 'Orient.', completed: 25, pending: 28, rejected: 2 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-slate-600 capitalize">{entry.name}: </span>
            <span className="font-medium text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function WorkflowChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={8} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
