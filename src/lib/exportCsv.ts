/**
 * Utility to convert data objects into a CSV file and initiate a browser download.
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!data || data.length === 0) return

  let csvContent = ''

  if (headers && headers.length > 0) {
    csvContent += headers.map(h => escapeCSVValue(h.label)).join(',') + '\r\n'
    data.forEach(item => {
      const row = headers.map(h => escapeCSVValue(item[h.key]))
      csvContent += row.join(',') + '\r\n'
    })
  } else {
    const keys = Object.keys(data[0])
    csvContent += keys.map(k => escapeCSVValue(k)).join(',') + '\r\n'
    data.forEach(item => {
      const row = keys.map(k => escapeCSVValue(item[k]))
      csvContent += row.join(',') + '\r\n'
    })
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url)
    }
  }
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
