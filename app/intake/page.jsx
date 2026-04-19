'use client'

import { useState } from 'react'

export default function Intake() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.target)

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        amount: 750
      })
    })

    const data = await res.json()

    window.location.href = data.url
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 40 }}>
      <h2>Start Your Apostille Request</h2>

      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />

      <button type="submit">
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  )
}
