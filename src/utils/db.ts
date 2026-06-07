// Database access layer supporting Supabase and interactive LocalStorage fallback
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock database initial state
const DEFAULT_JUDGES = [
  {
    id: 'j1',
    name: 'Dr. Sarah Jenkins',
    email: 'judge1@competition.com',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'j2',
    name: 'Prof. Alan Turing',
    email: 'judge2@competition.com',
    active: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_THEMES = [
  { id: 't1', name: 'Future of AI', active: true, created_at: new Date().toISOString() },
  { id: 't2', name: 'Smart India', active: true, created_at: new Date().toISOString() },
  { id: 't3', name: 'AI for Education', active: true, created_at: new Date().toISOString() }
];

const DEFAULT_SETTINGS = {
  id: 1,
  submission_deadline: '2026-06-07T20:30:00',
  voting_deadline: '2026-06-08T08:30:00',
  video_size_limit_mb: 50,
  judge_score_min: 1,
  judge_score_max: 100,
  winner_count: 3,
  public_vote_weight: 30,
  judge_score_weight: 70,
  custom_field_definitions: [] as string[]
};

const DEFAULT_STUDENT_PROFILES = [
  {
    id: 'std_1',
    name: 'Alice Johnson',
    email: 'alice@student.com',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'std_2',
    name: 'Bob Smith',
    email: 'bob@student.com',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

const DEFAULT_USERS = [
  { id: 'admin_1', email: 'admin@competition.com', role: 'admin', password: 'admin123' },
  { id: 'j1', email: 'judge1@competition.com', role: 'judge', password: 'judge123' },
  { id: 'j2', email: 'judge2@competition.com', role: 'judge', password: 'judge223' },
  { id: 'std_1', email: 'alice@student.com', role: 'student', password: 'student123' },
  { id: 'std_2', email: 'bob@student.com', role: 'student', password: 'student123' }
];

const DEFAULT_SUBMISSIONS = [
  {
    id: 'sub_1',
    student_id: 'std_1',
    title: 'Genesis: The AI Awakening',
    theme_id: 't1',
    ai_stack: 'Runway Gen-2, Midjourney, Suno, ElevenLabs',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    cloudinary_public_id: 'gen_1',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'sub_2',
    student_id: 'std_2',
    title: 'Smart Classroom 2030',
    theme_id: 't3',
    ai_stack: 'Sora, Stable Diffusion, D-ID, ChatGPT',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
    cloudinary_public_id: 'gen_2',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const DEFAULT_VOTES = [
  {
    id: 'v_1',
    voter_student_id: 'std_2',
    submission_id: 'sub_1',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_JUDGE_SCORES = [
  {
    id: 'sc_1',
    judge_id: 'j1',
    submission_id: 'sub_1',
    score: 88,
    comments: 'Cinematic layout is stunning. Seamless AI voice synthesis.',
    created_at: new Date().toISOString()
  },
  {
    id: 'sc_2',
    judge_id: 'j2',
    submission_id: 'sub_1',
    score: 92,
    comments: 'Excellent prompt mastery and flow. Masterfully done!',
    created_at: new Date().toISOString()
  },
  {
    id: 'sc_3',
    judge_id: 'j1',
    submission_id: 'sub_2',
    score: 75,
    comments: 'Good graphics and editing. Voice has slight robotic artifacts.',
    created_at: new Date().toISOString()
  }
];

// Helper for client-side storage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const db = {
  // CONFIGURATION SETTINGS
  async getSettings() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('competition_settings').select('*').eq('id', 1).maybeSingle();
      if (!error && data) return data;
    }
    return getStorageItem('comp_settings', DEFAULT_SETTINGS);
  },

  async updateSettings(settings: Partial<typeof DEFAULT_SETTINGS>) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('competition_settings').update(settings).eq('id', 1).select().maybeSingle();
      if (!error && data) return data;
    }
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setStorageItem('comp_settings', updated);
    return updated;
  },

  // THEMES
  async getThemes() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return getStorageItem('comp_themes', DEFAULT_THEMES);
  },

  async createTheme(name: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('themes').insert({ name, active: true }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const themes = await this.getThemes();
    if (themes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Theme name already exists.');
    }
    const newTheme = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      active: true,
      created_at: new Date().toISOString()
    };
    themes.push(newTheme);
    setStorageItem('comp_themes', themes);
    return newTheme;
  },

  async updateTheme(id: string, name: string, active: boolean) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('themes').update({ name, active }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const themes = await this.getThemes();
    const idx = themes.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Theme not found.');
    themes[idx] = { ...themes[idx], name, active };
    setStorageItem('comp_themes', themes);
    return themes[idx];
  },

  async deleteTheme(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('themes').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const themes = await this.getThemes();
    const updated = themes.filter(t => t.id !== id);
    setStorageItem('comp_themes', updated);
    return true;
  },

  async getRegisteredStudents() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('student_profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getStorageItem<any[]>('comp_student_profiles', DEFAULT_STUDENT_PROFILES);
  },

  async deleteRegisteredStudent(studentId: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('student_profiles').delete().eq('id', studentId);
      if (error) throw new Error(error.message);
      return true;
    }
    const profiles = getStorageItem<any[]>('comp_student_profiles', DEFAULT_STUDENT_PROFILES);
    const updatedProfiles = profiles.filter(p => p.id !== studentId);
    setStorageItem('comp_student_profiles', updatedProfiles);

    const users = getStorageItem<any[]>('comp_users', DEFAULT_USERS);
    const updatedUsers = users.filter(u => u.id !== studentId);
    setStorageItem('comp_users', updatedUsers);

    const submissions = getStorageItem<any[]>('comp_submissions', []);
    const submission = submissions.find(s => s.student_id === studentId);
    const updatedSubmissions = submissions.filter(s => s.student_id !== studentId);
    setStorageItem('comp_submissions', updatedSubmissions);

    const votes = getStorageItem<any[]>('comp_votes', []);
    let updatedVotes = votes.filter(v => v.voter_student_id !== studentId);

    if (submission) {
      updatedVotes = updatedVotes.filter(v => v.submission_id !== submission.id);
      
      const scores = getStorageItem<any[]>('comp_judge_scores', []);
      const updatedScores = scores.filter(sc => sc.submission_id !== submission.id);
      setStorageItem('comp_judge_scores', updatedScores);
    }
    setStorageItem('comp_votes', updatedVotes);
    return true;
  },

  // JUDGES
  async getJudges() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('judges').select('*').order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return getStorageItem('comp_judges', DEFAULT_JUDGES);
  },

  async addJudge(judge: { name: string; email: string; password?: string }) {
    if (isSupabaseConfigured && supabase) {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: judge.email,
        password: judge.password || 'judge123',
        options: {
          data: {
            role: 'judge',
            name: judge.name
          }
        }
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create judge auth user.');

      const { data: judgeData, error: judgeError } = await supabase.from('judges').insert({
        id: authData.user.id,
        name: judge.name,
        email: judge.email,
        active: true
      }).select().single();

      if (judgeError) throw new Error(judgeError.message);
      return judgeData;
    }

    const list = await this.getJudges();
    if (list.some(j => j.email.toLowerCase() === judge.email.toLowerCase())) {
      throw new Error('Judge email already exists.');
    }
    const newJudgeId = 'j_' + Math.random().toString(36).substring(2, 9);
    
    const users = getStorageItem<any[]>('comp_users', DEFAULT_USERS);
    users.push({
      id: newJudgeId,
      email: judge.email,
      role: 'judge',
      password: judge.password || 'judge123'
    });
    setStorageItem('comp_users', users);

    const newJudge = {
      id: newJudgeId,
      name: judge.name,
      email: judge.email,
      active: true,
      created_at: new Date().toISOString()
    };
    list.push(newJudge);
    setStorageItem('comp_judges', list);
    return newJudge;
  },

  async updateJudge(id: string, name: string, email: string, active: boolean) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('judges').update({ name, email, active }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const list = await this.getJudges();
    const idx = list.findIndex(j => j.id === id);
    if (idx === -1) throw new Error('Judge not found.');
    list[idx] = { ...list[idx], name, email, active };
    setStorageItem('comp_judges', list);

    const users = getStorageItem<any[]>('comp_users', DEFAULT_USERS);
    const uIdx = users.findIndex(u => u.id === id);
    if (uIdx !== -1) {
      users[uIdx].email = email;
      setStorageItem('comp_users', users);
    }

    return list[idx];
  },

  async deleteJudge(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('judges').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }

    const list = await this.getJudges();
    const updatedList = list.filter(j => j.id !== id);
    setStorageItem('comp_judges', updatedList);

    const users = getStorageItem<any[]>('comp_users', DEFAULT_USERS);
    const updatedUsers = users.filter(u => u.id !== id);
    setStorageItem('comp_users', updatedUsers);

    const scores = getStorageItem<any[]>('comp_judge_scores', []);
    const updatedScores = scores.filter(s => s.judge_id !== id);
    setStorageItem('comp_judge_scores', updatedScores);

    return true;
  },

  // SUBMISSIONS
  async getSubmissions() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').select('*');
      if (!error && data) return data;
    }
    return getStorageItem<any[]>('comp_submissions', DEFAULT_SUBMISSIONS);
  },

  async getSubmissionByStudent(studentId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').select('*').eq('student_id', studentId).maybeSingle();
      if (!error && data) return data;
      return null;
    }
    const submissions = await this.getSubmissions();
    return submissions.find(s => s.student_id === studentId) || null;
  },

  async addSubmission(submission: {
    student_id: string;
    title: string;
    theme_id: string;
    ai_stack: string;
    video_url: string;
    thumbnail_url: string;
    cloudinary_public_id: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').insert(submission).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const existing = await this.getSubmissionByStudent(submission.student_id);
    if (existing) {
      throw new Error('Student has already submitted a video. Submissions are capped at 1.');
    }

    const newSubmission = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      ...submission,
      created_at: new Date().toISOString()
    };
    
    const submissions = await this.getSubmissions();
    submissions.push(newSubmission);
    setStorageItem('comp_submissions', submissions);
    return newSubmission;
  },

  // VOTING
  async getVotes() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('votes').select('*');
      if (!error && data) return data;
    }
    return getStorageItem<any[]>('comp_votes', DEFAULT_VOTES);
  },

  async getVoteByStudent(studentId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('votes').select('*').eq('voter_student_id', studentId).maybeSingle();
      if (!error && data) return data;
      return null;
    }
    const votes = await this.getVotes();
    return votes.find(v => v.voter_student_id === studentId) || null;
  },

  async castVote(voterStudentId: string, submissionId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('votes').insert({
        voter_student_id: voterStudentId,
        submission_id: submissionId
      }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const votes = await this.getVotes();
    
    const existing = votes.find(v => v.voter_student_id === voterStudentId);
    if (existing) {
      throw new Error('You have already cast your vote. Votes are limited to one per student and cannot be changed.');
    }

    const settings = await this.getSettings();
    if (new Date() > new Date(settings.voting_deadline)) {
      throw new Error('Voting deadline has passed.');
    }

    const newVote = {
      id: 'vote_' + Math.random().toString(36).substring(2, 9),
      voter_student_id: voterStudentId,
      submission_id: submissionId,
      created_at: new Date().toISOString()
    };
    votes.push(newVote);
    setStorageItem('comp_votes', votes);
    return newVote;
  },

  // JUDGE SCORING
  async getJudgeScores() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('judge_scores').select('*');
      if (!error && data) return data;
    }
    return getStorageItem<any[]>('comp_judge_scores', DEFAULT_JUDGE_SCORES);
  },

  async addJudgeScore(judgeId: string, submissionId: string, score: number, comments: string) {
    const settings = await this.getSettings();
    if (score < settings.judge_score_min || score > settings.judge_score_max) {
      throw new Error(`Score must be between ${settings.judge_score_min} and ${settings.judge_score_max}.`);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('judge_scores').upsert({
        judge_id: judgeId,
        submission_id: submissionId,
        score,
        comments
      }, { onConflict: 'judge_id,submission_id' }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const scores = await this.getJudgeScores();
    const idx = scores.findIndex(s => s.judge_id === judgeId && s.submission_id === submissionId);
    
    const newScore = {
      judge_id: judgeId,
      submission_id: submissionId,
      score,
      comments,
      created_at: new Date().toISOString()
    };

    if (idx !== -1) {
      scores[idx] = newScore;
    } else {
      scores.push({
        id: 'score_' + Math.random().toString(36).substring(2, 9),
        ...newScore
      });
    }

    setStorageItem('comp_judge_scores', scores);
    return newScore;
  },

  // LEADERBOARD & RANKINGS
  async getLeaderboard() {
    const submissions = await this.getSubmissions();
    const votes = await this.getVotes();
    const judgeScores = await this.getJudgeScores();
    const settings = await this.getSettings();
    const profiles = await this.getRegisteredStudents();
    const themes = await this.getThemes();

    const votesMap: Record<string, number> = {};
    votes.forEach(v => {
      votesMap[v.submission_id] = (votesMap[v.submission_id] || 0) + 1;
    });

    const judgeScoresMap: Record<string, { total: number; count: number }> = {};
    judgeScores.forEach(js => {
      if (!judgeScoresMap[js.submission_id]) {
        judgeScoresMap[js.submission_id] = { total: 0, count: 0 };
      }
      judgeScoresMap[js.submission_id].total += Number(js.score);
      judgeScoresMap[js.submission_id].count += 1;
    });

    const maxVotes = Math.max(...Object.values(votesMap), 1);
    const maxJudgeScore = settings.judge_score_max;

    const scoredSubmissions = submissions.map(sub => {
      const student = profiles.find(p => p.id === sub.student_id);
      const theme = themes.find(t => t.id === sub.theme_id);
      
      const voteCount = votesMap[sub.id] || 0;
      const normalizedPublicScore = (voteCount / maxVotes) * 100;

      const js = judgeScoresMap[sub.id];
      const avgJudgeScore = js ? (js.total / js.count) : 0;
      const normalizedJudgeScore = (avgJudgeScore / maxJudgeScore) * 100;

      const finalScore = (
        (normalizedJudgeScore * settings.judge_score_weight) +
        (normalizedPublicScore * settings.public_vote_weight)
      ) / 100;

      return {
        ...sub,
        student_name: student ? student.name : 'Unknown Student',
        theme_name: theme ? theme.name : 'Unknown Theme',
        vote_count: voteCount,
        avg_judge_score: avgJudgeScore.toFixed(1),
        judge_score_count: js ? js.count : 0,
        final_score: finalScore.toFixed(2)
      };
    });

    return scoredSubmissions.sort((a, b) => Number(b.final_score) - Number(a.final_score));
  },

  // AUTHENTICATION
  async getCurrentUser() {
    if (isSupabaseConfigured && supabase) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return null;
      const user = session.user;

      const { data: publicUser } = await supabase.from('users').select('role').eq('id', user.id).single();
      const role = publicUser?.role || 'student';
      let detailedUser: any = { id: user.id, email: user.email, role };

      if (role === 'student') {
        const { data: profile } = await supabase.from('student_profiles').select('*').eq('id', user.id).single();
        if (profile) detailedUser = { ...detailedUser, ...profile };
      } else if (role === 'judge') {
        const { data: judge } = await supabase.from('judges').select('*').eq('id', user.id).single();
        if (judge) detailedUser = { ...detailedUser, name: judge.name };
      }
      return detailedUser;
    }

    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('comp_session');
    if (!session) return null;
    try {
      const user = JSON.parse(session);
      
      if (user.role === 'student') {
        const profiles = getStorageItem<any[]>('comp_student_profiles', DEFAULT_STUDENT_PROFILES);
        const profile = profiles.find(p => p.id === user.id);
        if (profile) return { ...user, ...profile };
      } else if (user.role === 'judge') {
        const judges = await this.getJudges();
        const judge = judges.find(j => j.id === user.id);
        if (judge) return { ...user, name: judge.name };
      }
      return user;
    } catch {
      return null;
    }
  },

  async login(email: string, passwordHash: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordHash
      });
      if (error) throw new Error(error.message);
      return { id: data.user.id, email: data.user.email };
    }

    const users = getStorageItem<any[]>('comp_users', [
      { id: 'admin_1', email: 'admin@competition.com', role: 'admin', password: 'admin123' },
      { id: 'j1', email: 'judge1@competition.com', role: 'judge', password: 'judge123' },
      { id: 'j2', email: 'judge2@competition.com', role: 'judge', password: 'judge223' }
    ]);

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.password !== passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const sessionUser = { id: user.id, email: user.email, role: user.role };
    setStorageItem('comp_session', sessionUser);
    return sessionUser;
  },

  async registerStudent(studentData: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: studentData.email,
        password: studentData.passwordHash,
        options: {
          data: {
            role: 'student',
            name: studentData.name
          }
        }
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Registration failed.');

      const { error: profileError } = await supabase.from('student_profiles').insert({
        id: data.user.id,
        name: studentData.name,
        email: studentData.email
      });
      if (profileError) {
        console.error('Failed to create student profile row:', profileError);
      }
      return { id: data.user.id, name: studentData.name, email: studentData.email };
    }

    const users = getStorageItem<any[]>('comp_users', DEFAULT_USERS);
    if (users.some(u => u.email.toLowerCase() === studentData.email.toLowerCase())) {
      throw new Error('An account has already been registered with this email.');
    }

    const studentId = 'std_' + Math.random().toString(36).substring(2, 9);

    users.push({
      id: studentId,
      email: studentData.email,
      role: 'student',
      password: studentData.passwordHash
    });
    setStorageItem('comp_users', users);

    const profiles = getStorageItem<any[]>('comp_student_profiles', DEFAULT_STUDENT_PROFILES);
    const newProfile = {
      id: studentId,
      name: studentData.name,
      email: studentData.email,
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    setStorageItem('comp_student_profiles', profiles);

    const sessionUser = { id: studentId, email: studentData.email, role: 'student' };
    setStorageItem('comp_session', sessionUser);

    return newProfile;
  },

  async logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('comp_session');
    }
  },

  async resetPassword(email: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
      return true;
    }

    const users = getStorageItem<any[]>('comp_users', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('No user registered with this email address.');
    }
    return true;
  },

  // STATS
  async getStats() {
    const profiles = await this.getRegisteredStudents();
    const judges = await this.getJudges();
    const submissions = await this.getSubmissions();
    const votes = await this.getVotes();
    const themes = await this.getThemes();
    const settings = await this.getSettings();

    const isSubmissionActive = new Date() <= new Date(settings.submission_deadline);
    const isVotingActive = new Date() <= new Date(settings.voting_deadline);

    let status = 'Upcoming';
    if (isSubmissionActive) {
      status = 'Submission Phase Open';
    } else if (isVotingActive) {
      status = 'Voting Phase Open';
    } else {
      status = 'Competition Closed';
    }

    return {
      registered_students: profiles.length,
      total_judges: judges.filter(j => j.active).length,
      total_videos: submissions.length,
      total_votes: votes.length,
      active_themes: themes.filter(t => t.active).length,
      competition_status: status
    };
  }
};
