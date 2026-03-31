import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#818cf8',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#a78bfa',
  '#38bdf8',
  '#fb923c',
  '#e879f9',
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} mins`
  if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`
  return `${h} hr${h > 1 ? 's' : ''} ${m} mins`
}

export default function Analytics() {
  const [subjects, setSubjects] = useState([])
  const [papers, setPapers] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: subData }, { data: sesData }] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at'),
      supabase
        .from('study_sessions')
        .select('*, subjects(name)')
        .order('created_at', { ascending: true }),
    ])
    const { data: paperData, error: paperErr } = await supabase
      .from('past_papers')
      .select('*, subjects(name), exams(name)')
      .order('completed_at', { ascending: true })
    let finalPapers = paperData
    if (paperErr) {
      const { data: fallback } = await supabase
        .from('past_papers')
        .select('*, subjects(name)')
        .order('completed_at', { ascending: true })
      finalPapers = fallback
    }
    setSubjects(subData || [])
    setPapers(finalPapers || [])
    setSessions(sesData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
        <div className="h-64 bg-gray-800 rounded-xl" />
        <div className="h-64 bg-gray-800 rounded-xl" />
      </div>
    )
  }

  const scoredPapers = papers.filter((p) => {
    if (!p.score) return false
    const num = parseFloat(p.score)
    return !isNaN(num)
  })

  // --- Past Paper Scores Over Time, grouped by exam ---
  const scoresByExam = {}
  scoredPapers.forEach((p) => {
    const examName = p.exams?.name || p.name
    if (!scoresByExam[examName]) scoresByExam[examName] = []
    scoresByExam[examName].push({
      date: p.completed_at || p.created_at?.split('T')[0],
      score: parseFloat(p.score),
      paper: p.name,
    })
  })

  const allDates = [
    ...new Set(scoredPapers.map((p) => p.completed_at || p.created_at?.split('T')[0])),
  ].sort()

  const examNames = Object.keys(scoresByExam)

  const lineData = allDates.map((date) => {
    const point = { date: formatDate(date) }
    examNames.forEach((examName) => {
      const match = scoresByExam[examName].find((s) => s.date === date)
      if (match) point[examName] = match.score
    })
    return point
  })

  function calcEMA(scores, alpha = 2 / (scores.length + 1)) {
    if (scores.length === 0) return 0
    let ema = scores[0]
    for (let i = 1; i < scores.length; i++) {
      ema = alpha * scores[i] + (1 - alpha) * ema
    }
    return Math.round(ema * 10) / 10
  }

  // --- Average Score Per Exam (bar chart) ---
  const avgData = examNames
    .map((examName, i) => {
      const scores = scoresByExam[examName].map((s) => s.score)
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return {
        exam: examName,
        average: Math.round(avg * 10) / 10,
        trend: calcEMA(scores),
        papers: scores.length,
        color: COLORS[i % COLORS.length],
      }
    })
    .sort((a, b) => a.exam.localeCompare(b.exam))

  // --- Study Hours Over Time (line chart, weekly) ---
  const sessionsByWeek = {}
  sessions.forEach((s) => {
    const d = new Date(s.created_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay() + 1)
    const key = weekStart.toISOString().split('T')[0]
    const name = s.subjects?.name || 'Unknown'
    if (!sessionsByWeek[key]) sessionsByWeek[key] = {}
    sessionsByWeek[key][name] =
      (sessionsByWeek[key][name] || 0) + s.duration_minutes
  })

  const weekKeys = Object.keys(sessionsByWeek).sort()
  const allSessionSubjects = [...new Set(sessions.map((s) => s.subjects?.name || 'Unknown'))]
  const weeklyData = weekKeys.map((week) => {
    const point = { week: formatDate(week) }
    allSessionSubjects.forEach((sub) => {
      point[sub] = Math.round(((sessionsByWeek[week][sub] || 0) / 60) * 10) / 10
    })
    return point
  })

  const hasScores = scoredPapers.length > 0
  const hasSessions = sessions.length > 0

  const customTooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#e5e7eb',
    fontSize: '12px',
  }

  const totalMins = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  function getSubjectHours(subId) {
    const total = sessions
      .filter((s) => s.subject_id === subId)
      .reduce((sum, s) => sum + s.duration_minutes, 0)
    return formatDuration(total)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>

      {hasSessions && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-xl p-4">
            <p className="text-xs text-indigo-400 font-medium mb-1">Total Study Time</p>
            <p className="text-lg font-bold text-white">{formatDuration(totalMins)}</p>
          </div>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <p className="text-xs text-gray-400 font-medium mb-1 truncate">
                {sub.name}
              </p>
              <p className="text-lg font-bold text-white">
                {getSubjectHours(sub.id)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!hasScores && !hasSessions && (
        <p className="text-gray-500 text-center py-12">
          No data yet. Log study sessions and past papers with scores to see analytics here.
        </p>
      )}

      {hasScores && (
        <>
          {/* Scores over time */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Past Paper Scores Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [`${value}%`]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                />
                {examNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score summary - table on desktop */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Summary
            </h3>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 text-left" style={{ width: '35%' }}>Exam</th>
                    <th className="pb-3 text-right" style={{ width: '13%' }}>Quantity</th>
                    <th className="pb-3 text-right" style={{ width: '13%' }}>Average (SMA)</th>
                    <th className="pb-3 text-right" style={{ width: '13%' }}>Trend (EMA)</th>
                    <th className="pb-3 text-right" style={{ width: '13%' }}>High</th>
                    <th className="pb-3 text-right" style={{ width: '13%' }}>Low</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {avgData.map((row) => {
                    const scores = scoresByExam[row.exam].map((s) => s.score)
                    const best = Math.max(...scores)
                    const worst = Math.min(...scores)
                    return (
                      <tr key={row.exam} className="border-t border-gray-800">
                        <td className="py-2.5 font-medium text-white truncate text-left">
                          {row.exam}
                        </td>
                        <td className="py-2.5 text-right">{row.papers}</td>
                        <td className="py-2.5 text-right">{row.average}%</td>
                        <td className="py-2.5 text-right text-indigo-400">{row.trend}%</td>
                        <td className="py-2.5 text-right text-emerald-400">{best}%</td>
                        <td className="py-2.5 text-right text-red-400">{worst}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {avgData.map((row) => {
                const scores = scoresByExam[row.exam].map((s) => s.score)
                const best = Math.max(...scores)
                const worst = Math.min(...scores)
                return (
                  <div
                    key={row.exam}
                    className="bg-gray-800/50 rounded-lg px-4 py-3"
                  >
                    <h4 className="text-sm font-medium text-white mb-2">
                      {row.exam}
                    </h4>
                    <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-xs">
                      <div>
                        <span className="text-gray-500 block">Qty</span>
                        <span className="text-gray-300">{row.papers}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">SMA</span>
                        <span className="text-gray-300">{row.average}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">EMA</span>
                        <span className="text-indigo-400">{row.trend}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">High</span>
                        <span className="text-emerald-400">{best}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Low</span>
                        <span className="text-red-400">{worst}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {hasSessions && (
        <>
          {/* Weekly study breakdown */}
          {weeklyData.length > 1 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                Weekly Study Hours
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="week"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value) => [`${value} hrs`]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  />
                  {allSessionSubjects.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
