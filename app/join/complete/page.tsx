export default function CompletePage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f4f6f8',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '32px 28px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #e5e5e5',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ fontSize: '48px' }}>✓</div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>All done!</h1>
        <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
          Your results have been saved. You can close this page.
        </p>
      </div>
    </main>
  )
}