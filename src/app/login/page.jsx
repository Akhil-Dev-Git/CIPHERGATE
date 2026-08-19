import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple mock authentication
    if (passkey === 'cipher2026' || passkey === 'admin') {
      // Store session securely
      sessionStorage.setItem('cipher_auth', 'true');
      navigate('/dashboard');
    } else {
      setError('Invalid passkey. Access Denied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">CIPHERGATE</h1>
            <p className="text-gray-400 text-sm mt-2">Secure Operator Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Operator Passkey
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                placeholder="Enter access code"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Authenticate <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-600 font-mono">
              UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
