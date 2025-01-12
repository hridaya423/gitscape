'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, GitBranch, Star, Code } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GitHubComparisonProps {
  initialUsername1?: string;
  initialUsername2?: string;
  onCapture?: () => void;
  hideInput?: boolean;
}

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

interface ComparisonState {
  user1: {
    username: string;
    userData: GitHubUser | null;
    repoData: GitHubRepo[];
    commitData: CommitData[];
    totalLinesOfCode: number;
  };
  user2: {
    username: string;
    userData: GitHubUser | null;
    repoData: GitHubRepo[];
    commitData: CommitData[];
    totalLinesOfCode: number;
  };
  loading: boolean;
  error: string | null;
}

const GitHubComparison: React.FC<GitHubComparisonProps> = ({
  initialUsername1 = '',
  initialUsername2 = '',
  onCapture,
  hideInput = false
}) => {
  const [state, setState] = useState<ComparisonState>({
    user1: {
      username: initialUsername1,
      userData: null,
      repoData: [],
      commitData: [],
      totalLinesOfCode: 0
    },
    user2: {
      username: initialUsername2,
      userData: null,
      repoData: [],
      commitData: [],
      totalLinesOfCode: 0
    },
    loading: false,
    error: null
  });

  useEffect(() => {
    if (initialUsername1 && initialUsername2) {
      fetchGitHubData(initialUsername1, 'user1');
      fetchGitHubData(initialUsername2, 'user2');
    }
  }, [initialUsername1, initialUsername2]);

  const fetchGitHubData = async (username: string, userKey: 'user1' | 'user2'): Promise<void> => {
    if (!username.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const headers = {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!userResponse.ok) throw new Error(`User ${username} not found`);
      const userData: GitHubUser = await userResponse.json();

      const reposResponse = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
        { headers }
      );
      const repoData: GitHubRepo[] = await reposResponse.json();

      const totalLinesOfCode = repoData.reduce((sum, repo) => sum + (repo.size * 100), 0);

      const commitPromises = repoData.slice(0, 5).map(repo =>
        fetch(`https://api.github.com/repos/${username}/${repo.name}/stats/commit_activity`, { headers })
          .then(res => res.json())
          .catch(() => [])
      );

      const commitDataArrays = await Promise.all(commitPromises);
      const mergedCommitData = mergeCommitData(commitDataArrays.filter(Array.isArray));

      setState(prev => ({
        ...prev,
        [userKey]: {
          username,
          userData,
          repoData,
          commitData: mergedCommitData,
          totalLinesOfCode
        },
        loading: false,
        error: null
      }));

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
      repoCommits.forEach(weekData => {
        mergedData[weekData.week] = (mergedData[weekData.week] || 0) + weekData.total;
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

  useEffect(() => {
    if (state.user1.userData && state.user2.userData && !state.loading) {
      setTimeout(() => {
        onCapture?.();
      }, 1000);
    }
  }, [state.user1.userData, state.user2.userData, state.loading]);

  const formatValue = (val: number) => {
    const actualLines = Math.round(val / 100);
    if (actualLines >= 1000000) {
      return `${(actualLines / 1000000).toFixed(1)}M`;
    }
    if (actualLines >= 1000) {
      return `${(actualLines / 1000).toFixed(1)}K`;
    }
    return actualLines.toString();
  };

  const renderComparison = () => {
    if (!state.user1.userData || !state.user2.userData) return null;
  
    return (
      <div className="w-full max-w-[780px] mx-auto space-y-6 bg-[#1a1d24] rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4">
          {['user1', 'user2'].map((userKey) => {
            const user = state[userKey as 'user1' | 'user2'];
            return (
              <Card key={userKey} className="bg-[#1e2128] border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={user.userData?.avatar_url}
                      alt={`${user.userData?.login}'s avatar`}
                      className="w-20 h-20 rounded-lg ring-2 ring-blue-500/50"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {user.userData?.name || user.username}
                      </h3>
                      <p className="text-blue-400 text-sm flex items-center gap-1 mb-2">
                        <a href={user.userData?.html_url} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="hover:underline">
                          @{user.userData?.login}
                        </a>
                      </p>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {user.userData?.bio || 'No bio available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-[#1e2128] border-gray-700">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <GitBranch size={16} />
                  <span className="text-sm">Repositories</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${state.user1.userData.public_repos > state.user2.userData.public_repos ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user1.userData.public_repos}
                  </span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className={`text-xl font-bold ${state.user2.userData.public_repos > state.user1.userData.public_repos ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user2.userData.public_repos}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2128] border-gray-700">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={16} />
                  <span className="text-sm">Followers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${state.user1.userData.followers > state.user2.userData.followers ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user1.userData.followers}
                  </span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className={`text-xl font-bold ${state.user2.userData.followers > state.user1.userData.followers ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user2.userData.followers}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2128] border-gray-700">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Star size={16} />
                  <span className="text-sm">Total Stars</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${state.user1.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0) > state.user2.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0) ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user1.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                  </span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className={`text-xl font-bold ${state.user2.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0) > state.user1.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0) ? 'text-green-400' : 'text-red-400'}`}>
                    {state.user2.repoData.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2128] border-gray-700">
            <CardContent className="pt-6 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Code size={16} />
                  <span className="text-sm">Lines of Code</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${state.user1.totalLinesOfCode > state.user2.totalLinesOfCode ? 'text-green-400' : 'text-red-400'}`}>
                    {formatValue(state.user1.totalLinesOfCode)}
                  </span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className={`text-xl font-bold ${state.user2.totalLinesOfCode > state.user1.totalLinesOfCode ? 'text-green-400' : 'text-red-400'}`}>
                    {formatValue(state.user2.totalLinesOfCode)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['user1', 'user2'].map((userKey) => {
            const user = state[userKey as 'user1' | 'user2'];
            return (
              <Card key={userKey} className="bg-[#1e2128] border-gray-700">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Repositories - {user.userData?.name || user.username}
                  </h3>
                  <div className="space-y-3">
                    {user.repoData
                      .sort((a, b) => b.stargazers_count - a.stargazers_count)
                      .slice(0, 3)
                      .map(repo => (
                        <div key={repo.id} className="flex items-center justify-between p-3 bg-[#252832] rounded-lg">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-white truncate">{repo.name}</h4>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                              {repo.description || 'No description'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
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
            );
          })}
        </div>
        
        <div className="w-32" />
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-4 bg-[#161920] rounded-xl pl-16">
      {!hideInput && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Compare GitHub Profiles</h1>
            <p className="text-gray-400">Enter two GitHub usernames to compare their profiles</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={state.user1.username}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    user1: { ...prev.user1, username: e.target.value }
                  }))}
                  placeholder="First username"
                  className="w-full p-3 bg-[#1a1d24] border border-gray-700 rounded-xl text-white placeholder-gray-500"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={state.user2.username}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    user2: { ...prev.user2, username: e.target.value }
                  }))}
                  placeholder="Second username"
                  className="w-full p-3 bg-[#1a1d24] border border-gray-700 rounded-xl text-white placeholder-gray-500"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              </div>
            </div>
            <button
              onClick={() => {
                fetchGitHubData(state.user1.username, 'user1');
                fetchGitHubData(state.user2.username, 'user2');
              }}
              disabled={state.loading || !state.user1.username || !state.user2.username}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Loading...' : 'Compare'}
            </button>
          </div>
        </div>
      )}
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {renderComparison()}
    </div>
  );
}
export default GitHubComparison