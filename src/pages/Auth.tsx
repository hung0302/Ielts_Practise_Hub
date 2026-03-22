import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Mail } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'verify';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMode('verify');
      } else if (mode === 'verify') {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup',
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  const direction = mode === 'signup' ? 1 : mode === 'login' ? -1 : 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-200 relative min-h-[450px] flex flex-col justify-center"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            {mode === 'verify' ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 mb-4">
                  <Mail className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  We sent a verification code to <span className="font-semibold text-slate-900">{email}</span>.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="sr-only">
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full rounded-md border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-center sm:text-2xl tracking-widest px-3 font-mono"
                      placeholder="00000000"
                      maxLength={8}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-red-50 p-3">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || otp.length < 8}
                    className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                  </button>
                </form>
                <button
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {mode === 'login' ? 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setError(null);
                      }}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email-address" className="block text-sm font-medium leading-6 text-slate-900">
                        Email address
                      </label>
                      <div className="mt-2">
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900">
                        Password
                      </label>
                      <div className="mt-2">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-slate-900">
                          Confirm Password
                        </label>
                        <div className="mt-2">
                          <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="••••••••"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : mode === 'login' ? (
                      'Sign in'
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
