import { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldAlert, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../config/supabase';

export default function LoginPage({ onLoginSuccess, onBypassPreview }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      if (!supabaseConfigured || !supabase) {
        throw new Error('Supabase configuration is missing. Use Preview Mode to test the Admin Dashboard locally.');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message);
      }

      const user = data?.user;
      if (!user) throw new Error('Could not authenticate user.');

      // Check staff membership in staff_profiles (optional metadata)
      const { data: staff } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const profile = staff || {
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Staff Member',
        role: 'owner',
        active: true,
      };

      if (onLoginSuccess) {
        onLoginSuccess(user, profile);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <header className="login-card-header">
          <div className="brand-logo-mark">GF</div>
          <small>STAFF PORTAL</small>
          <h2>The Gifting Factory</h2>
          <p>Sign in with your staff Supabase credentials to access order management, custom briefs, and shop operations.</p>
        </header>

        {!supabaseConfigured && (
          <div className="login-preview-notice" role="alert">
            <ShieldAlert size={18} />
            <div>
              <strong>Unconnected Preview Mode</strong>
              <p>No Supabase credentials detected in environment variables. You can enter Preview Mode to inspect the admin UI.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            <span>Email Address</span>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                placeholder="staff@thegiftingfactory.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </label>

          <button
            type="submit"
            className="login-primary-btn"
            disabled={submitting}
          >
            {submitting ? (
              'Authenticating…'
            ) : (
              <>
                Sign in to Dashboard <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {!supabaseConfigured && (
          <button
            type="button"
            className="bypass-preview-btn"
            onClick={onBypassPreview}
          >
            Enter Admin Dashboard (Preview Mode)
          </button>
        )}

        <footer className="login-card-footer">
          <a href="/" className="back-storefront-link">← Return to Storefront</a>
        </footer>
      </div>
    </div>
  );
}
