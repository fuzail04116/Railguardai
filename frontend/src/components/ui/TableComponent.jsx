/**
 * TableComponent — Data table with custom column rendering and risk-level row styling.
 * Supports custom render functions per column for formatting dates, scores, etc.
 */

const LEVEL_COLORS = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

export function TableComponent({ columns = [], rows = [] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-guardian-600 text-xs">
        <div className="text-center">
          <div className="text-3xl mb-2 opacity-20">📋</div>
          <p>No incidents recorded</p>
          <p className="text-[10px] mt-1 text-guardian-700">Use the simulate button to generate test data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-guardian-700/50">
            {columns.map((col) => (
              <th
                key={col.id || col.key}
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-guardian-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              className={`
                border-b border-guardian-800/50
                transition-colors duration-150
                hover:bg-guardian-700/20
                ${row.risk_level === 'critical' ? 'bg-red-500/[0.03]' : ''}
                animate-fade-in
              `}
              style={{ animationDelay: `${rowIdx * 30}ms` }}
            >
              {columns.map((col) => {
                const rawValue = row[col.key]
                const displayValue = col.render ? col.render(rawValue, row) : rawValue

                // Special styling for risk_level column
                const isLevelCol = col.key === 'risk_level'
                const levelColor = isLevelCol ? (LEVEL_COLORS[rawValue] || 'text-guardian-300') : ''

                return (
                  <td
                    key={col.id || col.key}
                    className={`
                      px-4 py-2.5 text-xs font-mono
                      ${isLevelCol ? `font-semibold uppercase ${levelColor}` : 'text-guardian-300'}
                    `}
                  >
                    {displayValue ?? '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
