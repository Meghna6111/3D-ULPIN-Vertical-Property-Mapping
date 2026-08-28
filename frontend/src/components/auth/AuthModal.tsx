import React, { useState } from 'react';
import { useAuth } from '../../services/auth/AuthContext';
import { X, Lock, Mail, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, signUpWithEmail, loginDevMock, isDevAuth } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevMock = () => {
    loginDevMock();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/[0.08] bg-base-900/90 p-6 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-100 font-mono tracking-wide">
              {isSignUp ? 'REGISTER DEPARTMENT USER' : 'ULPIN PORTAL SIGN IN'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {isDevAuth ? 'Running in Local Development Bypass Mode' : 'Authenticate using Firebase Secure Identity'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger-500/25 bg-danger-500/10 p-3 text-xs text-danger-400">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Department Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="officer@dilrmp.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-base-950/50 border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-500/50 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Secure Key / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base-950/50 border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-500/50 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-500 hover:bg-accent-600 disabled:bg-accent-800 text-white rounded-lg py-2 text-xs font-semibold tracking-wide transition-all shadow-md font-mono"
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'SECURE SIGN IN'}
          </button>
        </form>

        {/* Dev mock option */}
        {isDevAuth && (
          <div className="mt-4 border-t border-white/[0.04] pt-4">
            <button
              onClick={handleDevMock}
              className="w-full bg-base-800 hover:bg-base-750 text-slate-300 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all border border-white/[0.06] font-mono"
            >
              BYPASS LOGIN (MOCK DEV USER)
            </button>
          </div>
        )}

        {/* Footer Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] text-accent-400 hover:text-accent-300 transition-all font-mono"
          >
            {isSignUp
              ? 'Already have a secure account? Sign In'
              : 'Need new department access? Register here'}
          </button>
        </div>

      </div>
    </div>
  );
};
