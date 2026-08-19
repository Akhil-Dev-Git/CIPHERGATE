import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, LayoutDashboard, Scan, ScrollText, Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function HackerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Auth protection
  useEffect(() => {
    if (sessionStorage.getItem('cipher_auth') !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('cipher_auth');
    navigate('/');
  };

  const initiateScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      // Simulate taking a photo and converting to base64
      // We pass a dummy string just to trigger the heuristic backend
      const dummyBase64 = "data:image/jpeg;base64," + Math.random().toString(36).substring(7);

      const response = await fetch('/api/face-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: dummyBase64,
          detection_type: 'security_check',
          location: 'Main Entrance'
        })
      });

      const data = await response.json();
      setScanResult(data);
    } catch (err) {
      console.error(err);
      setScanResult({ error: "Failed to connect to detection core." });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-green-500 font-mono flex overflow-hidden selection:bg-green-500 selection:text-black">
      
      {/* Sidebar */}
      <div className="w-64 border-r border-green-900/50 bg-[#0f0f0f] flex flex-col z-10 flex-shrink-0">
        <div className="p-6 border-b border-green-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Cpu className="w-6 h-6 text-green-500" />
            CIPHERGATE
          </h2>
          <p className="text-xs text-green-600 mt-2">OPERATOR CONSOLE v2.4</p>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-green-900/30 text-green-400' : 'text-green-700 hover:bg-green-900/10'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'scanner' ? 'bg-green-900/30 text-green-400' : 'text-green-700 hover:bg-green-900/10'}`}
          >
            <Scan className="w-5 h-5" />
            Bio-Scanner
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'logs' ? 'bg-green-900/30 text-green-400' : 'text-green-700 hover:bg-green-900/10'}`}
          >
            <ScrollText className="w-5 h-5" />
            Access Logs
          </button>
        </nav>

        <div className="p-4 border-t border-green-900/50">
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 hover:text-red-400 px-4 py-2 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        {/* Subtle matrix-like grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="p-8 relative z-10 h-full flex flex-col min-w-0">
          
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-500" />
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                SYSTEM ONLINE
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-600">DB: CONNECTED</span>
            </div>
          </header>

          {activeTab === 'scanner' && (
            <div className="flex-1 flex gap-8 min-h-0">
              
              {/* Camera Feed */}
              <div className="flex-1 border border-green-800/50 bg-black/50 rounded-lg relative overflow-hidden flex flex-col">
                <div className="absolute top-4 left-4 border-t-2 border-l-2 border-green-500 w-8 h-8" />
                <div className="absolute top-4 right-4 border-t-2 border-r-2 border-green-500 w-8 h-8" />
                <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-green-500 w-8 h-8" />
                <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-green-500 w-8 h-8" />
                
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="text-center">
                    <Scan className="w-16 h-16 text-green-800 mx-auto mb-4 animate-pulse" />
                    <p className="text-green-600 text-sm tracking-widest">[ LIVE FEED CALIBRATING ]</p>
                  </div>

                  {isScanning && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-sm z-20">
                      <div className="text-green-400 text-xl tracking-[0.2em] animate-pulse">ANALYZING BIOMETRICS...</div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_#22c55e] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-green-900/50 bg-[#0f0f0f]/80">
                  <button 
                    onClick={initiateScan}
                    disabled={isScanning}
                    className="w-full bg-green-900/30 hover:bg-green-800/50 text-green-400 border border-green-700 py-3 rounded tracking-widest font-bold transition-all disabled:opacity-50"
                  >
                    INITIATE BIOMETRIC SCAN
                  </button>
                </div>
              </div>

              {/* Scan Results Panel */}
              <div className="w-96 border border-green-800/50 bg-black/50 rounded-lg p-6 overflow-y-auto">
                <h3 className="text-white text-lg border-b border-green-900/50 pb-2 mb-4 tracking-wider">ANALYSIS OUTPUT</h3>
                
                {!scanResult ? (
                  <p className="text-green-800 text-sm italic">Awaiting telemetry data...</p>
                ) : scanResult.error ? (
                  <div className="text-red-500 bg-red-900/20 p-4 border border-red-900 rounded">
                    <ShieldAlert className="w-6 h-6 mb-2" />
                    {scanResult.error}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-900/20 p-4 border border-green-800 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-xs">MATCH CONFIDENCE</span>
                        <span className="text-green-400 font-bold">{scanResult.match_percentage || Math.round((scanResult.confidence_score || scanResult.detected_features?.confidence_score) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full shadow-[0_0_10px_#22c55e]" style={{ width: `${scanResult.match_percentage || 94}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white/70 text-xs tracking-widest mb-3">EXTRACTED FEATURES</h4>
                      <div className="space-y-2 text-sm">
                        {scanResult.detected_features && Object.entries(scanResult.detected_features.facial_features || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b border-green-900/30 pb-1">
                            <span className="text-green-700 capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-green-400 truncate ml-4 text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded border border-green-800">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-sm">BIOMETRIC LOG SAVED TO SECURE DB</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab !== 'scanner' && (
            <div className="flex-1 flex items-center justify-center border border-green-800/50 bg-black/50 rounded-lg">
              <p className="text-green-800 tracking-widest">[ {activeTab.toUpperCase()} MODULE OFFLINE ]</p>
            </div>
          )}

        </div>
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
