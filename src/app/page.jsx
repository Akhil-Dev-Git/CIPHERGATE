import React from 'react';
import { ArrowRight, Menu } from 'lucide-react';

export default function CiphergateLandingPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans selection:bg-white selection:text-black flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            {/* Simple logo icon */}
            <div className="w-4 h-4 rounded-full border-2 border-black" />
          </div>
          <span className="text-xl font-bold tracking-wide">CIPHERGATE</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Products</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">FAQ</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>

        <div className="hidden md:flex items-center">
          <a href="#" className="px-6 py-2.5 text-sm font-semibold rounded-full border border-gray-700 hover:bg-gray-800 transition-colors">
            Log In <span className="ml-1">→</span>
          </a>
        </div>

        <button className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto w-full px-8 py-12 gap-12 lg:gap-24 relative">
        
        {/* Background abstract elements */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Left Content */}
        <div className="flex-1 space-y-8 z-10">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-white">
            Track Attendance<br />
            Just by <span className="text-gray-400 relative">
              Looking
              {/* Decorative line under "Looking" */}
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-white/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
            Lightweight and efficient algorithm designed to process video streams in real-time, detecting faces and seamlessly aligning them for automated analysis.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button className="px-8 py-3.5 rounded-full border border-gray-600 font-medium hover:bg-gray-800 transition-all">
              Request Demo
            </button>
            <button className="px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 group">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Image Content */}
        <div className="flex-1 w-full max-w-md lg:max-w-none relative z-10 flex justify-center lg:justify-end">
          
          {/* Decorative UI elements around the image */}
          <div className="absolute -left-8 top-1/4 w-16 h-px bg-white/30" />
          <div className="absolute -left-12 top-[30%] text-[10px] text-gray-500 font-mono">SCAN_INIT</div>
          
          <div className="absolute -right-8 bottom-1/3 w-16 h-px bg-white/30" />
          <div className="absolute -right-12 bottom-[28%] text-[10px] text-gray-500 font-mono">LOCKED</div>

          {/* Main Image Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80 z-10" />
            
            <img 
              src="/biometric_face_scan.jpg" 
              alt="Biometric face scanning" 
              className="w-full object-cover max-w-lg"
            />
            
            {/* Overlay tech bracket graphics */}
            <div className="absolute inset-4 border border-white/20 rounded z-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
