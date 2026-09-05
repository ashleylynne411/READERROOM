import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, BookOpen, Sliders, Maximize2, Minimize2, Sparkles, Clock, Share2 } from 'lucide-react';

// --- Preset Environments Database ---
const PRESETS = [
  {
    id: 'gothic-manor',
    title: 'Gothic Manor During a Rainstorm',
    genre: ['Gothic', 'Dark Romance', 'Horror', 'Mystery'],
    bgGradient: 'from-slate-950 via-zinc-900 to-stone-950',
    visualEffect: 'rain',
    audioTracks: [
      { id: 'rain', label: 'Window Rain', icon: '🌧️', defaultVol: 0.75 },
      { id: 'thunder', label: 'Distant Thunder', icon: '⛈️', defaultVol: 0.30 },
      { id: 'fireplace', label: 'Fireplace Crackle', icon: '🔥', defaultVol: 0.45 },
      { id: 'clock', label: 'Grandfather Clock', icon: '🕰️', defaultVol: 0.15 }
    ]
  },
  {
    id: 'wizards-library',
    title: "Wizard's Library at Midnight",
    genre: ['Fantasy', 'Romantasy', 'Dark Academia'],
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    visualEffect: 'embers',
    audioTracks: [
      { id: 'fireplace', label: 'Hearth Flame', icon: '🔥', defaultVol: 0.60 },
      { id: 'wind', label: 'Mystic Wind', icon: '🌲', defaultVol: 0.25 },
      { id: 'pages', label: 'Page Turning', icon: '📖', defaultVol: 0.20 },
      { id: 'ambient', label: 'Ethereal Drone', icon: '🌌', defaultVol: 0.35 }
    ]
  },
  {
    id: 'cyberpunk-cafe',
    title: 'Neon Alley Café',
    genre: ['Science Fiction', 'Cyberpunk', 'Dystopian'],
    bgGradient: 'from-purple-950 via-slate-950 to-fuchsia-950',
    visualEffect: 'rain',
    audioTracks: [
      { id: 'rain', label: 'Neon Rain', icon: '🌧️', defaultVol: 0.65 },
      { id: 'cafe', label: 'Café Murmur', icon: '☕', defaultVol: 0.40 },
      { id: 'synth', label: 'Lo-Fi Synth', icon: '🎵', defaultVol: 0.25 },
      { id: 'traffic', label: 'Distant Traffic', icon: '🚗', defaultVol: 0.20 }
    ]
  }
];

export default function ReaderRoomApp() {
  const [activePreset, setActivePreset] = useState(PRESETS[0]);
  const [volumes, setVolumes] = useState(() => 
    PRESETS[0].audioTracks.reduce((acc, tr) => ({ ...acc, [tr.id]: tr.defaultVol }), {})
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [matchedGenre, setMatchedGenre] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef({});

  // Initialize Audio Context & Synthesis Nodes for Ambient Simulation
  const togglePlay = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    setIsPlaying(!isPlaying);
    setIsTimerRunning(!isPlaying);
  };

  // Synchronize Volumes State changes with Active Preset
  const handlePresetSelect = (preset) => {
    setActivePreset(preset);
    const initialVols = preset.audioTracks.reduce((acc, tr) => ({ ...acc, [tr.id]: tr.defaultVol }), {});
    setVolumes(initialVols);
  };

  const handleVolumeChange = (trackId, val) => {
    setVolumes(prev => ({ ...prev, [trackId]: parseFloat(val) }));
  };

  // Book-to-Genre Matching Engine
  const handleBookMatch = (query) => {
    setBookTitle(query);
    const q = query.toLowerCase();
    
    let matched = null;
    if (q.includes('harry') || q.includes('magic') || q.includes('spell') || q.includes('throne')) {
      matched = PRESETS.find(p => p.id === 'wizards-library');
      setMatchedGenre('Fantasy / High Magic');
    } else if (q.includes('neuromancer') || q.includes('cyber') || q.includes('blade') || q.includes('sci-fi')) {
      matched = PRESETS.find(p => p.id === 'cyberpunk-cafe');
      setMatchedGenre('Cyberpunk / Sci-Fi');
    } else if (q.includes('dracula') || q.includes('gothic') || q.includes('dark') || q.includes('rain')) {
      matched = PRESETS.find(p => p.id === 'gothic-manor');
      setMatchedGenre('Gothic / Dark Romance');
    }

    if (matched) {
      handlePresetSelect(matched);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Particle Canvas Visualizer Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle Array Generator
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: activePreset.visualEffect === 'rain' ? Math.random() * 2 + 1 : Math.random() * 3 + 1,
      speedY: activePreset.visualEffect === 'rain' ? Math.random() * 8 + 10 : -(Math.random() * 0.8 + 0.2),
      speedX: activePreset.visualEffect === 'rain' ? -1.5 : Math.sin(Math.random() * Math.PI) * 0.5,
      opacity: Math.random() * 0.5 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        ctx.fillStyle = activePreset.visualEffect === 'rain' 
          ? `rgba(180, 210, 255, ${p.opacity})` 
          : `rgba(255, 180, 100, ${p.opacity})`;

        ctx.beginPath();
        if (activePreset.visualEffect === 'rain') {
          ctx.rect(p.x, p.y, 1, p.size * 5);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > height) p.y = -10;
        if (p.y < -10) p.y = height;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activePreset]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${activePreset.bgGradient} text-slate-100 font-sans transition-all duration-1000`}>
      {/* Background HTML5 Canvas Particle Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Glassmorphic Overlay Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0" />

      {/* Top Application Bar */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-serif font-bold tracking-wide">Reader Room</h1>
        </div>

        {/* Quick Search & Genre Auto-Matcher */}
        {!focusMode && (
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 w-80">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              placeholder="What book are you reading?..."
              value={bookTitle}
              onChange={(e) => handleBookMatch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-white/50 focus:outline-none w-full"
            />
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/10 text-sm"
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>
        </div>
      </header>

      {/* Main Focus Mode View */}
      {focusMode ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center p-8">
          <h2 className="text-4xl font-serif font-light tracking-widest text-amber-100/90 mb-2">
            {bookTitle || activePreset.title}
          </h2>
          {matchedGenre && (
            <span className="text-xs uppercase tracking-widest text-amber-400/80 mb-8">{matchedGenre}</span>
          )}

          <div className="flex items-center space-x-3 bg-black/40 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md mb-12">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-2xl tracking-wider">{formatTime(timerSeconds)}</span>
          </div>

          <button
            onClick={togglePlay}
            className="p-6 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition transform hover:scale-105"
          >
            {isPlaying ? <Pause className="w-8 h-8 text-amber-200" /> : <Play className="w-8 h-8 text-amber-200 ml-1" />}
          </button>
        </div>
      ) : (
        /* Default Dashboard & Customizer Interface */
        <main className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 max-w-7xl mx-auto">
          {/* Left Column: Preset Selector */}
          <section className="space-y-4">
            <h2 className="text-lg font-serif font-semibold text-amber-200 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Atmospheric Presets</span>
            </h2>
            <div className="space-y-3">
              {PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-4 rounded-xl cursor-pointer transition border backdrop-blur-md ${
                    activePreset.id === preset.id
                      ? 'bg-amber-500/15 border-amber-400/50 shadow-lg shadow-amber-950/40'
                      : 'bg-black/20 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <h3 className="font-medium text-white">{preset.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preset.genre.map((g) => (
                      <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Middle & Right Column: Audio Soundboard Customizer */}
          <section className="lg:col-span-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-white">{activePreset.title}</h2>
                <p className="text-xs text-slate-400 mt-1">Adjust individual sound elements to mix your custom ambience.</p>
              </div>

              <button
                onClick={togglePlay}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition shadow-lg shadow-amber-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pause Ambience' : 'Start Ambience'}</span>
              </button>
            </div>

            {/* Audio Control Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {activePreset.audioTracks.map((track) => (
                <div key={track.id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center space-x-2">
                      <span>{track.icon}</span>
                      <span>{track.label}</span>
                    </span>
                    <span className="font-mono text-xs text-amber-300">
                      {Math.round((volumes[track.id] ?? track.defaultVol) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volumes[track.id] ?? track.defaultVol}
                    onChange={(e) => handleVolumeChange(track.id, e.target.value)}
                    className="w-full accent-amber-400 bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Session Stats Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Reading Session: <strong className="text-white font-mono">{formatTime(timerSeconds)}</strong></span>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition">
                <Share2 className="w-4 h-4" />
                <span>Share Environment Link</span>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}