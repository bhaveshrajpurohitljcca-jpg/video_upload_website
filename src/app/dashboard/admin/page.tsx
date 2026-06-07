'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { toast } from '@/components/ui/toast';
import { 
  Users, Video, Vote, Award, Settings, Plus, Edit2, Trash2, 
  Upload, Download, ShieldCheck, Sparkles, LogOut, BookOpen, 
  Briefcase, BarChart3, PieChart as PieIcon, RefreshCw, Calendar,
  ListFilter, KeyRound, Hammer, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Active Tab: 'leaderboard' | 'registered_students' | 'judges' | 'themes' | 'settings'
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'registered_students' | 'judges' | 'themes' | 'settings'>('leaderboard');

  // Load state from DB
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);

  // Judge CRUD states
  const [editingJudge, setEditingJudge] = useState<any | null>(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judgeForm, setJudgeForm] = useState({
    name: '',
    email: '',
    password: '',
    active: true
  });

  // Theme CRUD states
  const [editingTheme, setEditingTheme] = useState<any | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeForm, setThemeForm] = useState({
    name: '',
    active: true
  });

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    submission_deadline: '',
    voting_deadline: '',
    video_size_limit_mb: 50,
    judge_score_min: 1,
    judge_score_max: 100,
    winner_count: 3,
    public_vote_weight: 30,
    judge_score_weight: 70
  });

  // Filters for Registered Students table
  const [registeredSearch, setRegisteredSearch] = useState('');

  const loadData = async () => {
    try {
      const currentSettings = await db.getSettings();
      setSettings(currentSettings);
      setSettingsForm({
        submission_deadline: currentSettings.submission_deadline || '',
        voting_deadline: currentSettings.voting_deadline || '',
        video_size_limit_mb: currentSettings.video_size_limit_mb || 50,
        judge_score_min: currentSettings.judge_score_min || 1,
        judge_score_max: currentSettings.judge_score_max || 100,
        winner_count: currentSettings.winner_count || 3,
        public_vote_weight: currentSettings.public_vote_weight || 30,
        judge_score_weight: currentSettings.judge_score_weight || 70
      });

      const statsData = await db.getStats();
      setStats(statsData);
      const themesData = await db.getThemes();
      setThemes(themesData);
      const judgesData = await db.getJudges();
      setJudges(judgesData);
      const leaderboardData = await db.getLeaderboard();
      setLeaderboard(leaderboardData);
      const registeredStudentsData = await db.getRegisteredStudents();
      setRegisteredStudents(registeredStudentsData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/login');
      return;
    }

    loadData();
  }, [user]);

  // Chart Data preparation
  const getThemeChartData = () => {
    const counts: Record<string, number> = {};
    themes.forEach(t => { counts[t.name] = 0; });
    leaderboard.forEach(sub => {
      counts[sub.theme_name] = (counts[sub.theme_name] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).filter(c => c.value > 0);
  };

  const getLeaderboardChartData = () => {
    return leaderboard.slice(0, 5).map(sub => ({
      name: sub.title.length > 12 ? sub.title.substring(0, 10) + '...' : sub.title,
      score: parseFloat(sub.final_score),
      votes: sub.vote_count
    }));
  };

  const handleDeleteRegisteredStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this registered student account? All linked submissions, votes, and jury scores will be deleted. The student can register again.')) {
      try {
        await db.deleteRegisteredStudent(studentId);
        toast.success('Registered account and related records deleted.');
        await loadData();
      } catch (err: any) {
        toast.error(err.message || 'Deletion failed.');
      }
    }
  };

  // Judge CRUD operations
  const openJudgeModal = (judge: any = null) => {
    if (judge) {
      setEditingJudge(judge);
      setJudgeForm({
        name: judge.name,
        email: judge.email,
        password: '',
        active: judge.active
      });
    } else {
      setEditingJudge(null);
      setJudgeForm({
        name: '',
        email: '',
        password: '',
        active: true
      });
    }
    setShowJudgeModal(true);
  };

  const handleJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJudge) {
        await db.updateJudge(editingJudge.id, judgeForm.name, judgeForm.email, judgeForm.active);
        toast.success('Judge details updated.');
      } else {
        await db.addJudge(judgeForm);
        toast.success('New judge created.');
      }
      setShowJudgeModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleDeleteJudge = async (id: string) => {
    if (confirm('Are you sure you want to delete this judge? All evaluation score sheets created by this judge will be deleted.')) {
      try {
        await db.deleteJudge(id);
        toast.success('Judge and associated evaluations deleted.');
        await loadData();
      } catch (err: any) {
        toast.error(err.message || 'Deletion failed.');
      }
    }
  };

  // Theme CRUD operations
  const openThemeModal = (theme: any = null) => {
    if (theme) {
      setEditingTheme(theme);
      setThemeForm({
        name: theme.name,
        active: theme.active
      });
    } else {
      setEditingTheme(null);
      setThemeForm({
        name: '',
        active: true
      });
    }
    setShowThemeModal(true);
  };

  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTheme) {
        await db.updateTheme(editingTheme.id, themeForm.name, themeForm.active);
        toast.success('Theme updated.');
      } else {
        await db.createTheme(themeForm.name);
        toast.success('New Theme created.');
      }
      setShowThemeModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      try {
        await db.deleteTheme(id);
        toast.success('Theme deleted.');
        await loadData();
      } catch (err: any) {
        toast.error(err.message || 'Deletion failed.');
      }
    }
  };

  // Settings Save
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(settingsForm.public_vote_weight) + Number(settingsForm.judge_score_weight) !== 100) {
      toast.error('The sum of Public Vote Weight and Judge Score Weight must equal 100%.');
      return;
    }

    try {
      await db.updateSettings(settingsForm);
      toast.success('Competition settings updated.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Settings update failed.');
    }
  };

  const filteredRegistered = registeredStudents.filter(r => {
    return r.name.toLowerCase().includes(registeredSearch.toLowerCase()) ||
           r.email.toLowerCase().includes(registeredSearch.toLowerCase());
  });

  const COLORS = ['#8b5cf6', '#d946ef', '#a78bfa', '#c084fc', '#818cf8', '#6366f1'];

  return (
    <div className="flex-grow bg-[#05030a] text-zinc-200 min-h-[90vh] flex flex-col lg:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full lg:w-64 bg-[#080512] border-b lg:border-b-0 lg:border-r border-white/[0.04] p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-violet-400">Admin Panel</span>
            <h2 className="text-base font-extrabold text-white truncate">Command Center</h2>
            <p className="text-[10px] text-zinc-500 font-mono">System Administrator</p>
          </div>

          <nav className="space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none gap-2 lg:gap-1">
            {[
              { id: 'leaderboard', label: 'Analytics & Standings', icon: BarChart3 },
              { id: 'registered_students', label: 'Registered Accounts', icon: ShieldCheck },
              { id: 'judges', label: 'Evaluators Database', icon: Briefcase },
              { id: 'themes', label: 'Themes & Tracks', icon: Award },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors w-full ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-6 border-t border-white/[0.04] hidden lg:block">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full py-2 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* CONTENT COCKPIT */}
      <main className="flex-grow p-8 sm:p-10 md:p-12 overflow-y-auto max-w-6xl">

        {/* TAB 1: LEADERBOARD & ANALYTICS */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Metrics Console</span>
              <h1 className="text-2xl font-extrabold text-white">Analytics & Leaderboard</h1>
            </div>

            {/* Live Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Accounts Registered', value: stats?.registered_students ?? 0, icon: ShieldCheck, color: 'text-emerald-400' },
                { label: 'Submissions Uploaded', value: stats?.total_videos ?? 0, icon: Video, color: 'text-violet-400' },
                { label: 'Public Votes Cast', value: stats?.total_votes ?? 0, icon: Vote, color: 'text-pink-400' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide block">{item.label}</span>
                    <span className="text-2xl font-bold text-white mt-1 block tracking-tight font-mono">{item.value}</span>
                  </div>
                  <item.icon className={`h-7 w-7 ${item.color} opacity-70`} />
                </div>
              ))}
            </div>

            {/* Charts Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard Chart */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4.5 w-4.5 text-violet-400" />
                  Top 5 Live Submissions Scores
                </h3>
                <div className="h-64">
                  {leaderboard.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getLeaderboardChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1c2c" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#09070f', border: '1px solid rgba(255,255,255,0.08)' }} labelClassName="text-white text-xs font-bold" />
                        <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                          {getLeaderboardChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-20">No submission score data available.</p>
                  )}
                </div>
              </div>

              {/* Theme Submissions */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="h-4.5 w-4.5 text-fuchsia-400" />
                  Theme Distribution
                </h3>
                <div className="h-64 flex items-center justify-center">
                  {getThemeChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getThemeChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getThemeChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#09070f', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#a1a1aa' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-20">No videos uploaded to active themes.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-amber-400" />
                Live Standings Board
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/[0.02] border-b border-white/[0.05] uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Rank</th>
                      <th className="py-3.5 px-4 font-bold">Video Title</th>
                      <th className="py-3.5 px-4 font-bold">Student Name</th>
                      <th className="py-3.5 px-4 font-bold">Theme Name</th>
                      <th className="py-3.5 px-4 font-bold text-center">Public Votes</th>
                      <th className="py-3.5 px-4 font-bold text-center">Avg Judge Score</th>
                      <th className="py-3.5 px-4 font-bold text-right">Weighted Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((row, index) => (
                        <tr key={row.id} className="hover:bg-white/[0.01]">
                          <td className="py-3.5 px-4 font-black text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text font-mono">
                            #{index + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">{row.title}</td>
                          <td className="py-3.5 px-4">{row.student_name}</td>
                          <td className="py-3.5 px-4">{row.theme_name}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-sky-400">{row.vote_count}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{row.avg_judge_score} / {settings?.judge_score_max || 100}</td>
                          <td className="py-3.5 px-4 text-right font-black text-white text-sm">{row.final_score}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">No entries submitted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REGISTERED ACCOUNTS */}
        {activeTab === 'registered_students' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Registered Accounts</span>
              <h1 className="text-2xl font-extrabold text-white">Registered Student Accounts</h1>
              <p className="text-xs text-zinc-400 font-light">List of students who have completed the portal registration flow. Deleting an account will clear credentials, submission, votes, and jury evaluations.</p>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center pb-4 border-b border-white/[0.05]">
                {/* Search Bar */}
                <div className="w-full sm:max-w-xs relative">
                  <input
                    type="text"
                    placeholder="Search registered accounts..."
                    value={registeredSearch}
                    onChange={(e) => setRegisteredSearch(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-primary/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none transition-all"
                  />
                  <div className="absolute left-3 top-2.5 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-semibold uppercase">
                  Total Registered: {filteredRegistered.length}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/[0.02] border-b border-white/[0.05] uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Student Name</th>
                      <th className="py-3.5 px-4 font-bold">Email</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRegistered.length > 0 ? (
                      filteredRegistered.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{row.name}</td>
                          <td className="py-3.5 px-4 text-zinc-400">{row.email}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRegisteredStudent(row.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete Registered Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-zinc-500 text-xs">
                          No registered accounts found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: JUDGES */}
        {activeTab === 'judges' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Evaluators</span>
              <h1 className="text-2xl font-extrabold text-white">Evaluators Database</h1>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4.5 w-4.5 text-violet-400" />
                  Active Jury Members
                </h3>
                <button
                  onClick={() => openJudgeModal()}
                  className="py-1.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Judge
                </button>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {judges.map(judge => (
                  <div key={judge.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{judge.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{judge.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        judge.active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {judge.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openJudgeModal(judge)}
                          className="p-1 hover:text-violet-400 text-zinc-500 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJudge(judge.id)}
                          className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THEMES */}
        {activeTab === 'themes' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Tracks</span>
              <h1 className="text-2xl font-extrabold text-white">Bootcamp Themes</h1>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-fuchsia-400" />
                  Active Creative Tracks
                </h3>
                <button
                  onClick={() => openThemeModal()}
                  className="py-1.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Theme
                </button>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {themes.map(theme => (
                  <div key={theme.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{theme.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        theme.active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {theme.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openThemeModal(theme)}
                          className="p-1 hover:text-violet-400 text-zinc-500 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMPETITION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Configuration</span>
              <h1 className="text-2xl font-extrabold text-white">System Settings</h1>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 max-w-3xl">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-white/[0.05] mb-6">
                <Calendar className="h-5 w-5 text-violet-400" />
                Timeline & Weightings configuration
              </h3>

              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Submission Deadline */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Submission Phase Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={settingsForm.submission_deadline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, submission_deadline: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  {/* Voting Deadline */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Voting Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={settingsForm.voting_deadline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, voting_deadline: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  {/* Max File Size */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Video File Size Limit (MB)</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      required
                      value={settingsForm.video_size_limit_mb}
                      onChange={(e) => setSettingsForm({ ...settingsForm, video_size_limit_mb: Number(e.target.value) })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  {/* Winner Count */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Winner Leaderboard Display Count</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={settingsForm.winner_count}
                      onChange={(e) => setSettingsForm({ ...settingsForm, winner_count: Number(e.target.value) })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Rubric Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.04]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Judge Score Rubric Minimum</label>
                    <input
                      type="number"
                      required
                      value={settingsForm.judge_score_min}
                      onChange={(e) => setSettingsForm({ ...settingsForm, judge_score_min: Number(e.target.value) })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Judge Score Rubric Maximum</label>
                    <input
                      type="number"
                      required
                      value={settingsForm.judge_score_max}
                      onChange={(e) => setSettingsForm({ ...settingsForm, judge_score_max: Number(e.target.value) })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Scoring Weights */}
                <div className="pt-4 border-t border-white/[0.04] space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scoring Weights (Sum must equal 100%)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Judge Evaluation Score Weight (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={settingsForm.judge_score_weight}
                        onChange={(e) => setSettingsForm({ ...settingsForm, judge_score_weight: Number(e.target.value) })}
                        className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Votes Weight (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={settingsForm.public_vote_weight}
                        onChange={(e) => setSettingsForm({ ...settingsForm, public_vote_weight: Number(e.target.value) })}
                        className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* save */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mt-4"
                >
                  <Settings className="h-4 w-4" />
                  Save Settings
                </button>
              </form>
            </div>
          </div>
        )}
        </main>




      {/* JUDGE CRUD MODAL */}
      {showJudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0b0818] border border-white/[0.08] w-full max-w-md rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingJudge ? 'Edit Judge details' : 'Add New Judge'}
            </h3>

            <form onSubmit={handleJudgeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Judge Name</label>
                <input
                  type="text"
                  required
                  value={judgeForm.name}
                  onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  value={judgeForm.email}
                  onChange={(e) => setJudgeForm({ ...judgeForm, email: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              {!editingJudge && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Login Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter login password"
                    value={judgeForm.password}
                    onChange={(e) => setJudgeForm({ ...judgeForm, password: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
              )}

              {editingJudge && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="judgeActive"
                    checked={judgeForm.active}
                    onChange={(e) => setJudgeForm({ ...judgeForm, active: e.target.checked })}
                    className="rounded bg-black border-white/10 text-violet-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="judgeActive" className="text-xs font-semibold text-zinc-300">
                    Active evaluator status
                  </label>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowJudgeModal(false)}
                  className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Save Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THEME CRUD MODAL */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0b0818] border border-white/[0.08] w-full max-w-sm rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingTheme ? 'Edit Theme' : 'Create New Theme'}
            </h3>

            <form onSubmit={handleThemeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Theme Name</label>
                <input
                  type="text"
                  required
                  value={themeForm.name}
                  onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              {editingTheme && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="themeActive"
                    checked={themeForm.active}
                    onChange={(e) => setThemeForm({ ...themeForm, active: e.target.checked })}
                    className="rounded bg-black border-white/10 text-violet-500 focus:ring-0"
                  />
                  <label htmlFor="themeActive" className="text-xs font-semibold text-zinc-300">
                    Active for submissions
                  </label>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Save Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
