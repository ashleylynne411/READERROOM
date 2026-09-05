// RainShaderEngine.js
export class RainShaderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!this.gl) return;

    this.vertShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL screen coordinates
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    this.fragShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_uv;

      // Hash function for pseudo-random droplet placement
      float N21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      // Generates sliding rain droplets and trails
      vec3 RainLayer(vec2 uv, float t) {
        vec2 aspect = vec2(2.0, 1.0);
        vec2 grid = vec2(15.0, 5.0);
        vec2 st = uv * grid * aspect;
        
        vec2 id = floor(st);
        st = fract(st) - 0.5;
        
        float n = N21(id);
        t += n * 6.2831; // Phase offset per grid cell
        
        // Vertical drop movement with stuttered speed
        float y = -sin(t + sin(t + sin(t) * 0.5)) * 0.45;
        vec2 dropPos = st - vec2(0.0, y);
        
        float drop = smoothstep(0.15, 0.03, length(dropPos));
        
        // Trail droplets behind main drop
        float trail = smoothstep(0.1, 0.0, length(st - vec2(0.0, y + (st.y - y) * 0.8)));
        trail *= smoothstep(0.5, 0.0, st.y - y);
        
        return vec3(dropPos * drop, drop + trail * 0.5);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float t = u_time * 0.8;

        // Composite multiple rain layers for depth
        vec3 rain = RainLayer(uv, t);
        rain += RainLayer(uv * 1.5 + 7.3, t * 1.2) * 0.6;

        // Refract UV coordinates based on droplet normal map vectors
        vec2 refractedUV = uv + rain.xy * 0.08;

        // Simulated background window condensation + light distortion
        vec3 baseColor = mix(vec3(0.05, 0.07, 0.12), vec3(0.15, 0.1, 0.2), refractedUV.y);
        vec3 finalColor = baseColor + vec3(rain.z * 0.3); // Add refraction specular highlights

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.init();
  }

  init() {
    const gl = this.gl;
    const createShader = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, this.vertShaderSource);
    const frag = createShader(gl.FRAGMENT_SHADER, this.fragShaderSource);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vert);
    gl.attachShader(this.program, frag);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    // Quad geometry covering clipping space
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.uTimeLoc = gl.getUniformLocation(this.program, 'u_time');
    this.uResLoc = gl.getUniformLocation(this.program, 'u_resolution');
  }

  render(time) {
    if (!this.gl) return;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uTimeLoc, time * 0.001);
    this.gl.uniform2f(this.uResLoc, this.canvas.width, this.canvas.height);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}