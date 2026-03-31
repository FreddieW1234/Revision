import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ExamCountdown() {
  const [exams, setExams] = useState([])
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('')
  const [examDuration, setExamDuration] = useState('')
  const [examNote, setExamNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    setLoading(true)
    const { data } = await supabase
      .from('exams')
      .select('*')
      .order('exam_date')
    setExams(data || [])
    setLoading(false)
  }

  async function addExam(e) {
    e.preventDefault()
    if (!name.trim() || !examDate) return
    const { data, error } = await supabase
      .from('exams')
      .insert({
        name: name.trim(),
        exam_date: examDate,
        exam_time: examTime || null,
        duration_minutes: examDuration ? parseInt(examDuration, 10) : null,
        note: examNote.trim() || null,
      })
      .select()
    if (error) {
      alert(`Failed to add exam: ${error.message}`)
      return
    }
    if (data) {
      setExams((prev) =>
        [...prev, data[0]].sort(
          (a, b) => new Date(a.exam_date) - new Date(b.exam_date)
        )
      )
      setName('')
      setExamDate('')
      setExamTime('')
      setExamDuration('')
      setExamNote('')
    }
  }

  function startEditing(exam) {
    setEditingId(exam.id)
    setEditName(exam.name)
    setEditDate(exam.exam_date)
    setEditTime(exam.exam_time ? exam.exam_time.slice(0, 5) : '')
    setEditDuration(exam.duration_minutes ? String(exam.duration_minutes) : '')
    setEditNote(exam.note || '')
  }

  function cancelEditing() {
    setEditingId(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editName.trim() || !editDate) return
    const { data, error } = await supabase
      .from('exams')
      .update({
        name: editName.trim(),
        exam_date: editDate,
        exam_time: editTime || null,
        duration_minutes: editDuration ? parseInt(editDuration, 10) : null,
        note: editNote.trim() || null,
      })
      .eq('id', editingId)
      .select()
    if (error) {
      alert(`Failed to update exam: ${error.message}`)
      return
    }
    if (data) {
      setExams((prev) =>
        prev
          .map((ex) => (ex.id === editingId ? data[0] : ex))
          .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
      )
      setEditingId(null)
    }
  }

  async function deleteExam(id) {
    await supabase.from('exams').delete().eq('id', id)
    setExams((prev) => prev.filter((e) => e.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function getDaysRemaining(dateStr) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exam = new Date(dateStr)
    exam.setHours(0, 0, 0, 0)
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24))
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  }

  function formatTime(timeStr) {
    if (!timeStr) return null
    return timeStr.slice(0, 5)
  }

  function formatDuration(minutes) {
    if (!minutes) return null
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}hr`
    return `${h}hr ${m}min`
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const inputClass =
    'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Exam Countdown</h2>

      <form
        onSubmit={addExam}
        className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Add an Exam
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Exam name"
            required
            className={inputClass}
          />
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={todayStr}
            required
            className={`${inputClass} [color-scheme:dark]`}
          />
          <input
            type="time"
            value={examTime}
            onChange={(e) => setExamTime(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
          <input
            type="number"
            min="1"
            value={examDuration}
            onChange={(e) => setExamDuration(e.target.value)}
            placeholder="Length in minutes (optional)"
            className={inputClass}
          />
        </div>
        <div className="mt-3">
          <input
            type="text"
            value={examNote}
            onChange={(e) => setExamNote(e.target.value)}
            placeholder="Notes (optional)"
            className={`w-full ${inputClass}`}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || !examDate}
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Add Exam
        </button>
      </form>

      {exams.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No exams added yet. Add one above to start the countdown.
        </p>
      )}

      <div className="space-y-3">
        {exams.map((exam) => {
          const days = getDaysRemaining(exam.exam_date)
          const isPast = days < 0
          const isUrgent = days >= 0 && days <= 14
          const isToday = days === 0

          let borderClass = 'border-gray-800'
          let bgClass = 'bg-gray-900'
          let badgeBg = 'bg-gray-800 text-gray-300'

          if (isPast) {
            borderClass = 'border-gray-800 opacity-50'
            badgeBg = 'bg-gray-800 text-gray-500'
          } else if (isToday) {
            borderClass = 'border-red-500/60'
            bgClass = 'bg-red-950/20'
            badgeBg = 'bg-red-900/60 text-red-300'
          } else if (isUrgent) {
            borderClass = 'border-red-500/40'
            bgClass = 'bg-red-950/10'
            badgeBg = 'bg-red-900/50 text-red-300'
          }

          if (editingId === exam.id) {
            return (
              <form
                key={exam.id}
                onSubmit={saveEdit}
                className="bg-gray-900 border border-indigo-500/50 rounded-xl px-5 py-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Exam name"
                    required
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                  <input
                    type="number"
                    min="1"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="Length in minutes (optional)"
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Notes (optional)"
                  className={`w-full mb-3 ${inputClass}`}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )
          }

          const durationStr = formatDuration(exam.duration_minutes)

          return (
            <div
              key={exam.id}
              className={`${bgClass} border ${borderClass} rounded-xl px-4 sm:px-5 py-4 transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-semibold text-white mb-1 break-words">
                    {exam.name}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {formatDate(exam.exam_date)}
                      {formatTime(exam.exam_time) &&
                        ` at ${formatTime(exam.exam_time)}`}
                    </span>
                    {durationStr && (
                      <span className="text-xs text-indigo-400 font-medium">
                        {durationStr}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap ${badgeBg}`}
                  >
                    {isPast
                      ? 'Passed'
                      : isToday
                        ? 'TODAY'
                        : `${days}d`}
                  </span>
                  <button
                    onClick={() => startEditing(exam)}
                    className="text-gray-600 hover:text-indigo-400 transition-colors cursor-pointer p-1"
                    title="Edit exam"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                    title="Delete exam"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {exam.note && (
                <p className="text-xs text-gray-400 mt-2 leading-relaxed break-words">
                  {exam.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
      <div className="h-36 bg-gray-800 rounded-xl mb-8" />
      <div className="h-20 bg-gray-800 rounded-xl" />
      <div className="h-20 bg-gray-800 rounded-xl" />
    </div>
  )
}
