'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { toast } from '@/components/ui/toast';
import { 
  User, Video, Award, Clock, FileText, CheckCircle2, 
  Upload, Trash2, ShieldAlert, Sparkles, LogOut, Eye,
  LayoutDashboard, ClipboardList, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Navigation: 'dashboard' | 'submission' | 'vote' | 'profile'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submission' | 'vote' | 'profile'>('dashboard');

  // Settings & DB states
  const [settings, setSettings] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any | null>(null);
  const [voteRecords, setVoteRecords] = useState<any[]>([]);
  
  // Upload form states
  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('');
  const [aiStack, setAiStack] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  
  // Loading & validation states
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'student') {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const currentSettings = await db.getSettings();
        setSettings(currentSettings);
        const allThemes = await db.getThemes();
        setThemes(allThemes.filter(t => t.active));
        
        const sub = await db.getSubmissionByStudent(user.id);
        setSubmission(sub);
        
        const votes = await db.getVotesByStudent(user.id);
        setVoteRecords(votes);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      }
    }
    loadData();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const limitMb = settings?.video_size_limit_mb || 50;
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > limitMb) {
      toast.error(`File size (${sizeInMb.toFixed(1)} MB) exceeds the limit of ${limitMb} MB.`);
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(objectUrl);
    setShowPreview(false);

    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration > 120) {
        toast.error(`Video duration (${tempVideo.duration.toFixed(1)}s) exceeds the 2-minute limit.`);
        setVideoFile(null);
        setVideoPreviewUrl('');
        e.target.value = '';
      }
    };
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !themeId || !aiStack || !videoFile) {
      toast.error('Please fill in all details and choose a video file.');
      return;
    }
    setShowPreview(true);
  };

  const confirmUpload = async () => {
    setUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
      const isCloudinaryConfigured = 
        cloudName.trim() !== '' && 
        uploadPreset.trim() !== '' &&
        cloudName !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
        uploadPreset !== 'YOUR_UNSIGNED_UPLOAD_PRESET_NAME';

      let videoUrl = '';
      let cloudinaryPublicId = '';
      let thumbnailUrl = '';

      if (isCloudinaryConfigured) {
        const formData = new FormData();
        formData.append('file', videoFile!);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || 'Cloudinary upload failed.');
        }

        const data = await response.json();
        videoUrl = data.secure_url;
        cloudinaryPublicId = data.public_id;
        thumbnailUrl = data.secure_url.replace(/\.[^/.]+$/, '.jpg');
      } else {
        // Fallback mock upload
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const stockVideos = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        ];
        const randomStockVideo = stockVideos[Math.floor(Math.random() * stockVideos.length)];
        videoUrl = videoPreviewUrl || randomStockVideo;

        const stockThumbs = [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80'
        ];
        thumbnailUrl = stockThumbs[Math.floor(Math.random() * stockThumbs.length)];
        cloudinaryPublicId = 'cloudinary_mock_' + Math.random().toString(36).substring(2, 9);
      }

      const sub = await db.addSubmission({
        student_id: user.id,
        title,
        theme_id: themeId,
        ai_stack: aiStack,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        cloudinary_public_id: cloudinaryPublicId
      });

      setSubmission(sub);
      setUploading(false);
      setShowPreview(false);
      toast.success('Video submitted successfully! One submission cap applied.');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      setUploading(false);
      toast.error(err.message || 'Submission failed.');
    }
  };

  const getThemeName = (tId: string) => {
    return themes.find(t => t.id === tId)?.name || 'Unknown Theme';
  };

  const isDeadlinePassed = () => {
    if (!settings) return false;
    return new Date() > new Date(settings.submission_deadline);
  };

  if (!user) return null;

  return (
    <div className="flex-grow bg-[#05030a] text-zinc-200 min-h-[90vh] flex flex-col lg:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full lg:w-64 bg-[#080512] border-b lg:border-b-0 lg:border-r border-white/[0.04] p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* User mini status */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-violet-400">Student Portal</span>
            <h2 className="text-base font-extrabold text-white truncate">{user.name}</h2>
            <p className="text-[10px] text-zinc-500 font-mono">{user.email}</p>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none gap-2 lg:gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'submission', label: 'My Submission', icon: Video },
              { id: 'vote', label: 'Cast Public Vote', icon: Award },
              { id: 'profile', label: 'My Profile', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors w-full ${
                  activeTab === tab.id
                    ? 'bg-violet-600/15 text-violet-400'
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

      {/* CONTENT Cockpit */}
      <main className="flex-1 p-8 sm:p-10 md:p-12 overflow-y-auto max-w-5xl">
        
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Overview</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Bootcamp Workspace</h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-light">Welcome to the AI Powered Content Creators Bootcamp dashboard. Track project statuses below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission task card */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Submission Stage</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Video Project</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    submission 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  }`}>
                    {submission ? 'Submitted' : 'Pending Upload'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  {submission 
                    ? `You successfully submitted "${submission.title}". One submission limit is active.` 
                    : 'Upload your short film project details before the configured deadline closes.'}
                </p>
                {!submission && (
                  <button 
                    onClick={() => setActiveTab('submission')}
                    className="py-1.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Go to Upload Form
                  </button>
                )}
              </div>

              {/* Vote status card */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Jury & Peer Review</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Public Star Ratings</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    voteRecords.length > 0 
                      ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' 
                      : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-400'
                  }`}>
                    {voteRecords.length > 0 ? `${voteRecords.length} Rated` : 'No Ratings'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  {voteRecords.length > 0 
                    ? `You have rated ${voteRecords.length} video projects in the gallery index.` 
                    : 'Explore the student submissions gallery to discover creative ideas and rate multiple entries.'}
                </p>
                <Link 
                  href="/gallery" 
                  className="py-1.5 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-colors inline-block text-center"
                >
                  Browse Gallery
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY SUBMISSION / UPLOAD FORM */}
        {activeTab === 'submission' && (
          <div className="space-y-8 animate-fade-in">
            {submission ? (
              /* Already submitted UI */
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-400">Submission Details</span>
                  <h1 className="text-2xl font-extrabold text-white">Project Registration details</h1>
                </div>

                <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-6">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.05]">
                    <video src={submission.video_url} controls className="w-full h-full object-contain" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Title</span>
                        <span className="text-sm font-bold text-white block mt-1">{submission.title}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Theme track</span>
                        <span className="text-zinc-200 font-medium block mt-1">{getThemeName(submission.theme_id)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">AI Stack used</span>
                        <p className="text-zinc-300 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 mt-1 leading-relaxed">
                          {submission.ai_stack}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex gap-3 items-start">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                      <strong>Submission Locked:</strong> Once verified, project uploads are locked and cannot be replaced or deleted. Contact administrators for registration overrides.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* No submission: Upload Form page */
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-400">Upload Portal</span>
                  <h1 className="text-2xl font-extrabold text-white">Submit Video Entry</h1>
                  <p className="text-xs text-zinc-400 font-light">Confirm guidelines and details before triggering the final upload procedure.</p>
                </div>

                {isDeadlinePassed() ? (
                  <div className="text-center py-12 bg-red-950/5 border border-red-500/20 rounded-2xl space-y-3">
                    <ShieldAlert className="h-8 w-8 text-red-500 mx-auto" />
                    <h3 className="text-sm font-bold text-red-400">Submission Timeline Closed</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto font-light leading-relaxed">
                      The competition deadline has passed. Submissions are no longer accepted.
                    </p>
                  </div>
                ) : (
                  <>
                    {showPreview ? (
                      /* Preview Confirmation State */
                      <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6">
                        <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-zinc-300 leading-relaxed font-light">
                          <strong>Confirmation:</strong> Review the project details and video file. Once you click "Confirm Final Upload", the submission is locked.
                        </div>

                        <div className="space-y-6">
                          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.08]">
                            <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                            <div className="space-y-4">
                              <div>
                                <span className="text-zinc-500 font-bold block">PROJECT TITLE</span>
                                <span className="text-sm font-bold text-white block mt-1">{title}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 font-bold block">THEME TRACK</span>
                                <span className="text-zinc-200 font-semibold block mt-1">{getThemeName(themeId)}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-bold block">AI STACK LIST</span>
                              <p className="text-zinc-300 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 mt-1 leading-relaxed">
                                {aiStack}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.04]">
                            <button
                              type="button"
                              onClick={() => setShowPreview(false)}
                              className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                            >
                              Back to Form
                            </button>
                            <button
                              type="button"
                              onClick={confirmUpload}
                              disabled={uploading}
                              className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              {uploading ? 'Uploading project...' : 'Confirm Final Upload'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Form Input State */
                      <form onSubmit={handleUploadSubmit} className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6">
                        
                        {/* Title */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Video Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Genesis: The AI Awakening"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all"
                          />
                        </div>

                        {/* Theme select */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Theme Category</label>
                          <select
                            required
                            value={themeId}
                            onChange={(e) => setThemeId(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-zinc-200 outline-none transition-all appearance-none bg-[#090614]"
                          >
                            <option value="">Select Theme</option>
                            {themes.map((theme) => (
                              <option key={theme.id} value={theme.id} className="bg-[#090614]">
                                {theme.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* AI Stack */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AI Stack Used</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="List all tools used (e.g. Midjourney v6, Runway Gen-2, ElevenLabs, Premiere Pro)"
                            value={aiStack}
                            onChange={(e) => setAiStack(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-violet-500/60 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all resize-none"
                          />
                        </div>

                        {/* Large drag and drop area */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Video File upload
                          </label>
                          <div className="relative border-2 border-dashed border-white/[0.08] hover:border-violet-500/35 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/[0.01]">
                            <input
                              type="file"
                              required
                              accept="video/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                            {videoFile ? (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-violet-400">{videoFile.name}</p>
                                <p className="text-[10px] text-zinc-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-zinc-300">Choose a video file or drag here</p>
                                <p className="text-[10px] text-zinc-500 font-light">MP4 or WebM formats capped at {settings?.video_size_limit_mb ?? 50} MB (Max 2 Mins)</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mt-4"
                        >
                          <Eye className="h-4 w-4" />
                          Preview Submission details
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CAST PUBLIC VOTE */}
        {activeTab === 'vote' && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-violet-400">Jury Portal</span>
              <h1 className="text-2xl font-extrabold text-white">Cast Public Vote</h1>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6">
              {voteRecords.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-zinc-300 leading-relaxed font-light">
                    <strong>Multiple Ratings Allowed:</strong> You can rate multiple different videos in the Gallery using the star system (1-5 stars).
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Rated Videos</h3>
                    <div className="divide-y divide-white/[0.04] space-y-3">
                      {voteRecords.map((voteRecord) => (
                        <div key={voteRecord.id} className="flex justify-between items-center pt-3 text-xs">
                          <div>
                            <span className="text-zinc-500 font-mono text-[10px] block">RATED ON: {new Date(voteRecord.created_at).toLocaleDateString()}</span>
                            <span className="font-semibold text-zinc-200">Video ID: {voteRecord.submission_id}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            {voteRecord.stars} ★
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link 
                      href="/gallery" 
                      className="py-2.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl inline-block"
                    >
                      Rate More Videos in Gallery
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    You have not rated any video projects yet. Choose a video project in the gallery index page and give it a star rating (1-5 stars).
                  </p>
                  <Link 
                    href="/gallery" 
                    className="py-2.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl inline-block"
                  >
                    Go to Gallery
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-violet-400">Settings</span>
              <h1 className="text-2xl font-extrabold text-white">My Profile</h1>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Full Name</span>
                  <span className="text-sm font-bold text-zinc-200 block mt-1">{user.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Email Address</span>
                  <span className="text-sm font-bold text-zinc-200 block mt-1">{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
