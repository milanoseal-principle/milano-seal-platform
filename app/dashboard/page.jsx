'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>Operator Dashboard</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
