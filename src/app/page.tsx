'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/utils/db';
import { Video, Award, Calendar, Users, FileText, Vote, ChevronRight, Sparkles, CheckCircle2, Play, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [featuredSubmissions, setFeaturedSubmissions] = useState<any[]>([]);

  // Time remaining states
  const [subTimeLeft, setSubTimeLeft] = useState('');
  const [voteTimeLeft, setVoteTimeLeft] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadData() {
      try {
        const currentStats = await db.getStats();
        setStats(currentStats);
        const currentSettings = await db.getSettings();
        setSettings(currentSettings);
        const currentThemes = await db.getThemes();
        setThemes(currentThemes);
        
        // Load top 3/latest submissions as featured submissions
        const leader = await db.getLeaderboard();
        const sorted = [...leader].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setFeaturedSubmissions(sorted.slice(0, 3));

        // Update countdown timers every second
        interval = setInterval(() => {
          const now = new Date().getTime();
          const subDead = new Date(currentSettings.submission_deadline).getTime();
          const voteDead = new Date(currentSettings.voting_deadline).getTime();

          const formatTime = (diff: number) => {
            if (diff <= 0) return 'Closed';
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
          };

          setSubTimeLeft(formatTime(subDead - now));
          setVoteTimeLeft(formatTime(voteDead - now));
        }, 1000);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }

    loadData();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getVotingStatus = () => {
    if (!settings) return 'Loading...';
    const now = new Date();
    const subDead = new Date(settings.submission_deadline);
    const voteDead = new Date(settings.voting_deadline);

    if (now < subDead) {
      return 'Submission Stage Open';
    } else if (now >= subDead && now < voteDead) {
      return 'Public & Jury Voting Active';
    } else {
      return 'Completed / Closed';
    }
  };

  return (
    <div className="flex-grow bg-[#07050f] text-zinc-100 font-sans">
      
      {/* SECTION 1: HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-24 md:py-32 px-4 sm:px-6 overflow-hidden border-b border-white/[0.03]">
        {/* Abstract Glow Elements */}
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[130px] pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs text-primary font-bold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            National College AI Video Competition
          </div>

          {/* Main Typography */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            AI Powered Content Creators <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Bootcamp</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Design, direct, and deploy a 2-minute short film leveraging cutting-edge generative AI models. Pitch your creation, secure public votes, and impress the jury.
          </p>

          {/* Countdown & CTA Controls */}
          <div className="max-w-2xl mx-auto pt-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 mb-8 text-left backdrop-blur-md">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Submissions Close In</span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1 block">
                  {subTimeLeft || '00d 00h 00m 00s'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">
                  {settings ? formatDate(settings.submission_deadline) : 'Loading deadline...'}
                </span>
              </div>
              <div className="border-l border-white/[0.06] pl-6">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Voting Phase Closes In</span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1 block">
                  {voteTimeLeft || '00d 00h 00m 00s'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">
                  {settings ? formatDate(settings.voting_deadline) : 'Loading deadline...'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/dashboard/student" 
                className="w-full sm:w-auto btn-primary px-8 py-3.5 text-xs normal-case flex items-center justify-center gap-2 group"
              >
                Submit Video Entry
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/gallery" 
                className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-xs normal-case flex items-center justify-center gap-2"
              >
                Explore Submissions Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPETITION OVERVIEW */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 border-b border-white/[0.03]">
        <div className="space-y-12">
          <div className="text-center md:text-left space-y-2 max-w-xl">
            <h2 className="text-xs uppercase tracking-widest font-bold text-violet-400">Bootcamp Metrics</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Live Platform Status</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Registered Students', value: stats?.registered_students ?? 0, desc: 'Students who completed portal registration.' },
              { label: 'AI Videos Uploaded', value: stats?.total_videos ?? 0, desc: 'Unique creations from registered students.' },
              { label: 'Active tracks', value: stats?.active_themes ?? 0, desc: 'Different creative competition categories.' },
              { label: 'Current Timeline State', value: getVotingStatus(), desc: 'Calculated from deadline dates.' },
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-8 space-y-4 hover:border-white/[0.1] transition-all hover:bg-white/[0.02]"
              >
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">{stat.label}</span>
                <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight font-mono">{stat.value}</span>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: THEMES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 border-b border-white/[0.03]">
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-xs uppercase tracking-widest font-bold text-violet-400">Competition Themes</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">Creative Focus Tracks</p>
            </div>
            <p className="text-sm text-zinc-400 max-w-md">
              Create video content targeting one of our active themes. Every submission must clearly align with the track concept and rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <div 
                key={theme.id}
                className="group relative bg-white/[0.01] border border-white/[0.04] hover:border-violet-500/30 rounded-2xl p-8 space-y-6 transition-all hover:bg-white/[0.02] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {theme.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Develop an immersive cinematic story exploring creative frameworks, interactive scripting, or generative AI designs built around this theme.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Track Status</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                    theme.active 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                  }`}>
                    {theme.active ? 'Accepting Entries' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 border-b border-white/[0.03]">
        <div className="space-y-16">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs uppercase tracking-widest font-bold text-violet-400">Execution Process</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">How to Participate</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { step: '01', title: 'Register Account', desc: 'Create your account using your name and email to secure access credentials.' },
              { step: '02', title: 'Create AI Video', desc: 'Utilize generative tools like Runway, Midjourney, or Elevenlabs to build your 2-minute project.' },
              { step: '03', title: 'Upload & Describe', desc: 'Submit your MP4 file. Declare the complete AI tools stack and cinematic prompt outline.' },
              { step: '04', title: 'Vote & Win', desc: 'Promote your project in the public gallery. Collect peer votes and present to judges.' },
            ].map((item, idx) => (
              <div key={idx} className="relative group space-y-4">
                <span className="text-4xl sm:text-5xl font-black text-zinc-800 tracking-tight block font-mono group-hover:text-violet-500/20 transition-colors">
                  {item.step}
                </span>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURED VIDEOS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xs uppercase tracking-widest font-bold text-violet-400">Showcase</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">Latest Bootcamp Submissions</p>
            </div>
            <Link 
              href="/gallery" 
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              View Full Gallery
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredSubmissions.map((sub) => (
                <div 
                  key={sub.id}
                  className="group bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-all hover:bg-white/[0.02] flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                    <img 
                      src={sub.thumbnail_url} 
                      alt={sub.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-semibold text-zinc-300 tracking-wide border border-white/5 uppercase">
                      {sub.theme_name}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white leading-snug truncate">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        By <span className="text-zinc-300 font-semibold">{sub.student_name}</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 border border-violet-500/20 text-violet-400 font-bold">
                        <Vote className="h-3 w-3" />
                        {sub.vote_count} votes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex flex-col items-center justify-center text-center p-6">
              <Video className="h-8 w-8 text-zinc-700 mb-2" />
              <p className="text-zinc-500 text-xs">No submissions uploaded yet.</p>
              <Link href="/dashboard/student" className="text-xs text-violet-400 hover:underline mt-2 font-semibold">
                Be the first to submit
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: FOOTER */}
      <footer className="bg-[#04020a] border-t border-white/[0.03] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-extrabold uppercase text-white tracking-widest">
              Creators<span className="text-violet-500">Bootcamp</span>
            </span>
          </div>

          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} AI Powered Content Creators Bootcamp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
