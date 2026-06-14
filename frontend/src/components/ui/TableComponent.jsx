/**
 * TableComponent — Data table with warm light theme.
 * Supports custom render functions per column.
 */

const LEVEL_COLORS = {
  low: '#27AE60',
  medium: '#E67E22',
  high: '#C0392B',
  critical: '#C0392B',
}

export function TableComponent({ columns = [], rows = [] }) {
  if (rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9C9690', fontSize: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.2 }}>📋</div>
          <p style={{ margin: 0 }}>No incidents recorded</p>
          <p style={{ fontSize: 10, marginTop: 4, color: '#DDD9D2' }}>Use the simulate button to generate test data</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #DDD9D2' }}>
            {columns.map((col) => (
              <th
                key={col.id || col.key}
                style={{
                  padding: '10px 14px', fontSize: 9, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: '#9C9690',
                }}
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
              className="animate-fade-in"
              style={{
                borderBottom: '1px solid #EFEDE8',
                transition: 'background 0.1s',
                background: row.risk_level === 'critical' ? '#FDF6F5' : 'transparent',
                animationDelay: `${rowIdx * 20}ms`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F7F4EF'}
              onMouseLeave={e => e.currentTarget.style.background = row.risk_level === 'critical' ? '#FDF6F5' : 'transparent'}
            >
              {columns.map((col) => {
                const rawValue = row[col.key]
                const displayValue = col.render ? col.render(rawValue, row) : rawValue
                const isLevelCol = col.key === 'risk_level'

                return (
                  <td
                    key={col.id || col.key}
                    style={{
                      padding: '8px 14px', fontSize: 11,
                      color: isLevelCol ? (LEVEL_COLORS[rawValue] || '#1C1917') : '#1C1917',
                      fontWeight: isLevelCol ? 600 : 400,
                      textTransform: isLevelCol ? 'uppercase' : 'none',
                    }}
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
