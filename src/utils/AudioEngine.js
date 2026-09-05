class AmbientAudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.activeNodes = new Map();
    this.bufferCache = new Map();
  }

  async loadSample(key, url) {
    if (this.bufferCache.has(key)) return this.bufferCache.get(key);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(key, audioBuffer);
    return audioBuffer;
  }

  async playLoop(key, url, initialVolume = 0.5, panValue = 0) {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    
    const buffer = await this.loadSample(key, url);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(initialVolume, this.ctx.currentTime);

    if (panner) {
      panner.pan.setValueAtTime(panValue, this.ctx.currentTime);
      source.connect(panner);
      panner.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    gainNode.connect(this.masterGain);
    source.start(0);

    this.activeNodes.set(key, { source, gainNode, panner });
  }

  setVolume(key, volume) {
    const node = this.activeNodes.get(key);
    if (node) {
      // Smooth linear transition to prevent audio popping
      node.gainNode.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, volume)), 
        this.ctx.currentTime + 0.05
      );
    }
  }

  stopLoop(key) {
    const node = this.activeNodes.get(key);
    if (node) {
      node.source.stop();
      node.source.disconnect();
      this.activeNodes.delete(key);
    }
  }
}