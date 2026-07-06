import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const data = [
  { name: 'Engineering', value: 42, color: '#2563EB' },
  { name: 'HR', value: 15, color: '#10B981' },
  { name: 'Finance', value: 18, color: '#F59E0B' },
  { name: 'Marketing', value: 12, color: '#8B5CF6' },
  { name: 'Operations', value: 20, color: '#EC4899' },
  { name: 'Sales', value: 14, color: '#06B6D4' },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{payload[0].name}</p>
        <p className="text-sm text-slate-500">{payload[0].value} employees</p>
      </div>
    )
  }
  return null
}

const renderCustomLegend = ({ payload }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
    {payload.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-xs text-slate-600">{entry.value}</span>
      </div>
    ))}
  </div>
)

export default function DeptChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
