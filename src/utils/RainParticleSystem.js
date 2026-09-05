class RainParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 150;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 10 + 15,
      opacity: Math.random() * 0.3 + 0.1,
    };
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    for (let p of this.particles) {
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - p.length * 0.1, p.y + p.length);
      p.y += p.speed;
      p.x -= p.speed * 0.1;

      if (p.y > this.canvas.height) {
        p.y = -p.length;
        p.x = Math.random() * this.canvas.width;
      }
    }
    this.ctx.stroke();
    requestAnimationFrame(() => this.render());
  }
}