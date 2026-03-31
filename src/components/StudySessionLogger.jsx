import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function StudySessionLogger() {
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editSubjectId, setEditSubjectId] = useState('')
  const [editDuration, setEditDuration] = useState('')
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
    if (subData?.length && !subjectId) setSubjectId(subData[0].id)
    setLoading(false)
  }

  async function logSession(e) {
    e.preventDefault()
    if (!subjectId || !duration) return
    const { data } = await supabase
      .from('study_sessions')
      .insert({
        subject_id: subjectId,
        duration_minutes: parseInt(duration, 10),
        note: note.trim() || null,
      })
      .select('*, subjects(name)')
    if (data) {
      setSessions((prev) => [data[0], ...prev])
      setDuration('')
      setNote('')
    }
  }

  function startEditing(session) {
    setEditingId(session.id)
    setEditSubjectId(session.subject_id)
    setEditDuration(String(session.duration_minutes))
    setEditNote(session.note || '')
  }

  function cancelEditing() {
    setEditingId(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editSubjectId || !editDuration) return
    const { data } = await supabase
      .from('study_sessions')
      .update({
        subject_id: editSubjectId,
        duration_minutes: parseInt(editDuration, 10),
        note: editNote.trim() || null,
      })
      .eq('id', editingId)
      .select('*, subjects(name)')
    if (data) {
      setSessions((prev) =>
        prev.map((s) => (s.id === editingId ? data[0] : s))
      )
      setEditingId(null)
    }
  }

  async function deleteSession(id) {
    await supabase.from('study_sessions').delete().eq('id', id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function getTotalHours(subId) {
    const mins = sessions
      .filter((s) => s.subject_id === subId)
      .reduce((sum, s) => sum + s.duration_minutes, 0)
    return (mins / 60).toFixed(1)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  const totalAllHours = (
    sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60
  ).toFixed(1)

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Study Sessions</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-xl p-4">
          <p className="text-xs text-indigo-400 font-medium mb-1">
            Total Hours
          </p>
          <p className="text-2xl font-bold text-white">{totalAllHours}</p>
        </div>
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            <p className="text-xs text-gray-400 font-medium mb-1 truncate">
              {sub.name}
            </p>
            <p className="text-2xl font-bold text-white">
              {getTotalHours(sub.id)}
              <span className="text-sm font-normal text-gray-500 ml-1">
                hrs
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Log form */}
      <form
        onSubmit={logSession}
        className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Log a Session
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Minutes"
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={!subjectId || !duration}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
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
                <input
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="Minutes"
                  required
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
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
                      {session.duration_minutes} min
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
