export default function AdminLoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#2B2B2B', padding: '40px' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: 32, color: '#C85A3E', textAlign: 'center', margin: 0, marginBottom: 8 }}>Darro</h1>
        <h2 style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#fff', textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>Admin Dashboard</h2>
        <form action="/api/auth/login" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4A574', marginBottom: 8 }}>Email</label>
            <input type="email" name="email" required placeholder="owner@darro.co" style={{ width: '100%', background: 'transparent', border: '1px solid #555', color: '#fff', padding: '12px 16px', fontFamily: 'sans-serif', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4A574', marginBottom: 8 }}>Password</label>
            <input type="password" name="password" required placeholder="••••••••••••" style={{ width: '100%', background: 'transparent', border: '1px solid #555', color: '#fff', padding: '12px 16px', fontFamily: 'sans-serif', fontSize: 14 }} />
          </div>
          <button type="submit" style={{ width: '100%', background: '#C85A3E', color: '#fff', padding: '16px', fontFamily: 'sans-serif', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
