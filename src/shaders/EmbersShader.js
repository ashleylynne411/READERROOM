// src/shaders/EmbersShader.js

export const EmbersShader = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

varying vec2 v_uv;

float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p) {
    p = fract(p * vec3(.1031, .1030, .0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yzz) * p.zyx);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), f.x),
            mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), f.x), f.y),
        mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), f.x),
            mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), f.x), f.y), f.z
    );
}

vec3 RenderEmberLayer(vec2 uv, float time, float layerDepth, vec3 emberColor) {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 gridScale = vec2(12.0, 6.0) * layerDepth;
    vec2 st = uv * aspect * gridScale;

    vec3 noisePos = vec3(uv * 2.0, time * 0.2 + layerDepth);
    float turbulence = noise3D(noisePos);
    
    st.y -= time * (0.8 / layerDepth);
    st.x += sin(time * 0.5 + st.y * 0.5) * 0.3 + turbulence * 0.5;

    vec2 id = floor(st);
    vec2 gv = fract(st) - 0.5;

    float rnd = hash12(id);
    vec2 offset = vec2(
        sin(time * 1.5 + rnd * 6.28) * 0.3,
        cos(time * 1.2 + rnd * 6.28) * 0.3
    );

    float dist = length(gv - offset);
    float radius = (0.04 + rnd * 0.05) / layerDepth;
    float core = smoothstep(radius, 0.0, dist);
    float halo = exp(-dist * (15.0 * layerDepth));

    float flicker = sin(time * (3.0 + rnd * 5.0) + rnd * 100.0) * 0.5 + 0.5;
    flicker = pow(flicker, 2.0) * 0.8 + 0.2;

    return (core + halo * 1.5) * emberColor * flicker;
}

float RenderDustMotes(vec2 uv, float time) {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 st = uv * aspect * 25.0;

    st.y += time * 0.08;
    st.x += cos(time * 0.05 + st.y * 0.2) * 0.4;

    vec2 id = floor(st);
    vec2 gv = fract(st) - 0.5;

    float rnd = hash12(id);
    vec2 offset = vec2(
        sin(time * 0.4 + rnd * 6.28) * 0.35,
        cos(time * 0.3 + rnd * 6.28) * 0.35
    );

    float dist = length(gv - offset);
    float mote = smoothstep(0.12, 0.0, dist) * exp(-dist * 8.0);
    float shimmer = sin(time * 1.5 + rnd * 50.0) * 0.5 + 0.5;
    
    return mote * shimmer * 0.35;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float t = u_time * 0.7;

    vec3 bgColor = mix(vec3(0.04, 0.02, 0.06), vec3(0.12, 0.04, 0.02), 1.0 - uv.y);

    vec3 hotEmberColor = vec3(1.0, 0.55, 0.15);
    vec3 deepEmberColor = vec3(0.95, 0.2, 0.05);

    vec3 embersBg = RenderEmberLayer(uv, t, 1.8, deepEmberColor);
    vec3 embersMid = RenderEmberLayer(uv, t, 1.0, hotEmberColor);
    vec3 embersFg = RenderEmberLayer(uv, t, 0.6, hotEmberColor * 1.2);

    float dust = RenderDustMotes(uv, t);
    vec3 dustColor = vec3(0.9, 0.8, 0.6) * dust;

    vec3 finalColor = bgColor + embersBg + embersMid + embersFg + dustColor;

    vec2 centerUV = uv - 0.5;
    float vignette = 1.0 - dot(centerUV, centerUV) * 0.8;
    finalColor *= clamp(vignette, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;