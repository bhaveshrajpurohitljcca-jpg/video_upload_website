'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';
import { Mail, Lock, ArrowRight, RefreshCw, KeyRound, Sparkles, Video, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back! Logged in as ${user.role}.`);
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'judge') {
        router.push('/dashboard/judge');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
      toast.success('Password reset link has been sent to your email.');
    }, 1500);
  };

  const fillRole = (role: 'student' | 'judge' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@competition.com');
      setPassword('admin123');
    } else if (role === 'judge') {
      setEmail('judge1@competition.com');
      setPassword('judge123');
    } else {
      setEmail('alice@student.com');
      setPassword('student123');
    }
  };

  return (
    <div className="flex-grow min-h-[90vh] flex flex-col md:flex-row bg-[#05030a]">
      
      {/* LEFT SIDE: EVENT BRANDING */}
      <div className="w-full md:w-[45%] bg-[#080512] border-r border-white/[0.03] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20 group-hover:scale-105 transition-all">
            <Video className="h-5 w-5 text-black" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-white font-heading">
            Creators<span className="text-primary">Bootcamp</span>
          </span>
        </Link>

        {/* Big Brand Statement */}
        <div className="space-y-6 my-16 md:my-0 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] text-primary font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            Portal Sign In
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Manage your submissions <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">live.</span>
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-light">
            Access students upload console, cast votes in the public gallery, review judges score boards, and coordinate bootcamp settings.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-zinc-500 z-10">
          &copy; {new Date().getFullYear()} AI Powered Content Creators Bootcamp. College Hackathon Module.
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {forgotMode ? 'Reset Password' : 'Sign In'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-light">
              {forgotMode 
                ? 'Enter your email to receive a password reset link' 
                : 'Access student, judge, or admin dashboards'}
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            {forgotMode ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {resetSent ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Check your email</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      We sent a password reset link to <span className="text-zinc-200 font-medium">{resetEmail}</span>. Follow the link to reset your password.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setResetSent(false);
                        setResetEmail('');
                      }}
                      className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04] focus:ring-2 focus:ring-violet-500/10"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        {loading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            Send Reset Link
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors text-center mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@college.edu"
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-primary/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04] focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-primary/60 rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04] focus:ring-2 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login Button */}
                 <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-xs font-bold uppercase tracking-wider mt-2"
                >
                  {loading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                {/* Register Callout */}
                <div className="text-center text-[11px] text-zinc-500 pt-4 border-t border-white/[0.04] mt-2">
                  New student participant?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-primary hover:underline transition-colors"
                  >
                    Create account
                  </Link>
                </div>

                {/* Demo Logins */}
                <div className="pt-4 border-t border-white/[0.04] space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Autofill Demo Roles:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['student', 'judge', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => fillRole(role as any)}
                        className="py-1.5 bg-white/[0.02] hover:bg-primary/10 border border-white/[0.06] hover:border-primary/20 text-zinc-300 hover:text-primary rounded-lg text-[10px] font-semibold transition-all uppercase tracking-wide"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
