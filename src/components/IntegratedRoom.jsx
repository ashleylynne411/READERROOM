import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, BookOpen, Search, Loader2, Sparkles, Clock, Share2, Maximize2, Minimize2 } from 'lucide-react';
import { RainShaderEngine } from './RainShaderEngine';

const PRESETS = {
  gothic: {
    id: 'gothic-manor',
    title: 'Gothic Manor Rainstorm',
    bgGradient: 'from-slate-950 via-zinc-900 to-stone-950',
    audioTracks: [
      { id: 'rain', label: 'Window Rain', icon: '🌧️', defaultVol: 0.8 },
      { id: 'thunder', label: 'Distant Thunder', icon: '⛈️', defaultVol: 0.4 },
      { id: 'fireplace', label: 'Hearth Fire', icon: '🔥', defaultVol: 0.5 }
    ]
  },
  fantasy: {
    id: 'wizards-library',
    title: "Wizard's Arcane Library",
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    audioTracks: [
      { id: 'fireplace', label: 'Hearth Flame', icon: '🔥', defaultVol: 0.6 },
      { id: 'wind', label: 'Mystic Wind', icon: '🌲', defaultVol: 0.3 },
      { id: 'pages', label: 'Page Turning', icon: '📖', defaultVol: 0.2 }
    ]
  },
  scifi: {
    id: 'cyberpunk-cafe',
    title: 'Neon Alley Café',
    bgGradient: 'from-purple-950 via-slate-950 to-fuchsia-950',
    audioTracks: [
      { id: 'rain', label: 'Neon Rain', icon: '🌧️', defaultVol: 0.7 },
      { id: 'cafe', label: 'Café Murmur', icon: '☕', defaultVol: 0.4 },
      { id: 'synth', label: 'Ambient Synth', icon: '🎵', defaultVol: 0.3 }
    ]
  }
};

export default function IntegratedReaderRoom() {
  const [activePreset, setActivePreset] = useState(PRESETS.gothic);
  const [volumes, setVolumes] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  // Open Library API State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const canvasRef = useRef(null);
  const shaderEngineRef = useRef(null);

  // --- Open Library Search API Fetcher ---
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(searchQuery)}&limit=4`);
        const data = await res.json();
        
        const books = data.docs.map(doc => ({
          key: doc.key,
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
          coverId: doc.cover_i,
          subjects: doc.subject ? doc.subject.map(s => s.toLowerCase()) : []
        }));
        
        setSearchResults(books);
      } catch (err) {
        console.error('Open Library Fetch Error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms Debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map Open Library Subjects/Metadata to Preset Ambience
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchQuery('');
    setSearchResults([]);

    const subjects = book.subjects.join(' ');
    if (subjects.includes('fantasy') || subjects.includes('magic') || subjects.includes('dragon')) {
      setActivePreset(PRESETS.fantasy);
    } else if (subjects.includes('science fiction') || subjects.includes('cyberpunk') || subjects.includes('space')) {
      setActivePreset(PRESETS.scifi);
    } else {
      setActivePreset(PRESETS.gothic); // Fallback Default
    }
  };

  // --- WebGL Shader Lifecycle ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    shaderEngineRef.current = new RainShaderEngine(canvas);

    let animationId;
    const renderLoop = (time) => {
      if (shaderEngineRef.current) {
        shaderEngineRef.current.render(time);
      }
      animationId = requestAnimationFrame(renderLoop);
    };
    animationId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${activePreset.bgGradient} text-slate-100 font-sans`}>
      {/* WebGL Canvas Background Shader */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0" />

      {/* Top Application Bar */}
      <header className="relative z-20 flex items-center justify-between p-6 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-serif font-bold tracking-wide">Reader Room</h1>
        </div>

        {/* Live Open Library Autocomplete Search */}
        {!focusMode && (
          <div className="relative w-96">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-full border border-white/15 focus-within:border-amber-400 transition">
              {isSearching ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
              <input
                type="text"
                placeholder="Search Open Library by book title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-white/50 focus:outline-none w-full"
              />
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 backdrop-blur-xl">
                {searchResults.map((b) => (
                  <div
                    key={b.key}
                    onClick={() => handleSelectBook(b)}
                    className="flex items-center space-x-3 p-3 hover:bg-white/10 cursor-pointer transition border-b border-white/5 last:border-none"
                  >
                    {b.coverId ? (
                      <img src={`https://covers.openlibrary.org/b/id/${b.coverId}-S.jpg`} alt={b.title} className="w-8 h-11 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-11 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500">No Cover</div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-white line-clamp-1">{b.title}</h4>
                      <p className="text-xs text-slate-400">{b.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setFocusMode(!focusMode)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/10 text-sm"
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
        </button>
      </header>

      {/* Main Focus / Room Display */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-8">
        {selectedBook && (
          <div className="flex flex-col items-center mb-8 animate-fade-in text-center">
            {selectedBook.coverId && (
              <img
                src={`https://covers.openlibrary.org/b/id/${selectedBook.coverId}-L.jpg`}
                alt={selectedBook.title}
                className="w-36 h-52 object-cover rounded-lg shadow-2xl border border-white/20 mb-4"
              />
            )}
            <h2 className="text-3xl font-serif font-bold text-amber-100">{selectedBook.title}</h2>
            <p className="text-sm text-amber-300/80 mt-1">by {selectedBook.author}</p>
          </div>
        )}

        <div className="flex items-center space-x-4 bg-black/50 px-8 py-4 rounded-full border border-white/15 backdrop-blur-xl">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
          <div>
            <h3 className="font-serif font-medium text-lg">{activePreset.title}</h3>
            <p className="text-xs text-slate-400">{isPlaying ? 'Ambience active' : 'Paused'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}