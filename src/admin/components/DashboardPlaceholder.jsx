import { logoutToLogin } from '../utils/logout';

export default function DashboardPlaceholder() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Signed in. Dashboard coming soon.</h1>
      <button onClick={logoutToLogin}>Sign out</button>
    </main>
  );
}
