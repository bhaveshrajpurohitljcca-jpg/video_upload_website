'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';
import { User, Mail, Lock, RefreshCw, CheckCircle2, Video, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { registerStudent } = useAuth();
  const router = useRouter();

  // Progress Step: 1 (Details) | 2 (Success)
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Registration Action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        name: fullName,
        email,
        passwordHash: password
      });
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow min-h-[90vh] flex flex-col md:flex-row bg-[#05030a]">
      
      {/* LEFT SIDE: INSTRUCTIONS & STATE */}
      <div className="w-full md:w-[45%] bg-[#080512] border-r border-white/[0.03] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-all">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            Creators<span className="text-violet-500">Bootcamp</span>
          </span>
        </Link>

        {/* Step Info */}
        <div className="space-y-6 my-16 md:my-0 z-10">
          {/* Progress Indicators */}
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 mb-6">
            <span className={step >= 1 ? 'text-violet-400 font-bold' : ''}>01 Details</span>
            <span className="h-px w-6 bg-white/[0.08]"></span>
            <span className={step === 2 ? 'text-violet-400 font-bold' : ''}>02 Complete</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Create Student <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Account.</span>
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-light">
            Sign up to upload your AI short film project, vote on peer creations, and receive jury evaluations. Enter your details to get started.
          </p>
        </div>

        {/* Creator Account Benefits */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[10px] text-zinc-400 z-10 max-w-sm">
          <span className="font-semibold text-violet-300 block mb-1">Creator Account Benefits:</span>
          <ul className="list-disc pl-3.5 space-y-1">
            <li>Submit 2-minute generative AI video entries.</li>
            <li>Vote for peer submissions in the live gallery.</li>
            <li>Get scored and reviewed by expert jury members.</li>
          </ul>
        </div>
      </div>

      {/* RIGHT SIDE: REGISTRATION STEPS FORM */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
              Step {step} of 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {step === 1 && 'Account Details'}
              {step === 2 && 'Account Activated!'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-light">
              {step === 1 && 'Create your new student participant account'}
              {step === 2 && 'Your bootcamp profile is ready for use.'}
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            
            {step === 1 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alice Johnson"
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl pl-4 pr-4 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@student.com"
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04]"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none transition-all focus:bg-white/[0.04]"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-6"
                >
                  {loading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Register Account
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Registration Complete!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Your account has been successfully created. Access to the submission engine and voting gallery has been initialized.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard/student')}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  Enter Student Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Login Callout */}
            {step !== 2 && (
              <div className="text-center text-[11px] text-zinc-500 pt-4 border-t border-white/[0.04] mt-2">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

