import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Confident']
const STATUS_COLORS = {
  'Not Started': 'bg-gray-700 text-gray-300',
  'In Progress': 'bg-amber-900/60 text-amber-300',
  Confident: 'bg-emerald-900/60 text-emerald-300',
}

export default function TopicTracker() {
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])
  const [topics, setTopics] = useState([])
  const [papers, setPapers] = useState([])
  const [newTopics, setNewTopics] = useState({})
  const [newSections, setNewSections] = useState({})
  const [newPapers, setNewPapers] = useState({})
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [activeTabs, setActiveTabs] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [
      { data: subData },
      { data: secData },
      { data: topData },
      { data: paperData },
    ] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at'),
      supabase.from('topic_sections').select('*').order('created_at'),
      supabase.from('topics').select('*').order('created_at'),
      supabase
        .from('past_papers')
        .select('*')
        .order('created_at', { ascending: false }),
    ])
    setSubjects(subData || [])
    setSections(secData || [])
    setTopics(topData || [])
    setPapers(paperData || [])
    setLoading(false)
  }

  async function addSubject(e) {
    e.preventDefault()
    const name = newSubject.trim()
    if (!name) return
    const { data } = await supabase.from('subjects').insert({ name }).select()
    if (data) {
      setSubjects((prev) => [...prev, data[0]])
      setNewSubject('')
      setShowAddSubject(false)
    }
  }

  async function deleteSubject(id) {
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects((prev) => prev.filter((s) => s.id !== id))
    setSections((prev) => prev.filter((s) => s.subject_id !== id))
    setTopics((prev) => prev.filter((t) => t.subject_id !== id))
    setPapers((prev) => prev.filter((p) => p.subject_id !== id))
  }

  async function addSection(subjectId, e) {
    e.preventDefault()
    const name = (newSections[subjectId] || '').trim()
    if (!name) return
    const { data } = await supabase
      .from('topic_sections')
      .insert({ subject_id: subjectId, name })
      .select()
    if (data) {
      setSections((prev) => [...prev, data[0]])
      setNewSections((prev) => ({ ...prev, [subjectId]: '' }))
    }
  }

  async function deleteSection(id) {
    await supabase.from('topic_sections').delete().eq('id', id)
    setSections((prev) => prev.filter((s) => s.id !== id))
    setTopics((prev) => prev.filter((t) => t.section_id !== id))
  }

  async function addTopic(subjectId, sectionId, e) {
    e.preventDefault()
    const key = sectionId || subjectId
    const name = (newTopics[key] || '').trim()
    if (!name) return
    const { data } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        section_id: sectionId || null,
        name,
      })
      .select()
    if (data) {
      setTopics((prev) => [...prev, data[0]])
      setNewTopics((prev) => ({ ...prev, [key]: '' }))
    }
  }

  async function updateTopicStatus(topicId, status) {
    await supabase.from('topics').update({ status }).eq('id', topicId)
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status } : t))
    )
  }

  async function deleteTopic(id) {
    await supabase.from('topics').delete().eq('id', id)
    setTopics((prev) => prev.filter((t) => t.id !== id))
  }

  async function addPaper(subjectId, e) {
    e.preventDefault()
    const input = newPapers[subjectId] || {}
    const name = (input.name || '').trim()
    if (!name) return
    const { data } = await supabase
      .from('past_papers')
      .insert({
        subject_id: subjectId,
        name,
        score: (input.score || '').trim() || null,
        note: (input.note || '').trim() || null,
        completed_at: input.date || null,
      })
      .select()
    if (data) {
      setPapers((prev) => [data[0], ...prev])
      setNewPapers((prev) => ({ ...prev, [subjectId]: {} }))
    }
  }

  async function deletePaper(id) {
    await supabase.from('past_papers').delete().eq('id', id)
    setPapers((prev) => prev.filter((p) => p.id !== id))
  }

  function getProgress(subjectId) {
    const subTopics = topics.filter((t) => t.subject_id === subjectId)
    if (subTopics.length === 0) return { percent: 0, confident: 0, total: 0 }
    const confident = subTopics.filter((t) => t.status === 'Confident').length
    return {
      percent: Math.round((confident / subTopics.length) * 100),
      confident,
      total: subTopics.length,
    }
  }

  function getActiveTab(subjectId) {
    return activeTabs[subjectId] || 'topics'
  }

  function setActiveTab(subjectId, tab) {
    setActiveTabs((prev) => ({ ...prev, [subjectId]: tab }))
  }

  function updateNewPaper(subjectId, field, value) {
    setNewPapers((prev) => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || {}), [field]: value },
    }))
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  const sortedSubjects = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Topic Tracker</h2>
        <button
          onClick={() => setShowAddSubject(!showAddSubject)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          + Add Subject
        </button>
      </div>

      {topics.length > 0 && (() => {
        const totalTopics = topics.length
        const confidentTopics = topics.filter((t) => t.status === 'Confident').length
        const overallPercent = Math.round((confidentTopics / totalTopics) * 100)
        return (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 font-medium">
                Overall Progress
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {confidentTopics}/{totalTopics} confident — {overallPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        )
      })()}

      {showAddSubject && (
        <form onSubmit={addSubject} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject name (e.g. Maths)"
              autoFocus
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubject('')
                }}
                className="flex-1 sm:flex-none text-gray-500 hover:text-gray-300 px-3 py-2.5 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {sortedSubjects.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No subjects yet. Click &quot;+ Add Subject&quot; to get started.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSubjects.map((subject) => {
          const progress = getProgress(subject.id)
          const subSections = sections.filter(
            (s) => s.subject_id === subject.id
          )
          const unsectionedTopics = topics
            .filter((t) => t.subject_id === subject.id && !t.section_id)
            .sort((a, b) => a.name.localeCompare(b.name))
          const subPapers = papers.filter((p) => p.subject_id === subject.id)
          const tab = getActiveTab(subject.id)

          return (
            <div
              key={subject.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {subject.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {progress.confident}/{progress.total} confident
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab(subject.id, 'topics')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                      tab === 'topics'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Topics
                  </button>
                  <button
                    onClick={() => setActiveTab(subject.id, 'papers')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                      tab === 'papers'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Past Papers
                  </button>
                </div>

                {/* Topics tab */}
                {tab === 'topics' && (
                  <>
                    {/* Add section + topic forms side by side */}
                    <div className="flex gap-2 mb-4">
                      <form
                        onSubmit={(e) => addSection(subject.id, e)}
                        className="flex gap-1.5 flex-1"
                      >
                        <input
                          type="text"
                          value={newSections[subject.id] || ''}
                          onChange={(e) =>
                            setNewSections((prev) => ({
                              ...prev,
                              [subject.id]: e.target.value,
                            }))
                          }
                          placeholder="New section"
                          className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </form>
                      <form
                        onSubmit={(e) => addTopic(subject.id, null, e)}
                        className="flex gap-1.5 flex-1"
                      >
                        <input
                          type="text"
                          value={newTopics[subject.id] || ''}
                          onChange={(e) =>
                            setNewTopics((prev) => ({
                              ...prev,
                              [subject.id]: e.target.value,
                            }))
                          }
                          placeholder="New topic"
                          className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </form>
                    </div>

                    {/* Sections */}
                    {subSections.map((section) => {
                      const sectionTopics = topics
                        .filter((t) => t.section_id === section.id)
                        .sort((a, b) => a.name.localeCompare(b.name))
                      return (
                        <div key={section.id} className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                              {section.name}
                            </h4>
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="text-gray-700 hover:text-red-400 transition-colors cursor-pointer p-0.5 text-xs"
                              title="Delete section"
                            >
                              ✕
                            </button>
                          </div>

                          <TopicList
                            topics={sectionTopics}
                            onUpdateStatus={updateTopicStatus}
                            onDelete={deleteTopic}
                          />

                          <form
                            onSubmit={(e) =>
                              addTopic(subject.id, section.id, e)
                            }
                            className="flex gap-2 mt-2"
                          >
                            <input
                              type="text"
                              value={newTopics[section.id] || ''}
                              onChange={(e) =>
                                setNewTopics((prev) => ({
                                  ...prev,
                                  [section.id]: e.target.value,
                                }))
                              }
                              placeholder="New topic"
                              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                              type="submit"
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          </form>
                        </div>
                      )
                    })}

                    {/* Unsectioned topics */}
                    {unsectionedTopics.length > 0 && (
                      <div className={subSections.length > 0 ? 'mt-4 pt-3 border-t border-gray-800' : ''}>
                        {subSections.length > 0 && (
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            General
                          </h4>
                        )}

                        <TopicList
                          topics={unsectionedTopics}
                          onUpdateStatus={updateTopicStatus}
                          onDelete={deleteTopic}
                        />
                      </div>
                    )}

                    {subSections.length === 0 &&
                      unsectionedTopics.length === 0 && (
                        <p className="text-gray-600 text-sm text-center py-2">
                          No topics yet.
                        </p>
                      )}
                  </>
                )}

                {/* Past Papers tab */}
                {tab === 'papers' && (
                  <>
                    <form
                      onSubmit={(e) => addPaper(subject.id, e)}
                      className="space-y-2 mb-4"
                    >
                      <input
                        type="text"
                        value={(newPapers[subject.id] || {}).name || ''}
                        onChange={(e) =>
                          updateNewPaper(subject.id, 'name', e.target.value)
                        }
                        placeholder="Paper name"
                        required
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={(newPapers[subject.id] || {}).score || ''}
                          onChange={(e) =>
                            updateNewPaper(subject.id, 'score', e.target.value)
                          }
                          placeholder="Score (e.g. 72%)"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <input
                          type="date"
                          value={(newPapers[subject.id] || {}).date || ''}
                          onChange={(e) =>
                            updateNewPaper(subject.id, 'date', e.target.value)
                          }
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:dark]"
                        />
                      </div>
                      <input
                        type="text"
                        value={(newPapers[subject.id] || {}).note || ''}
                        onChange={(e) =>
                          updateNewPaper(subject.id, 'note', e.target.value)
                        }
                        placeholder="Notes (optional)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Add Paper
                      </button>
                    </form>

                    {subPapers.length === 0 && (
                      <p className="text-gray-600 text-sm text-center py-4">
                        No past papers yet.
                      </p>
                    )}

                    <ul className="space-y-2">
                      {subPapers.map((paper) => (
                        <li
                          key={paper.id}
                          className="bg-gray-800/50 rounded-lg px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-200 font-medium truncate">
                              {paper.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {paper.score && (
                                <span className="text-xs font-medium text-indigo-400">
                                  {paper.score}
                                </span>
                              )}
                              <button
                                onClick={() => deletePaper(paper.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                                title="Delete paper"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {paper.completed_at && (
                              <span className="text-xs text-gray-500">
                                {formatDate(paper.completed_at)}
                              </span>
                            )}
                            {paper.note && (
                              <span className="text-xs text-gray-400 truncate">
                                {paper.completed_at ? '— ' : ''}
                                {paper.note}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                  <button
                    onClick={() => deleteSubject(subject.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete subject
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicList({ topics, onUpdateStatus, onDelete }) {
  if (topics.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {topics.map((topic) => (
        <li
          key={topic.id}
          className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2"
        >
          <span className="text-sm text-gray-200 truncate min-w-0 flex-1">
            {topic.name}
          </span>
          <select
            value={topic.status}
            onChange={(e) => onUpdateStatus(topic.id, e.target.value)}
            className={`text-xs font-medium rounded-md px-2 py-1 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 ${STATUS_COLORS[topic.status]}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => onDelete(topic.id)}
            className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-0.5 shrink-0"
            title="Delete topic"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-48 bg-gray-800 rounded-xl" />
        <div className="h-48 bg-gray-800 rounded-xl" />
      </div>
    </div>
  )
}
