// 1. Detect low-end GPU hardware before initializing WebGL
function hasGpuHeadroom() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return false;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    // Disable heavy shaders automatically for basic integrated graphics chips
    if (renderer.includes('intel hd') || renderer.includes('swiftshader') || renderer.includes('llvmpipe')) {
      return false;
    }
  }
  return true;
}

// 2. Real-time Frame Rate Monitor (Auto-fallback if FPS drops)
class PerformanceMonitor {
  constructor(onLagDetected) {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.onLagDetected = onLagDetected;
  }

  checkFPS() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 2000) { // Evaluate every 2 seconds
      const fps = (this.frameCount * 1000) / (now - this.lastTime);
      if (fps < 25) { // If frame rate drops below 25 FPS, trigger fallback
        this.onLagDetected();
      }
      this.frameCount = 0;
      this.lastTime = now;
    }
    requestAnimationFrame(() => this.checkFPS());
  }
}