import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'

const data = [
  { month: 'Jan', employees: 48 },
  { month: 'Feb', employees: 62 },
  { month: 'Mar', employees: 71 },
  { month: 'Apr', employees: 85 },
  { month: 'May', employees: 94 },
  { month: 'Jun', employees: 108 },
  { month: 'Jul', employees: 120 },
  { month: 'Aug', employees: 135 },
  { month: 'Sep', employees: 148 },
  { month: 'Oct', employees: 162 },
  { month: 'Nov', employees: 174 },
  { month: 'Dec', employees: 189 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">{payload[0].value} Employees</p>
      </div>
    )
  }
  return null
}

export default function GrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="employees"
          stroke="#2563EB"
          strokeWidth={2.5}
          fill="url(#growthGrad)"
          dot={{ fill: '#2563EB', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
