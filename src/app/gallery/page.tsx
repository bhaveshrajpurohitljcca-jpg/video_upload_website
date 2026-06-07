'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/utils/db';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';
import { Search, Filter, Vote, Play, Clock, Award, X, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GalleryPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('votes');
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  
  // Voting states
  const [studentVotes, setStudentVotes] = useState<any[]>([]);
  const [ratingStars, setRatingStars] = useState<number>(5);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadGalleryData = async () => {
    try {
      const leader = await db.getLeaderboard();
      setSubmissions(leader);
      const allThemes = await db.getThemes();
      setThemes(allThemes.filter(t => t.active));

      if (user && user.role === 'student') {
        const votes = await db.getVotesByStudent(user.id);
        setStudentVotes(votes);
      }
    } catch (err) {
      console.error('Failed to load gallery data:', err);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, [user]);

  const handleVote = async (submissionId: string, stars: number) => {
    if (!user) {
      toast.error('You must sign in as a student to rate.');
      return;
    }
    if (user.role !== 'student') {
      toast.error('Only registered students can participate in public voting.');
      return;
    }

    try {
      await db.castVote(user.id, submissionId, stars);
      toast.success('Your rating has been submitted successfully!');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 }
      });

      await loadGalleryData();
      
      // Update selected video details in modal
      const updatedList = await db.getLeaderboard();
      const updatedVideo = updatedList.find(s => s.id === submissionId);
      if (updatedVideo) {
        setSelectedVideo({
          ...updatedVideo,
          student_name: updatedVideo.student_name,
          theme_name: updatedVideo.theme_name
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating.');
    }
  };

  // Sort & Filter Logic
  const getSortedAndFilteredSubmissions = () => {
    let list = [...submissions];

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        sub =>
          sub.title.toLowerCase().includes(query) ||
          sub.student_name.toLowerCase().includes(query) ||
          sub.ai_stack.toLowerCase().includes(query)
      );
    }

    // Theme filter
    if (selectedTheme !== 'all') {
      list = list.filter(sub => sub.theme_id === selectedTheme);
    }

    // Sort order
    if (sortBy === 'votes') {
      list.sort((a, b) => b.total_points - a.total_points);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  };

  const filteredSubmissions = getSortedAndFilteredSubmissions();

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-grow bg-[#07050f] text-zinc-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-12">
        
        {/* Title */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            Bootcamp Gallery
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore Creations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
            Browse short film submissions designed by college students. Register to cast your vote for the most creative video design.
          </p>
        </div>

        {/* Search, Filter & Sort Section */}
        <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-6">
          
          {/* Left: Search input */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by title, student, stack..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-primary/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none transition-all"
            />
          </div>

          {/* Right: Theme Filter & Sort order selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            {/* Theme Filter Dropdown */}
            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={selectedTheme}
                onChange={(e) => {
                  setSelectedTheme(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer appearance-none pr-8 font-semibold"
              >
                <option value="all" className="bg-[#090614]">All Tracks</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id} className="bg-[#090614]">{theme.name}</option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Sort Order Selector */}
            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer appearance-none pr-8 font-semibold"
              >
                <option value="newest" className="bg-[#090614]">Sort by Newest</option>
                <option value="votes" className="bg-[#090614]">Sort by Top Voted</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Gallery Behance-Style Grid */}
        {currentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentItems.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedVideo(sub)}
                className="group bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-all hover:bg-white/[0.02] flex flex-col justify-between cursor-pointer"
              >
                {/* Image Thumbnail */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                  <img
                    src={sub.thumbnail_url}
                    alt={sub.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-5 w-5 fill-black ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-semibold text-zinc-300 tracking-wide border border-white/5 uppercase">
                    {sub.theme_name}
                  </span>
                </div>

                {/* Details Box */}
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors leading-snug truncate">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      By <span className="text-zinc-300 font-semibold">{sub.student_name}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      {formatDate(sub.created_at)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 border border-violet-500/20 text-violet-400 font-bold">
                      ★ {sub.total_points || 0} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
            <p className="text-zinc-500 text-xs font-light">No submissions matched your search filters.</p>
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Video Modal Player (Behance Overlay style) */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b0818] w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative border border-white/[0.08] flex flex-col md:flex-row">
            
            {/* Close */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 border border-white/10 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Video Player (60% width) */}
            <div className="w-full md:w-[60%] bg-black flex items-center justify-center aspect-video md:aspect-auto">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full h-full max-h-[480px] object-contain"
              />
            </div>

            {/* details Sidebar (40% width) */}
            <div className="w-full md:w-[40%] p-6 sm:p-8 flex flex-col justify-between bg-[#0e0a20] border-l border-white/[0.04]">
              <div className="space-y-6">
                <div>
                  <span className="bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded text-[9px] font-bold text-primary uppercase tracking-wide">
                    {selectedVideo.theme_name}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-3 leading-snug">
                    {selectedVideo.title}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Created by: <span className="font-semibold text-zinc-200">{selectedVideo.student_name}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI Stack tools</h4>
                  <p className="text-xs text-zinc-300 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 leading-relaxed font-light">
                    {selectedVideo.ai_stack}
                  </p>
                </div>

                <div className="flex items-center text-[10px] text-zinc-500">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Uploaded on {formatDate(selectedVideo.created_at)}
                </div>
              </div>

              {/* Voting box */}
              <div className="pt-6 border-t border-white/[0.05] mt-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-semibold">Total Points Score</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full animate-pulse">
                    ★ {selectedVideo.total_points || 0} pts
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-500 border-t border-white/[0.03] pt-2">
                  <div>Student Stars: {selectedVideo.student_stars || 0} (×10 pts)</div>
                  <div>Judge Stars: {selectedVideo.judge_stars || 0} (×30)</div>
                </div>

                {user ? (
                  user.role === 'student' ? (
                    (() => {
                      const existingVote = studentVotes.find(v => v.submission_id === selectedVideo.id);
                      if (existingVote) {
                        return (
                          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-center text-xs font-bold text-emerald-400">
                            ✓ You rated this video: {existingVote.stars} ★
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingStars(star)}
                                className="text-2xl transition-transform hover:scale-120 focus:outline-none"
                              >
                                <span className={star <= ratingStars ? 'text-amber-400' : 'text-zinc-600'}>★</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleVote(selectedVideo.id, ratingStars)}
                            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs flex items-center justify-center gap-1.5 transition-all font-bold rounded-xl"
                          >
                            Submit Star Rating ({ratingStars * 10} pts)
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 text-center text-xs text-zinc-500">
                      Evaluator Role ({user.role}) cannot rate in public gallery.
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                      Only logged-in student participants can cast votes.
                    </p>
                    <Link
                      href="/login"
                      className="w-full py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-center text-xs font-semibold rounded-xl block transition-colors"
                    >
                      Sign In to Vote
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
