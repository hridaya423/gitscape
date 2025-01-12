import React, { useState, useRef, useEffect } from 'react';
import { MacbookScroll } from '@/components/macbookscroll';
import GitHubAnalyzer from '@/components/githubanalyzer';
import GitHubComparison from '@/components/githubcomparison';
import { Search, Download, Copy, Check, ArrowRightLeft, Github, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const LoadingBar = ({ progress }: { progress: number }) => {
  return (
    <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiIGlkPSJhIj48c3RvcCBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4yIiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIwIiBvZmZzZXQ9IjEwMCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMCAwaDIwTDAgMjB6Ii8+PC9zdmc+')] animate-[shine_2s_linear_infinite]" />
      </div>
    </div>
  );
};

const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    'Fetching profile data',
    'Analyzing repositories',
    'Generating visualization',
    'Finalizing report'
  ];

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto mt-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center 
            ${index === currentStep ? 'bg-blue-500' : 
              index < currentStep ? 'bg-white/20' : 'bg-white/5'}`}>
            {index < currentStep && (
              <Check className="w-3 h-3 text-white" />
            )}
            {index === currentStep && (
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </div>
          <span className={`text-sm ${index === currentStep ? 'text-white' : 'text-white/40'}`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
};

function GitHubAnalyzerMacbook() {
  const [username, setUsername] = useState('');
  const [username2, setUsername2] = useState('');
  const [mode, setMode] = useState('analyze');
  const [capturedImage, setCapturedImage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const analyzerRef = useRef(null);
  
  useEffect(() => {
    if (isAnalyzing) {
      setProgress(0);
      setCurrentStep(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) {
            clearInterval(progressInterval);
            return 98;
          }
          return prev + 0.3; 
        });
      }, 50);
  
      const stepTimes = [0, 2000, 4000, 6000];
      stepTimes.forEach((time, index) => {
        setTimeout(() => {
          setCurrentStep(index);
        }, time);
      });
  
      const minLoadingTime = 7000;
      setTimeout(() => {
        captureAnalyzer().then(() => {
          setProgress(100);
          setTimeout(() => {
            setIsAnalyzing(false);
            setProgress(0);
            setCurrentStep(0);
          }, 500);
        });
      }, minLoadingTime);
  
      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [isAnalyzing]);
  
  const captureAnalyzer = async () => {
    if (analyzerRef.current) {
      try {
        if (!analyzerRef.current) return;
        const canvas = await html2canvas(analyzerRef.current, {
          backgroundColor: '#0a0a0f',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          onclone: (document) => {
            const images = document.getElementsByTagName('img');
            return Promise.all(Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            }));
          }
        });
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      } catch (error) {
        console.error('Error capturing content:', error);
        setIsAnalyzing(false);
        setProgress(0);
        setCurrentStep(0);
      }
    }
  };

  const handleCopyToClipboard = async () => {
    if (!capturedImage) return;
    setCopying(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setCopying(false);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      const filename = mode === 'analyze' 
        ? `github-analysis-${username}.png`
        : `github-comparison-${username}-vs-${username2}.png`;
      link.download = filename;
      link.href = capturedImage;
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleAnalyze = () => {
    if (mode === 'analyze' && !username.trim()) return;
    if (mode === 'compare' && (!username.trim() || !username2.trim())) return;
    setIsAnalyzing(true);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'analyze' ? 'compare' : 'analyze');
    setCapturedImage('');
    setIsAnalyzing(false);
    setUsername('');
    setUsername2('');
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-b from-[#0a0a0f]/95 via-[#0a0a0f]/90 to-transparent pt-6 pb-8 px-4 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Github className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-xl font-semibold text-white">
                  GitScape
                  <span className="ml-2 text-xs text-blue-400/80 font-normal">BETA</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
               
                <button
                  onClick={toggleMode}
                  className="group flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/10"
                >
                  <ArrowRightLeft className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="text-sm">
                    Switch to {mode === 'analyze' ? 'Compare' : 'Analyze'}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 group">
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-white/30">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === 'analyze' ? "Enter GitHub username" : "Enter first username"}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>
                
                {mode === 'compare' && (
                  <div className="flex-1 group">
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-white/30">
                        <Search className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={username2}
                        onChange={(e) => setUsername2(e.target.value)}
                        placeholder="Enter second username"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !username || (mode === 'compare' && !username2)}
                  className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-all duration-200 min-w-[120px] relative overflow-hidden group font-medium"
                >
                  <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
                    <Github className="h-4 w-4" />
                    {mode === 'analyze' ? 'Analyze' : 'Compare'}
                  </span>
                  {isAnalyzing && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                  )}
                </button>
              </div>

              {capturedImage && (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={copying}
                    className="px-4 py-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/10 disabled:opacity-50"
                  >
                    {copying ? (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">
                      {downloading ? 'Downloading...' : 'Download PNG'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed left-0 top-0 -z-10 opacity-0">
        <div ref={analyzerRef}>
          {isAnalyzing && mode === 'analyze' && (
            <GitHubAnalyzer 
              initialUsername={username}
              onCapture={captureAnalyzer}
              hideInput={true}
            />
          )}
          {isAnalyzing && mode === 'compare' && (
            <GitHubComparison 
              initialUsername1={username}
              initialUsername2={username2}
              onCapture={captureAnalyzer}
              hideInput={true}
            />
          )}
        </div>
      </div>

      <div className="overflow-hidden dark:bg-[#0a0a0f] bg-[#0a0a0f] w-full">
        {!isAnalyzing && capturedImage ? (
          <MacbookScroll
            title={
              <span className="text-lg font-medium">
                {mode === 'analyze' ? (
                  <>
                    GitHub Analytics for <br />
                    <span className="text-blue-400">{username}</span>
                  </>
                ) : (
                  <>
                    GitHub Comparison <br />
                    <span className="text-blue-400">{username}</span> vs{' '}
                    <span className="text-purple-400">{username2}</span>
                  </>
                )}
              </span>
            }
            src={capturedImage}
            showGradient={false}
          />
        ) : (
          <div className="h-screen flex items-center justify-center text-center p-4">
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="flex flex-col items-center gap-4">
                {!isAnalyzing ? (
                  <div className="p-4 bg-blue-500/10 rounded-2xl mb-2">
                    <Github className="h-10 w-10 text-blue-400" />
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    <LoadingBar progress={progress} />
                    <ProgressSteps currentStep={currentStep} />
                  </div>
                )}
                <h2 className="text-3xl font-bold text-white">
                  {isAnalyzing ? (
                    mode === 'analyze' ? 
                      "Analyzing GitHub Profile..." :
                      "Comparing GitHub Profiles..."
                  ) : (
                    mode === 'analyze' ?
                      "Discover GitHub Insights" :
                      "Compare GitHub Profiles"
                  )}
                </h2>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-white/60">
                      Please wait while we generate your {mode === 'analyze' ? 'profile visualization' : 'comparison'}
                    </p>
                  </div>
                ) : (
                  <p className="text-white/60">
                    {mode === 'analyze' 
                      ? "Get detailed analytics and visualizations for any GitHub profile."
                      : "Compare two GitHub profiles side by side and see how they stack up."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GitHubAnalyzerMacbook;