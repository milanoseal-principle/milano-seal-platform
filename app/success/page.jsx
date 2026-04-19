export default function Success() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Successful</h1>
      <p>Your request is now in execution.</p>

      <a href="/dashboard">
        <button>Go to Dashboard</button>
      </a>
    </div>
  )
}
