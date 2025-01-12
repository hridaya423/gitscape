/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, GitBranch, Star, BookOpen, Users, Calendar, Code, Globe, Link as LinkIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  size: number;
  default_branch: string;
  html_url: string;
}

interface CommitData {
  total: number;
  week: number;
  days: number[];
}

interface AnalyzerState {
  username: string;
  userData: GitHubUser | null;
  repoData: GitHubRepo[];
  commitData: CommitData[];
  totalLinesOfCode: number;
  loading: boolean;
  error: string | null;
}

const GitHubAnalyzer = ({ 
    onCapture,
    initialUsername,
    hideInput = false 
  }: { 
    onCapture?: () => void;
    initialUsername: string;
    hideInput?: boolean;
  }) => {
  const [state, setState] = useState<AnalyzerState>({
    username: initialUsername,
    userData: null,
    repoData: [],
    commitData: [],
    totalLinesOfCode: 0,
    loading: false,
    error: null
  });

  const containerRef = useRef(null);

  useEffect(() => {
    if (initialUsername) {
      fetchGitHubData();
    }
  }, []);

  const fetchWithRetry = async (url: string, headers: HeadersInit, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      const response = await fetch(url, { headers });
      if (response.status === 202) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      if (response.ok) {
        return response.json();
      }
    }
    return [];
  };
  

  const fetchGitHubData = async (): Promise<void> => {
    if (!state.username.trim()) return;
  
    setState(prev => ({ ...prev, loading: true, error: null }));
  
    try {
      const headers = {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      };
  
      const userResponse = await fetch(`https://api.github.com/users/${state.username}`, { headers });
      if (!userResponse.ok) throw new Error('User not found');
      const userData: GitHubUser = await userResponse.json();
  
      const reposResponse = await fetch(
        `https://api.github.com/users/${state.username}/repos?per_page=100&sort=updated`,
        { headers }
      );
      if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
      const repoData: GitHubRepo[] = await reposResponse.json();
  
      const totalLinesOfCode = repoData.reduce((sum, repo) => sum + (repo.size * 100), 0);
  
      const commitPromises = repoData.slice(0, 5).map(repo => 
        fetchWithRetry(
          `https://api.github.com/repos/${state.username}/${repo.name}/stats/commit_activity`,
          headers
        ).catch(() => [])
      );
  
      const commitDataArrays = await Promise.all(commitPromises);
      const mergedCommitData = mergeCommitData(commitDataArrays.filter(Array.isArray));
  
      setState(prev => ({
        ...prev,
        userData,
        repoData,
        commitData: mergedCommitData,
        totalLinesOfCode,
        loading: false,
        error: null
      }));
  
      setTimeout(() => {
        onCapture?.();
      }, 1000);
  
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      }));
    }
  };

  const mergeCommitData = (commitDataArrays: CommitData[][]) => {
    const mergedData: { [key: number]: number } = {};
    
    commitDataArrays.forEach(repoCommits => {
      if (!Array.isArray(repoCommits)) return;
      
      repoCommits.forEach(weekData => {
        if (mergedData[weekData.week]) {
          mergedData[weekData.week] += weekData.total;
        } else {
          mergedData[weekData.week] = weekData.total;
        }
      });
    });

    return Object.entries(mergedData)
      .map(([week, total]) => ({
        week: parseInt(week),
        total,
        days: new Array(7).fill(0)
      }))
      .sort((a, b) => a.week - b.week);
  };

  const getWeeklyCommitData = () => {
    return state.commitData.slice(-12).map((week) => ({
      week: new Date(week.week * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      commits: week.total
    }));
  };

  const getLanguageData = () => {
    const languageMap = new Map<string, number>();
    
    state.repoData.forEach(repo => {
      if (repo.language) {
        languageMap.set(
          repo.language,
          (languageMap.get(repo.language) || 0) + repo.size
        );
      }
    });

    return Array.from(languageMap.entries())
      .map(([name, size]) => ({
        name,
        value: size
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const COLORS = ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA'];

  const getYearlyCommitData = () => {
    const yearlyData = new Map<number, number>();
    
    state.commitData.forEach((week) => {
      const date = new Date(week.week * 1000);
      const year = date.getFullYear();
      yearlyData.set(year, (yearlyData.get(year) || 0) + week.total);
    });

    return Array.from(yearlyData.entries())
      .map(([year, commits]) => ({ year, commits }))
      .sort((a, b) => a.year - b.year);
  };

  const getContributionStreak = () => {
    let currentStreak = 0;
    let maxStreak = 0;
    
    state.commitData.forEach(week => {
      week.days.forEach(commits => {
        if (commits > 0) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
    });
    
    return maxStreak;
  };



  const formatLinesOfCode = (lines: number) => {
    const actualLines = Math.round(lines / 100);
                if (actualLines >= 1000000) {
                  return `${(actualLines / 1000000).toFixed(1)}M`;
                }
                if (actualLines >= 1000) {
                  return `${(actualLines / 1000).toFixed(1)}K`;
                }
                return actualLines.toString();
              }


  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-4 bg-[#1a1d24] text-white rounded-xl shadow-xl" ref={containerRef}>
      {!hideInput && (
        <Card className="bg-[#1e2128] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">GitHub Profile Analyzer</CardTitle>
            <CardDescription className="text-gray-400">Enter a GitHub username to analyze their profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={state.username}
                  onChange={(e) => setState(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter GitHub username"
                  className="w-full p-3 bg-[#1e2128] border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              </div>
              <button
                onClick={fetchGitHubData}
                disabled={state.loading || !state.username}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {state.loading ? 'Loading...' : 'Analyze'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.userData && (
       <div className="space-y-4">
       <Card className="bg-[#1e2128] border-gray-700">
         <CardContent className="pt-6">
           <div className="flex items-start gap-6">
             <img 
               src={state.userData.avatar_url}
               alt={`${state.userData.login}'s avatar`}
               className="w-24 h-24 rounded-lg ring-2 ring-blue-500/50"
             />
             <div className="flex-1">
               <div className="flex items-start justify-between">
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-1">{state.userData.name || state.username}</h2>
                   <p className="text-blue-400 text-sm mb-2 flex items-center gap-2">
                     <Globe size={14} />
                     <a href={state.userData.html_url} target="_blank" rel="noopener noreferrer" 
                        className="hover:underline flex items-center gap-1">
                       {state.userData.login}
                       <LinkIcon size={12} />
                     </a>
                   </p>
                 </div>
                 <div className="flex gap-4">
                   <span className="flex items-center gap-2 text-gray-300 text-sm">
                     <Users size={16} />
                     {state.userData.followers} followers
                   </span>
                   <span className="flex items-center gap-2 text-gray-300 text-sm">
                     <Calendar size={16} />
                     Joined {new Date(state.userData.created_at).toLocaleDateString()}
                   </span>
                 </div>
               </div>
               <p className="text-gray-400 text-sm mt-2">{state.userData.bio || 'Full Stack Developer'}</p>
             </div>
           </div>
         </CardContent>
       </Card>

       <div className="grid grid-cols-4 gap-4">
         <Card className="bg-[#1e2128] border-gray-700">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <BookOpen className="text-blue-500" size={20} />
               <div>
                 <div className="text-2xl font-bold text-white">{state.userData.public_repos}</div>
                 <div className="text-gray-400 text-sm">Repositories</div>
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <Star className="text-yellow-500" size={20} />
               <div>
                 <div className="text-2xl font-bold text-white">
                   {state.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                 </div>
                 <div className="text-gray-400 text-sm">Total Stars</div>
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <GitBranch className="text-green-500" size={20} />
               <div>
                 <div className="text-2xl font-bold text-white">
                   {getContributionStreak()}
                 </div>
                 <div className="text-gray-400 text-sm">Day Streak Record</div>
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <Code className="text-purple-500" size={20} />
               <div>
                 <div className="text-2xl font-bold text-white">
                   {formatLinesOfCode(state.totalLinesOfCode)}
                 </div>
                 <div className="text-gray-400 text-sm">Lines of Code</div>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>

       <div className="grid grid-cols-3 gap-4">
         <Card className="bg-[#1e2128] border-gray-700">
           <CardHeader>
             <CardTitle className="text-white text-lg">Top Languages</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64 flex items-center justify-center">
               <PieChart width={200} height={200}>
                 <Pie
                   data={getLanguageData()}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {getLanguageData().map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip
                   content={({ payload }) => {
                     if (payload && payload.length) {
                       return (
                         <div className="bg-[#1e2128] p-2 rounded-lg border border-gray-700">
                           <p className="text-white text-sm">{payload[0].name}</p>
                         </div>
                       );
                     }
                     return null;
                   }}
                 />
               </PieChart>
             </div>
             <div className="mt-4 space-y-2">
               {getLanguageData().map((lang, index) => (
                 <div key={lang.name} className="flex items-center gap-2">
                   <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-sm text-gray-300">{lang.name}</span>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700 col-span-2">
           <CardHeader>
             <CardTitle className="text-white text-lg">Recent Commit Activity</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={getWeeklyCommitData()}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                   <XAxis dataKey="week" stroke="#9CA3AF" />
                   <YAxis stroke="#9CA3AF" />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: '#1e2128',
                       border: 'none',
                       borderRadius: '8px',
                       color: '#F3F4F6'
                     }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="commits" 
                     stroke="#60A5FA" 
                     strokeWidth={2}
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700 col-span-2">
           <CardHeader>
             <CardTitle className="text-white text-lg">Top Repositories</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {state.repoData
                 .sort((a, b) => b.stargazers_count - a.stargazers_count)
                 .slice(0, 3)
                 .map(repo => (
                   <div key={repo.id} className="flex items-center justify-between p-3 bg-[#252832] rounded-lg">
                     <div>
                       <h4 className="font-medium text-white">{repo.name}</h4>
                       <p className="text-sm text-gray-400 mt-1 line-clamp-1">{repo.description || 'No description'}</p>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className="flex items-center gap-1 text-sm text-gray-300">
                         <Star size={14} className="text-yellow-500" />
                         {repo.stargazers_count}
                       </span>
                       <span className="flex items-center gap-1 text-sm text-gray-300">
                         <GitBranch size={14} className="text-green-500" />
                         {repo.forks_count}
                       </span>
                     </div>
                   </div>
                 ))}
             </div>
           </CardContent>
         </Card>

         <Card className="bg-[#1e2128] border-gray-700">
           <CardHeader>
             <CardTitle className="text-white text-lg">Yearly Activity</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={getYearlyCommitData()}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                   <XAxis dataKey="year" stroke="#9CA3AF" />
                   <YAxis stroke="#9CA3AF" />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: '#1e2128',
                       border: 'none',
                       borderRadius: '8px',
                       color: '#F3F4F6'
                     }}
                   />
                   <Bar dataKey="commits" fill="#34D399" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   )}
 </div>
  );
};

export default GitHubAnalyzer;
