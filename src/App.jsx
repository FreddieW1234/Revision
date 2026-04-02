import { useState, useEffect } from 'react'
import { supabaseConfigured } from './supabaseClient'
import TopicTracker from './components/TopicTracker'
import StudySessionLogger from './components/StudySessionLogger'
import ExamCountdown from './components/ExamCountdown'
import Analytics from './components/Analytics'
import Settings from './components/Settings'

const tabs = [
  { id: 'topics', label: 'Topics', icon: '📚' },
  { id: 'sessions', label: 'Sessions', icon: '⏱️' },
  { id: 'exams', label: 'Exams', icon: '📅' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const DEFAULT_SETTINGS = {
  themeMode: 'auto',
  lightStart: 7,
  lightEnd: 20,
  examUrgencyDays: 14,
}

function loadSettings() {
  try {
    const stored = localStorage.getItem('revision-settings')
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

function resolveTheme(settings) {
  if (settings.themeMode === 'dark') return 'dark'
  if (settings.themeMode === 'light') return 'light'
  const hour = new Date().getHours()
  return hour >= settings.lightStart && hour < settings.lightEnd ? 'light' : 'dark'
}

export default function App() {
  const [activeTab, setActiveTab] = useState('topics')
  const [settings, setSettings] = useState(loadSettings)
  const [theme, setTheme] = useState(() => resolveTheme(loadSettings()))

  function updateSettings(patch) {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('revision-settings', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    setTheme(resolveTheme(settings))
    if (settings.themeMode === 'auto') {
      const interval = setInterval(
        () => setTheme(resolveTheme(settings)),
        60000
      )
      return () => clearInterval(interval)
    }
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    if (theme === 'light') {
      root.classList.add('light-theme')
      document.body.style.backgroundColor = '#f8fafc'
      if (meta) meta.setAttribute('content', '#f8fafc')
    } else {
      root.classList.remove('light-theme')
      document.body.style.backgroundColor = '#030712'
      if (meta) meta.setAttribute('content', '#030712')
    }
  }, [theme])

  if (!supabaseConfigured) {
    return <SetupScreen />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-gray-900 border-r border-gray-800 p-6 gap-2 shrink-0">
        <h1 className="text-xl font-bold text-white mb-8 tracking-tight">
          Revision Tracker
        </h1>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-indigo-400'
                : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 md:px-6 md:py-8 pb-20 md:pb-8 overflow-y-auto">
        <h1 className="md:hidden text-lg font-bold text-white mb-4">
          Revision Tracker
        </h1>
        <div className="w-full">
          {activeTab === 'topics' && <TopicTracker />}
          {activeTab === 'sessions' && <StudySessionLogger />}
          {activeTab === 'exams' && (
            <ExamCountdown urgencyDays={settings.examUrgencyDays} />
          )}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && (
            <Settings settings={settings} onUpdate={updateSettings} />
          )}
        </div>
      </main>
    </div>
  )
}

function SetupScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Revision Tracker
        </h1>
        <p className="text-gray-400 mb-6">
          Supabase is not configured yet. Create a{' '}
          <code className="bg-gray-800 text-indigo-400 px-1.5 py-0.5 rounded text-sm">
            .env
          </code>{' '}
          file in the project root with your credentials:
        </p>
        <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto mb-6">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
        </pre>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="text-white font-medium">1.</span> Create a project
            at{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline"
            >
              supabase.com
            </a>
          </p>
          <p>
            <span className="text-white font-medium">2.</span> Run the SQL from{' '}
            <code className="bg-gray-800 text-indigo-400 px-1.5 py-0.5 rounded text-sm">
              supabase-schema.sql
            </code>{' '}
            in the SQL Editor
          </p>
          <p>
            <span className="text-white font-medium">3.</span> Copy your URL and
            anon key from Settings → API
          </p>
          <p>
            <span className="text-white font-medium">4.</span> Restart the dev
            server after saving{' '}
            <code className="bg-gray-800 text-indigo-400 px-1.5 py-0.5 rounded text-sm">
              .env
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
