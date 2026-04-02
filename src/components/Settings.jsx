const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export default function Settings({ settings, onUpdate }) {
  const inputClass =
    'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Theme */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Theme</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Mode
              </label>
              <div className="flex gap-2">
                {['auto', 'dark', 'light'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdate({ themeMode: mode })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      settings.themeMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {mode === 'auto' ? 'Auto (time-based)' : mode === 'dark' ? 'Always Dark' : 'Always Light'}
                  </button>
                ))}
              </div>
            </div>

            {settings.themeMode === 'auto' && (
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Light theme starts at
                  </label>
                  <select
                    value={settings.lightStart}
                    onChange={(e) =>
                      onUpdate({ lightStart: parseInt(e.target.value, 10) })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Dark theme starts at
                  </label>
                  <select
                    value={settings.lightEnd}
                    onChange={(e) =>
                      onUpdate({ lightEnd: parseInt(e.target.value, 10) })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Exams</h3>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">
              Urgency threshold (days)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Exams within this many days are highlighted in red.
            </p>
            <input
              type="number"
              min="1"
              max="90"
              value={settings.examUrgencyDays}
              onChange={(e) =>
                onUpdate({ examUrgencyDays: parseInt(e.target.value, 10) || 14 })
              }
              className={`w-24 ${inputClass}`}
            />
          </div>
        </div>

        {/* Reset */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Reset</h3>
          <button
            onClick={() => {
              if (window.confirm('Reset all settings to defaults?')) {
                onUpdate({
                  themeMode: 'auto',
                  lightStart: 7,
                  lightEnd: 20,
                  examUrgencyDays: 14,
                })
              }
            }}
            className="bg-gray-800 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
