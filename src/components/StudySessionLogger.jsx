import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const VALID_MINS = [0, 15, 30, 45]

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} mins`
  if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`
  return `${h} hr${h > 1 ? 's' : ''} ${m} mins`
}

function DurationInput({ hours, mins, onHoursChange, onMinsChange, error, size = 'normal' }) {
  const py = size === 'small' ? 'py-2' : 'py-2.5'
  const base = `bg-gray-800 border rounded-lg px-3 ${py} text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`
  const borderColor = error ? 'border-red-500/60' : 'border-gray-700'

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="23"
          value={hours}
          onChange={(e) => onHoursChange(e.target.value)}
          placeholder="0"
          className={`w-16 ${base} ${borderColor}`}
        />
        <span className="text-sm text-gray-400 shrink-0">hrs</span>
        <input
          type="number"
          min="0"
          max="45"
          step="15"
          value={mins}
          onChange={(e) => onMinsChange(e.target.value)}
          placeholder="0"
          className={`w-16 ${base} ${borderColor}`}
        />
        <span className="text-sm text-gray-400 shrink-0">mins</span>
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

function validateMins(mins) {
  if (mins === '' || mins === undefined) return null
  const val = parseInt(mins, 10)
  if (isNaN(val)) return 'Must be a number'
  if (!VALID_MINS.includes(val)) return 'Minutes must be 0, 15, 30, or 45'
  return null
}

function getTotalMinutes(hours, mins) {
  const h = parseInt(hours, 10) || 0
  const m = parseInt(mins, 10) || 0
  return h * 60 + m
}

export default function StudySessionLogger() {
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [hours, setHours] = useState('')
  const [mins, setMins] = useState('')
  const [minsError, setMinsError] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editSubjectId, setEditSubjectId] = useState('')
  const [editHours, setEditHours] = useState('')
  const [editMins, setEditMins] = useState('')
  const [editMinsError, setEditMinsError] = useState(null)
  const [editNote, setEditNote] = useState('')

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
        .order('created_at', { ascending: false }),
    ])
    setSubjects(subData || [])
    setSessions(sesData || [])
    
    setLoading(false)
  }

  function handleMinsChange(val) {
    setMins(val)
    setMinsError(validateMins(val))
  }

  function handleEditMinsChange(val) {
    setEditMins(val)
    setEditMinsError(validateMins(val))
  }

  async function logSession(e) {
    e.preventDefault()
    const err = validateMins(mins)
    if (err) { setMinsError(err); return }
    const total = getTotalMinutes(hours, mins)
    if (!subjectId || total <= 0) return
    const { data } = await supabase
      .from('study_sessions')
      .insert({
        subject_id: subjectId,
        duration_minutes: total,
        note: note.trim() || null,
      })
      .select('*, subjects(name)')
    if (data) {
      setSessions((prev) => [data[0], ...prev])
      setHours('')
      setMins('')
      setMinsError(null)
      setNote('')
    }
  }

  function startEditing(session) {
    const h = Math.floor(session.duration_minutes / 60)
    const m = session.duration_minutes % 60
    setEditingId(session.id)
    setEditSubjectId(session.subject_id)
    setEditHours(h > 0 ? String(h) : '')
    setEditMins(m > 0 ? String(m) : '')
    setEditMinsError(null)
    setEditNote(session.note || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditMinsError(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    const err = validateMins(editMins)
    if (err) { setEditMinsError(err); return }
    const total = getTotalMinutes(editHours, editMins)
    if (!editSubjectId || total <= 0) return
    const { data } = await supabase
      .from('study_sessions')
      .update({
        subject_id: editSubjectId,
        duration_minutes: total,
        note: editNote.trim() || null,
      })
      .eq('id', editingId)
      .select('*, subjects(name)')
    if (data) {
      setSessions((prev) =>
        prev.map((s) => (s.id === editingId ? data[0] : s))
      )
      setEditingId(null)
      setEditMinsError(null)
    }
  }

  async function deleteSession(id) {
    await supabase.from('study_sessions').delete().eq('id', id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function getTotalHours(subId) {
    const total = sessions
      .filter((s) => s.subject_id === subId)
      .reduce((sum, s) => sum + s.duration_minutes, 0)
    return formatDuration(total)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  const totalMins = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalFormatted = formatDuration(totalMins)
  const canSubmit = subjectId && getTotalMinutes(hours, mins) > 0 && !minsError

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Study Sessions</h2>

      {/* Log form */}
      <form
        onSubmit={logSession}
        className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Log a Session
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="" disabled>
              Select subject
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <DurationInput
            hours={hours}
            mins={mins}
            onHoursChange={setHours}
            onMinsChange={handleMinsChange}
            error={minsError}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Log Session
        </button>
      </form>

      {/* History */}
      <h3 className="text-sm font-semibold text-gray-300 mb-3">History</h3>

      {sessions.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No sessions logged yet. Add subjects in the Topics tab first, then log
          a session here.
        </p>
      )}

      <div className="space-y-2">
        {sessions.map((session) =>
          editingId === session.id ? (
            <form
              key={session.id}
              onSubmit={saveEdit}
              className="bg-gray-900 border border-indigo-500/50 rounded-lg px-4 py-3"
            >
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <DurationInput
                  hours={editHours}
                  mins={editMins}
                  onHoursChange={setEditHours}
                  onMinsChange={handleEditMinsChange}
                  error={editMinsError}
                  size="small"
                />
              </div>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          ) : (
            <div
              key={session.id}
              className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-white">
                      {session.subjects?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-indigo-400 font-medium">
                      {formatDuration(session.duration_minutes)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(session.created_at)} at{' '}
                    {formatTime(session.created_at)}
                  </div>
                  {session.note && (
                    <p className="text-xs text-gray-400 mt-1 break-words">
                      {session.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEditing(session)}
                    className="text-gray-600 hover:text-indigo-400 transition-colors cursor-pointer p-1"
                    title="Edit session"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                    title="Delete session"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="h-20 bg-gray-800 rounded-xl" />
        <div className="h-20 bg-gray-800 rounded-xl" />
        <div className="h-20 bg-gray-800 rounded-xl" />
      </div>
      <div className="h-40 bg-gray-800 rounded-xl" />
    </div>
  )
}
