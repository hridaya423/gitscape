import React from "react";
import { BackgroundGradientAnimation } from "@/components/bganim";
import { cn } from "@/lib/utils";
function HomePage() {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(25, 5, 85)"
      gradientBackgroundEnd="rgb(5, 15, 55)"
      firstColor="45, 100, 255"
      secondColor="230, 80, 255"
      thirdColor="120, 220, 255"
      fourthColor="180, 60, 170"
      fifthColor="140, 140, 255"
      pointerColor="140, 100, 255"
      size="100%"
      blendingValue="soft-light"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 px-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl" />
        </div>

        <div className="relative z-50 flex flex-col items-center gap-6 pointer-events-none">
          <div className="text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter">
            <h1 className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/20 drop-shadow-2xl">
              GitScape
            </h1>
          </div>
          <p className="text-lg md:text-xl text-white/60 text-center max-w-lg">
          Transform your code story into visual glory: turning repositories into radiant showcases of your development journey
          </p>
        </div>

        <div className="relative z-50 flex flex-col items-center gap-6">
          <div className={cn(
            "group relative h-16 w-full max-w-sm overflow-hidden rounded-full p-[1px]",
            "bg-gradient-to-r from-violet-500/50 via-blue-500/50 to-emerald-500/50"
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-emerald-500/10 animate-pulse" />
            <a href="/analysis" className="block w-full h-full">
              <button className="relative flex w-full h-full items-center justify-center gap-2 rounded-full bg-black/90 px-6 font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80">
                <span className="text-lg">Get Started</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.75 8.75L14.25 12L10.75 15.25"
                  ></path>
                </svg>
              </button>
            </a>
          </div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}

export default HomePage;