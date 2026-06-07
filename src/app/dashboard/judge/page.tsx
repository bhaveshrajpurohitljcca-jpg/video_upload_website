'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { toast } from '@/components/ui/toast';
import { 
  Award, Play, Clock, Sparkles, LogOut, CheckCircle, 
  MessageSquare, Star, Film, Sliders, ChevronRight
} from 'lucide-react';

export default function JudgeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // States
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  
  // Scoring inputs
  const [score, setScore] = useState<number>(50);
  const [comments, setComments] = useState('');
  const [judgeScores, setJudgeScores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadDashboardData = async () => {
    try {
      const leader = await db.getLeaderboard();
      const sorted = [...leader].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSubmissions(sorted);
      
      const themesData = await db.getThemes();
      setThemes(themesData);
      
      const compSettings = await db.getSettings();
      setSettings(compSettings);
      
      const allScores = await db.getJudgeScores();
      const scores = allScores.filter(s => s.judge_id === user.id);
      setJudgeScores(scores);

      // Default the slider to midpoint of the configured range
      const mid = Math.round((compSettings.judge_score_min + compSettings.judge_score_max) / 2);
      setScore(mid);
    } catch (err) {
      console.error('Failed to load judge dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'judge') {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  const selectSubmission = (sub: any) => {
    setSelectedSub(sub);
    const existingScore = judgeScores.find(js => js.submission_id === sub.id);
    if (existingScore) {
      setScore(Number(existingScore.score));
      setComments(existingScore.comments || '');
    } else {
      const mid = Math.round(((settings?.judge_score_min || 1) + (settings?.judge_score_max || 100)) / 2);
      setScore(mid);
      setComments('');
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSaving(true);
    try {
      await db.addJudgeScore(user.id, selectedSub.id, score, comments);
      toast.success(`Submission "${selectedSub.title}" scored successfully!`);
      
      await loadDashboardData();
      setSaving(false);
      
      // Update selected sub
      const leader = await db.getLeaderboard();
      const updatedSub = leader.find(s => s.id === selectedSub.id);
      if (updatedSub) {
        setSelectedSub({ ...updatedSub });
      }
    } catch (err: any) {
      setSaving(false);
      toast.error(err.message || 'Failed to submit score.');
    }
  };

  const getThemeName = (tId: string) => {
    return themes.find(t => t.id === tId)?.name || 'Unknown Theme';
  };

  const getSubScore = (subId: string) => {
    const js = judgeScores.find(s => s.submission_id === subId);
    return js ? js.score : null;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <div className="flex-grow bg-[#05030a] text-zinc-200 min-h-[90vh] flex flex-col font-sans">
      
      {/* Top Header bar */}
      <header className="bg-[#080512] border-b border-white/[0.04] py-4 px-6 sm:px-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Award className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Evaluation Cockpit</h1>
            <p className="text-[10px] text-zinc-500 font-light">Evaluator: {user.name || user.email}</p>
          </div>
        </div>

        <button
          onClick={() => { logout(); router.push('/'); }}
          className="py-1.5 px-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main Split panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: scrollable submissions checklist (35% width) */}
        <aside className="w-full lg:w-[32%] bg-[#06040d] border-b lg:border-b-0 lg:border-r border-white/[0.04] flex flex-col overflow-y-auto shrink-0 p-6">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Submitted Videos ({submissions.length})</span>
            
            <div className="space-y-2">
              {submissions.length > 0 ? (
                submissions.map((sub) => {
                  const hasScored = getSubScore(sub.id) !== null;
                  const isSelected = selectedSub?.id === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => selectSubmission(sub)}
                      className={`group rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                        isSelected 
                          ? 'border-violet-500 bg-violet-600/10' 
                          : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors leading-snug line-clamp-1">
                            {sub.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500">By {sub.student_name}</p>
                        </div>

                        {hasScored && (
                          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                            <Star className="h-3 w-3 fill-emerald-400" />
                            {getSubScore(sub.id)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-2 border-t border-white/[0.04]">
                        <span className="font-semibold text-violet-400/80 uppercase">{getThemeName(sub.theme_id)}</span>
                        <span>{formatDate(sub.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-500 text-xs py-8 text-center font-light">No submissions currently uploaded.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Right Side: evaluation workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto p-8 sm:p-10">
          {selectedSub ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
              
              {/* Left Column: Player & Meta (7 cols) */}
              <div className="xl:col-span-7 space-y-6">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
                  <video src={selectedSub.video_url} controls className="w-full h-full object-contain" />
                </div>

                <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
                  <div>
                    <span className="bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded text-[9px] font-bold text-violet-400 uppercase tracking-wide">
                      {getThemeName(selectedSub.theme_id)}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-3 leading-snug">{selectedSub.title}</h2>
                    <p className="text-xs text-zinc-400 mt-1">Creator: <span className="font-semibold text-zinc-200">{selectedSub.student_name}</span></p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Stack List</span>
                    <p className="text-xs text-zinc-300 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 leading-relaxed font-light">
                      {selectedSub.ai_stack}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Scoring panel (5 cols) */}
              <div className="xl:col-span-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Evaluation Sheet</span>
                  <h3 className="text-base font-bold text-white">Score Rubric Assessment</h3>
                </div>

                <form onSubmit={handleScoreSubmit} className="space-y-6">
                  {/* Slider Score */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Numeric Score ({settings?.judge_score_min || 1}-{settings?.judge_score_max || 100})
                      </label>
                      <span className="text-3xl font-black text-white font-mono leading-none">
                        {score}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={settings?.judge_score_min || 1}
                      max={settings?.judge_score_max || 100}
                      step={1}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold uppercase">
                      <span>MIN: {settings?.judge_score_min || 1}</span>
                      <span>MAX: {settings?.judge_score_max || 100}</span>
                    </div>
                  </div>

                  {/* Feedback comments */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Jury Comments</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Add constructive feedback on prompting styling, visual coherency, editing structure, and adherence to the track constraints..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {saving ? 'Saving score sheet...' : 'Submit Evaluation Score'}
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-white/[0.04] rounded-2xl max-w-xl mx-auto w-full my-12">
              <Film className="h-10 w-10 text-zinc-700 mb-3" />
              <h3 className="text-sm font-bold text-zinc-300">No Submission Selected</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1 font-light leading-relaxed">
                Choose a student video project from the left submissions pane to start playing the film and filling out the evaluation scorecard.
              </p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
