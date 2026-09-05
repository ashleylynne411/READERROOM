import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Zap, Image as ImageIcon } from 'lucide-react';

// --- Hardware Detection Utility ---
function detectLowPowerHardware() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return true; // No WebGL support -> Low Power Mode

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    // Detect basic integrated graphics or software renderers
    if (
      renderer.includes('intel hd') ||
      renderer.includes('swiftshader') ||
      renderer.includes('llvmpipe') ||
      renderer.includes('mesa')
    ) {
      return true; // Force fallback for low-end GPU
    }
  }
  return false;
}

export default function IntegratedGraphicsContainer({ staticBgUrl, children }) {
  // Mode Hierarchy: 'webgl' (Tier 1) -> 'canvas' (Tier 2) -> 'static' (Tier 3)
  const [graphicsTier, setGraphicsTier] = useState(() => {
    return detectLowPowerHardware() ? 'static' : 'webgl';
  });

  const [downgradeNotice, setDowngradeNotice] = useState(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // --- Real-Time Performance (FPS) Guardrail ---
  useEffect(() => {
    if (graphicsTier === 'static') return; // No FPS monitoring needed for static images

    let animationId;

    const monitorFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      // Evaluate FPS every 2.5 seconds to prevent false triggers during tab-switches
      if (elapsed >= 2500) {
        const fps = (frameCountRef.current * 1000) / elapsed;

        if (fps < 25 && graphicsTier === 'webgl') {
          setGraphicsTier('canvas');
          setDowngradeNotice('Adjusted visuals to 2D Canvas for better performance.');
        } else if (fps < 20 && graphicsTier === 'canvas') {
          setGraphicsTier('static');
          setDowngradeNotice('Switched to static background to preserve battery and speed.');
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(monitorFPS);
    };

    animationId = requestAnimationFrame(monitorFPS);
    return () => cancelAnimationFrame(animationId);
  }, [graphicsTier]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Tier 1: WebGL Heavy Shader Background */}
      {graphicsTier === 'webgl' && (
        <WebGLShaderBackground className="absolute inset-0 z-0 pointer-events-none" />
      )}

      {/* Tier 2: Lightweight 2D Canvas Background */}
      {graphicsTier === 'canvas' && (
        <Canvas2DParticleBackground className="absolute inset-0 z-0 pointer-events-none" />
      )}

      {/* Tier 3: Static WebP Fallback Background */}
      {graphicsTier === 'static' && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${staticBgUrl})` }}
        />
      )}

      {/* Subtle Performance Notification Banner */}
      {downgradeNotice && (
        <div className="absolute top-20 right-6 z-50 flex items-center space-x-2 bg-slate-900/90 border border-amber-500/30 text-amber-200 text-xs px-3 py-2 rounded-lg backdrop-blur-md shadow-xl animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{downgradeNotice}</span>
          <button
            onClick={() => setDowngradeNotice(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Manual Graphics Override Controls (Settings Drawer) */}
      <div className="absolute bottom-6 right-6 z-40 flex items-center space-x-1 bg-black/40 border border-white/10 p-1 rounded-full backdrop-blur-md">
        <button
          onClick={() => setGraphicsTier('webgl')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            graphicsTier === 'webgl' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          High (GPU)
        </button>
        <button
          onClick={() => setGraphicsTier('canvas')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            graphicsTier === 'canvas' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Medium
        </button>
        <button
          onClick={() => setGraphicsTier('static')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            graphicsTier === 'static' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Static (Battery Saver)
        </button>
      </div>

      {/* Application UI (Audio Soundboard, Timer, Focus View) */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// --- Placeholder Component Implementations ---
function WebGLShaderBackground({ className }) {
  return (
    <div className={`${className} bg-gradient-to-b from-amber-950/20 to-slate-950 flex items-center justify-center`}>
      {/* WebGL Canvas runs here */}
    </div>
  );
}

function Canvas2DParticleBackground({ className }) {
  return (
    <div className={`${className} bg-slate-900/50 flex items-center justify-center`}>
      {/* 2D Context Canvas runs here */}
    </div>
  );
}