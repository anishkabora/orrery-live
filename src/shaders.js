/* ============================================================
   SHADERS — GLSL for sun, gas giants, Earth, rings, interiors,
   black holes, particles. All include log-depth chunks.
   ============================================================ */
(function (O) {

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*snoise(p);p*=2.03;a*=0.5;}return v;}
`;
const VHEAD = `\n#include <common>\n#include <logdepthbuf_pars_vertex>\n`;
const VTAIL = `\n#include <logdepthbuf_vertex>\n`;
const FHEAD = `\n#include <logdepthbuf_pars_fragment>\n`;
const FTAIL = `\n#include <logdepthbuf_fragment>\n`;
O.SH = {NOISE, VHEAD, VTAIL, FHEAD, FTAIL};

const sphereVert = `${VHEAD}
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP; varying vec2 vUv;
void main(){
  vObj = normalize(position); vUv = uv;
  vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  ${VTAIL}
}`;

/* ---------- SUN ---------- */
O.sunMaterial = () => new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
  void main(){
    vec3 p = vObj*4.0;
    float t = uTime*0.04;
    float gran = snoise(p*9.0 + vec3(t*3.0, -t*2.0, t));
    float n = fbm(p + vec3(t, t*0.7, -t*0.5));
    float cells = 0.5 + 0.5*snoise(p*22.0 + vec3(0.0, t*5.0, 0.0));
    vec3 hot = vec3(1.0,0.93,0.70), mid = vec3(1.0,0.62,0.16), dark = vec3(0.75,0.25,0.03);
    vec3 col = mix(mid, hot, clamp(0.55 + n*0.6 + gran*0.18, 0.0, 1.0));
    col *= 0.86 + cells*0.18;
    float spot = smoothstep(0.80, 0.86, snoise(vObj*5.5 + vec3(13.0, t*0.25, 7.0))) * smoothstep(0.5,0.12,abs(vObj.y));
    float pen = smoothstep(0.72, 0.80, snoise(vObj*5.5 + vec3(13.0, t*0.25, 7.0))) * smoothstep(0.5,0.12,abs(vObj.y));
    col = mix(col, col*0.6, pen*0.6);
    col = mix(col, dark*0.35, spot*0.85);
    vec3 V = normalize(cameraPosition - vWP);
    float mu = clamp(dot(normalize(vWN), V), 0.0, 1.0);
    col *= 0.42 + 0.58*pow(mu, 0.45);         // limb darkening
    col += vec3(1.0,0.5,0.1)*pow(1.0-mu, 3.0)*0.35;
    gl_FragColor = vec4(col*1.25, 1.0);
    ${FTAIL}
  }`
});

/* ---------- GAS GIANT / CLOUD WORLD ----------
   flow-map shear: each latitude advects at its wind speed; two phases
   cross-fade so the field never shears into streaks. */
O.gasMaterial = (o) => new THREE.ShaderMaterial({
  uniforms: {
    uTime: {value: 0}, uPal: {value: o.palette}, uWind: {value: o.wind}, uSun: {value: new THREE.Vector3()},
    uWindScale: {value: o.windScale || 1}, uTurb: {value: o.turb || 1}, uSpot: {value: o.spot || new THREE.Vector4(0, 0, 0, 0)},
    uSpotCol: {value: new THREE.Color(o.spotCol || '#c0543a')}, uHex: {value: o.hex ? 1 : 0}, uAmb: {value: 0.05},
    uRim: {value: new THREE.Color(o.rim || '#ffffff')}, uRimK: {value: o.rimK || 0.25}, uStorm: {value: o.storm || 0},
    uHighlight: {value: 0}, uDetail: {value: 0}, uReal: {value: 0}, uLight: {value: o.lightning || 0}
  },
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime, uWindScale, uTurb, uHex, uAmb, uRimK, uStorm, uHighlight, uDetail, uReal, uLight;
  uniform sampler2D uPal, uWind; uniform vec3 uSun; uniform vec4 uSpot; uniform vec3 uSpotCol, uRim;
  varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
  vec3 sampleField(float lat, float lon, float shift, float seed){
    float l2 = lon + shift;
    vec3 sp = vec3(cos(lat)*cos(l2), cos(lat)*sin(l2), sin(lat));
    float warp = fbm(vec3(sp.xy*1.6, sp.z*3.0) + seed) * 0.7;
    float n = fbm(vec3(sp.xy*2.2, sp.z*7.0) + warp + seed + uTime*0.002);
    float latN = (lat/3.14159265 + 0.5) + n*0.016*uTurb + warp*0.006*uTurb;
    vec3 c = texture2D(uPal, vec2(clamp(latN,0.0,1.0), 0.5)).rgb;
    float fine = snoise(vec3(sp.xy*5.0, sp.z*16.0) + warp*2.0 + seed);
    c *= 0.95 + 0.09*fine*uTurb;
    c = mix(c, c*vec3(1.06,1.02,0.96), smoothstep(0.2,0.6,n)*0.5*uTurb);
    return c;
  }
  void main(){
    vec3 o = normalize(vObj);
    float lat = asin(clamp(o.y,-1.0,1.0));
    float lon = atan(-o.z, o.x);
    float w = texture2D(uWind, vec2(lat/3.14159265 + 0.5, 0.5)).r*2.0 - 1.0;
    float rate = w*uWindScale / max(cos(lat), 0.15);
    float T = 1.2;
    float ph1 = fract(uTime/T), ph2 = fract(uTime/T + 0.5);
    vec3 c1 = sampleField(lat, lon, -rate*ph1*T, 0.0);
    vec3 c2 = sampleField(lat, lon, -rate*ph2*T, 3.7);
    float k = abs(ph1*2.0 - 1.0);
    vec3 col = mix(c1, c2, k);
    // storm oval (e.g. Great Red Spot / Great Dark Spot), drifts slowly
    if (uSpot.w > 0.0){
      float slon = uSpot.y - uTime*uSpot.z;
      vec3 sc = vec3(cos(uSpot.x)*cos(slon), sin(uSpot.x), -cos(uSpot.x)*sin(slon));
      vec3 east = normalize(cross(vec3(0.0,1.0,0.0), sc)); vec3 north = cross(sc, east);
      vec2 q = vec2(dot(o-sc, east)/(uSpot.w*1.7), dot(o-sc, north)/uSpot.w);
      float r = length(q);
      float ang = atan(q.y,q.x) + uTime*0.05/(0.25+r);
      float sw = snoise(vec3(cos(ang)*r*3.0, sin(ang)*r*3.0, uTime*0.01))*0.5+0.5;
      float m = smoothstep(1.0, 0.55, r);
      col = mix(col, mix(uSpotCol*0.8, uSpotCol*1.25, sw), m*0.9);
      col = mix(col, col*1.18, smoothstep(1.25,1.0,r)*(1.0-m)*0.6);
    }
    // north-polar hexagon (Saturn)
    if (uHex > 0.5 && o.y > 0.88){
      float a = atan(o.z, o.x) + uTime*0.0;
      float colat = acos(clamp(o.y,-1.0,1.0));
      float seg = 3.14159265/3.0;
      float hexR = 0.27 / cos(mod(a, seg) - seg*0.5);
      float edge = smoothstep(0.03, 0.0, abs(colat - hexR));
      float inside = smoothstep(hexR+0.01, hexR-0.01, colat);
      col = mix(col, col*vec3(0.80,0.86,0.95), inside*0.7);
      col = mix(col, vec3(0.93,0.86,0.68), edge*0.6);
      col = mix(col, vec3(0.35,0.42,0.55), smoothstep(0.08,0.0,colat)*0.8);
    }
    // close-range detail: small eddies & white ovals
    if (uDetail > 0.01) {
      float l3 = lon - rate * ph1 * T;
      vec3 q3 = vec3(cos(lat)*cos(l3), cos(lat)*sin(l3), sin(lat));
      float e1 = snoise(vec3(q3.xy * 18.0, q3.z * 60.0));
      float e2 = snoise(vec3(q3.xy * 46.0, q3.z * 140.0));
      col *= 1.0 + (e1 * 0.06 + e2 * 0.035) * uDetail * uTurb;
      float ov = smoothstep(0.82, 0.9, snoise(vec3(q3.xy * 9.0, q3.z * 24.0) + 7.0));
      col = mix(col, vec3(0.97, 0.95, 0.9), ov * 0.55 * uDetail * uTurb);
    }
    // lighting
    vec3 N = normalize(vWN); vec3 L = normalize(uSun - vWP); vec3 V = normalize(cameraPosition - vWP);
    float d = dot(N, L);
    float lit = smoothstep(-0.12, 0.35, d);
    float mu = max(dot(N,V),0.0);
    vec3 outc = col * (uAmb + lit*(0.85 + 0.15*mu));
    outc += uRim * pow(1.0-mu, 2.5) * uRimK * smoothstep(-0.25, 0.4, d);
    outc += vec3(0.95,0.7,0.2)*uHighlight*0.25;
    if (uLight > 0.0) { // lightning in deep water clouds, seen on the night side (Juno, Cassini)
      vec2 cell = floor(vec2(lon * 40.0, lat * 40.0));
      float h1 = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
      float fl = step(fract(h1 * 51.7 + uReal * (0.3 + h1 * 0.4)), 0.004);
      vec2 f = fract(vec2(lon * 40.0, lat * 40.0)) - 0.5;
      outc += vec3(0.8, 0.85, 1.0) * fl * (1.0 - lit) * smoothstep(0.5, 0.0, length(f)) * 2.0 * uLight;
    }
    gl_FragColor = vec4(outc, 1.0);
    ${FTAIL}
  }`
});

/* ---------- EARTH SURFACE: day/night, relief shading, ocean glint, lightning ---------- */
O.earthMaterial = (t) => new THREE.ShaderMaterial({
  uniforms: {uDay: {value: t.day}, uNight: {value: t.night}, uSpec: {value: t.spec}, uHeight: {value: t.height}, uSun: {value: new THREE.Vector3()},
    uPole: {value: new THREE.Vector3(0, 1, 0)}, uTime: {value: 0}, uDetail: {value: 0}, uTexel: {value: new THREE.Vector2(1 / 2048, 1 / 1024)}, uRelief: {value: 4.0}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform sampler2D uDay, uNight, uSpec, uHeight; uniform vec3 uSun, uPole; uniform float uTime, uDetail, uRelief; uniform vec2 uTexel;
  varying vec3 vWN; varying vec3 vWP; varying vec2 vUv; varying vec3 vObj;
  float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec3 N0 = normalize(vWN); vec3 L = normalize(uSun - vWP); vec3 V = normalize(cameraPosition - vWP);
    vec3 T = normalize(cross(uPole, N0)); vec3 B = cross(N0, T);
    float hx = texture2D(uHeight, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uHeight, vUv - vec2(uTexel.x, 0.0)).r;
    float hy = texture2D(uHeight, vUv + vec2(0.0, uTexel.y)).r - texture2D(uHeight, vUv - vec2(0.0, uTexel.y)).r;
    float spec = texture2D(uSpec, vUv).r;
    vec3 N = normalize(N0 - uRelief * (hx * T + hy * B) * (1.0 - spec));
    float d0 = dot(N0, L), d = dot(N, L);
    vec3 day = texture2D(uDay, vUv).rgb;
    if (uDetail > 0.01) {
      float dn = snoise(vObj * 160.0) * 0.6 + snoise(vObj * 420.0) * 0.4;
      day *= 1.0 + dn * 0.07 * uDetail * (1.0 - spec * 0.7);
    }
    vec3 night = texture2D(uNight, vUv).rgb;
    float dayK = smoothstep(-0.08, 0.18, d0);
    vec3 H = normalize(L + V);
    float sp = pow(max(dot(N0, H), 0.0), 70.0) * spec * 1.0 * dayK + pow(max(dot(N0, H), 0.0), 8.0) * spec * 0.08 * dayK;
    vec3 col = day * (0.025 + 1.05 * max(mix(d0, d, 0.85), 0.0)) + vec3(1.0, 0.9, 0.75) * sp;
    col += vec3(0.9, 0.35, 0.1) * smoothstep(0.2, 0.0, abs(d0)) * 0.08;
    col += night * 1.5 * (1.0 - dayK);
    // lightning: Earth averages ~44 flashes per second, mostly over tropical land
    float lat = (vUv.y - 0.5) * 3.14159;
    vec2 cell = floor(vUv * vec2(720.0, 360.0));
    float h1 = hsh(cell);
    float flash = step(fract(h1 * 97.3 + uTime * (0.35 + h1 * 0.5)), 0.0025);
    float land = 1.0 - spec * 0.8;
    vec2 f = fract(vUv * vec2(720.0, 360.0)) - 0.5;
    col += vec3(0.75, 0.82, 1.0) * flash * land * smoothstep(0.7, 0.2, abs(lat)) * (1.0 - dayK) * smoothstep(0.5, 0.0, length(f)) * 2.5;
    float mu = max(dot(N0, V), 0.0);
    col = mix(col, vec3(0.35, 0.6, 1.0) * max(d0 + 0.2, 0.0), pow(1.0 - mu, 3.0) * 0.55);
    gl_FragColor = vec4(col, 1.0);
    ${FTAIL}
  }`
});

/* ---------- EARTH CLOUDS: lit, with fine detail that sharpens up close ---------- */
O.cloudMaterial = () => new THREE.ShaderMaterial({
  uniforms: {uMap: {value: null}, uOp: {value: 0}, uSun: {value: new THREE.Vector3()}, uDetail: {value: 0}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform sampler2D uMap; uniform float uOp, uDetail; uniform vec3 uSun;
  varying vec3 vWN; varying vec3 vWP; varying vec2 vUv; varying vec3 vObj;
  void main(){
    if (uOp <= 0.0) discard;
    float a = texture2D(uMap, vUv).a;
    float n = snoise(vObj * 90.0) * 0.55 + snoise(vObj * 260.0) * 0.3 + snoise(vObj * 700.0) * 0.15;
    a = clamp(a + (n * 0.32 - 0.04) * (0.35 + 0.65 * uDetail) * smoothstep(0.02, 0.4, a), 0.0, 1.0);
    a = smoothstep(0.08, 0.85, a);
    vec3 N = normalize(vWN); vec3 L = normalize(uSun - vWP);
    float d = dot(N, L);
    vec3 col = vec3(1.0) * (0.04 + 1.0 * smoothstep(-0.15, 0.4, d)) * (0.85 + 0.15 * n);
    col = mix(col, vec3(1.0, 0.6, 0.35) * 0.8, smoothstep(0.25, 0.0, abs(d)) * 0.5);
    gl_FragColor = vec4(col, a * uOp);
    ${FTAIL}
  }`,
  transparent: true, depthWrite: false
});

/* ---------- ATMOSPHERE SHELL (rim glow, sun-aware) ---------- */
O.atmoMaterial = (color, power, strength) => new THREE.ShaderMaterial({
  uniforms: {uSun: {value: new THREE.Vector3()}, uColor: {value: new THREE.Color(color)}, uPow: {value: power || 3}, uK: {value: strength || 1}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}
  uniform vec3 uSun, uColor; uniform float uPow, uK;
  varying vec3 vWN; varying vec3 vWP;
  void main(){
    vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vWP); vec3 L = normalize(uSun - vWP);
    float mu = dot(N, V);
    float rim = pow(clamp(1.0 - abs(mu), 0.0, 1.0), uPow);
    float sun = smoothstep(-0.35, 0.5, dot(N, L));
    vec3 c = mix(vec3(1.0,0.45,0.15), uColor, smoothstep(-0.1, 0.4, dot(N,L)));
    gl_FragColor = vec4(c, rim * sun * uK);
    ${FTAIL}
  }`,
  transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
});

/* ---------- RINGS (with planet shadow) ---------- */
O.ringMaterial = (texture, inner, outer, opacity) => new THREE.ShaderMaterial({
  uniforms: {uTex: {value: texture}, uSun: {value: new THREE.Vector3()}, uPlanet: {value: new THREE.Vector3()}, uPR: {value: 1}, uIn: {value: inner}, uOut: {value: outer}, uOp: {value: opacity || 1}},
  vertexShader: `${VHEAD}
  varying vec3 vWP; varying float vR;
  void main(){ vR = length(position.xy); vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; ${VTAIL} }`,
  fragmentShader: `${FHEAD}
  uniform sampler2D uTex; uniform vec3 uSun, uPlanet; uniform float uPR, uIn, uOut, uOp;
  varying vec3 vWP; varying float vR;
  void main(){
    float u = (vR - uIn)/(uOut - uIn);
    if (u < 0.0 || u > 1.0) discard;
    vec4 t = texture2D(uTex, vec2(u, 0.5));
    vec3 L = normalize(uSun - vWP);
    vec3 oc = vWP - uPlanet; float b = dot(oc, L); float c = dot(oc,oc) - uPR*uPR;
    float shadow = (b < 0.0 && b*b - c > 0.0) ? 0.12 : 1.0;
    gl_FragColor = vec4(t.rgb * shadow * 1.05, t.a * uOp);
    ${FTAIL}
  }`,
  transparent: true, side: THREE.DoubleSide, depthWrite: false
});

/* ---------- INTERIOR CUTAWAY FACE ----------
   up to 6 layers; flow>0 animates convection. uv centre (0.5,0.5) */
O.interiorMaterial = (layers) => {
  const r = [], c = [], f = [];
  for (let i = 0; i < 6; i++) {
    const L = layers[Math.min(i, layers.length - 1)];
    r.push(i < layers.length ? L.r1 : 2.0); c.push(new THREE.Color(L.color)); f.push(i < layers.length ? L.flow : 0);
  }
  return new THREE.ShaderMaterial({
    uniforms: {uR: {value: r}, uC: {value: c}, uF: {value: f}, uN: {value: layers.length}, uTime: {value: 0}, uHi: {value: -1}, uSun: {value: new THREE.Vector3()}},
    vertexShader: `${VHEAD}
    varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); ${VTAIL} }`,
    fragmentShader: `${FHEAD}${NOISE}
    uniform float uR[6]; uniform vec3 uC[6]; uniform float uF[6]; uniform int uN; uniform float uTime; uniform float uHi;
    varying vec2 vUv;
    void main(){
      vec2 q = (vUv - 0.5)*2.0; float r = length(q);
      if (r > 1.0) discard;
      int idx = 0; float r0 = 0.0, r1 = uR[0];
      for (int i = 0; i < 6; i++){ if (i < uN && r > (i==0?0.0:uR[i-1])) { idx = i; r0 = (i==0?0.0:uR[i-1]); r1 = uR[i]; } }
      vec3 col = uC[0]; float fl = uF[0];
      for (int i = 0; i < 6; i++){ if (i == idx){ col = uC[i]; fl = uF[i]; } }
      float a = atan(q.y, q.x);
      // heat gradient inside each layer
      float tl = clamp((r - r0)/max(r1 - r0, 1e-3), 0.0, 1.0);
      col *= 1.12 - tl*0.25;
      if (fl > 0.0){
        float sp = uTime*0.06*fl;
        float cells = snoise(vec3(q*(5.0/(1.0+fl*0.2)), r*12.0 - sp*2.0) + vec3(0.0, 0.0, sp*0.6));
        float rolls = sin(a*14.0 + snoise(vec3(r*6.0, a*2.0, sp))*3.0 + sp*3.0);
        col *= 0.88 + 0.12*cells + 0.06*rolls;
        col += vec3(1.0,0.6,0.2)*max(cells,0.0)*0.06*fl;
      } else {
        col *= 0.95 + 0.05*snoise(vec3(q*20.0, 1.0));
      }
      float edge = smoothstep(0.006, 0.0, abs(r - r1)) * (r1 < 0.999 ? 1.0 : 0.0);
      col = mix(col, vec3(0.04,0.06,0.10), edge*0.8);
      if (float(idx) == uHi) col = mix(col, vec3(1.0,0.78,0.36), 0.28 + 0.12*sin(uTime*4.0));
      gl_FragColor = vec4(col, 1.0);
      ${FTAIL}
    }`,
    side: THREE.DoubleSide
  });
};

/* ---------- POINTS (stars, particles, nebulae) ---------- */
O.pointsMaterial = (opts) => new THREE.ShaderMaterial({
  uniforms: {uScale: {value: opts.scale || 300}, uMax: {value: opts.max || 64}, uMin: {value: opts.min || 0.0}, uOp: {value: opts.opacity || 1}, uTime: {value: 0}, uTw: {value: opts.twinkle || 0}},
  vertexShader: `${VHEAD}
  attribute float size; attribute vec3 color; varying vec3 vC; varying float vA;
  uniform float uScale, uMax, uMin, uTime, uTw;
  void main(){
    vC = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float s = size * uScale / max(-mv.z, 0.0001);
    vA = clamp(s / max(uMin, 0.0001), 0.0, 1.0);
    if (uMin <= 0.0) vA = 1.0;
    gl_PointSize = clamp(s, max(uMin, 1.0), uMax);
    if (uTw > 0.0) vA *= 0.75 + 0.25*sin(uTime*3.0 + position.x*13.0 + position.y*7.0);
    gl_Position = projectionMatrix * mv;
    ${VTAIL}
  }`,
  fragmentShader: `${FHEAD}
  uniform float uOp; varying vec3 vC; varying float vA;
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r); a = a*a;
    gl_FragColor = vec4(vC * (1.0 + smoothstep(0.15,0.0,r)), a * uOp * vA);
    ${FTAIL}
  }`,
  transparent: true, depthWrite: false, blending: opts.normal ? THREE.NormalBlending : THREE.AdditiveBlending
});

/* ---------- ACCRETION DISK ---------- */
O.diskMaterial = (inner, outer, opts) => new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uIn: {value: inner}, uOut: {value: outer}, uHot: {value: new THREE.Color(opts && opts.hot || '#fff4e0')}, uCool: {value: new THREE.Color(opts && opts.cool || '#ff5a1a')}},
  vertexShader: `${VHEAD}
  varying vec2 vP; varying vec3 vWP; void main(){ vP = position.xy; vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; ${VTAIL} }`,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime, uIn, uOut; uniform vec3 uHot, uCool;
  varying vec2 vP; varying vec3 vWP;
  void main(){
    float r = length(vP); float u = (r - uIn)/(uOut - uIn);
    if (u < 0.0 || u > 1.0) discard;
    float a = atan(vP.y, vP.x);
    float omega = 1.6 / pow(r/uIn, 1.5);
    float sp = a + uTime*omega;
    float turb = fbm(vec3(cos(sp)*r*0.8, sin(sp)*r*0.8, r*0.25 - uTime*0.05));
    float streaks = 0.6 + 0.4*sin(sp*3.0 + r*2.5 + turb*5.0);
    vec3 col = mix(uHot, uCool, pow(u, 0.6));
    float I = pow(1.0 - u, 1.6) * (0.65 + 0.55*turb) * streaks;
    // relativistic beaming: approaching side brighter (fixed side in disk frame, rotating view-independent approx)
    vec3 tangent = normalize(vec3(-sin(a), cos(a), 0.0));
    float beam = 1.0 + 0.6*sin(a);
    float edgeFade = smoothstep(0.0, 0.06, u) * smoothstep(1.0, 0.7, u);
    gl_FragColor = vec4(col * I * beam * 2.2, edgeFade * clamp(I*1.6, 0.0, 1.0));
    ${FTAIL}
  }`,
  transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
});

/* ---------- BLACK HOLE BILLBOARD: shadow + photon ring + lensed far-side arc ---------- */
O.bhBillboardMaterial = () => new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uEdge: {value: 0}, uColor: {value: new THREE.Color('#ffb070')}},
  vertexShader: `${VHEAD}
  varying vec2 vUv; void main(){ vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0,0.0,0.0,1.0);
    vec2 sc = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    mv.xy += position.xy * sc;
    gl_Position = projectionMatrix * mv; ${VTAIL} }`,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime, uEdge; uniform vec3 uColor; varying vec2 vUv;
  void main(){
    vec2 q = (vUv - 0.5)*2.0; float r = length(q);
    float shadowR = 0.30;
    float ring = exp(-pow((r - shadowR*1.06)/0.012, 2.0)) * 1.6;
    float glow = exp(-pow((r - shadowR*1.1)/0.08, 2.0)) * 0.45;
    float a = atan(q.y, q.x);
    float flick = 0.8 + 0.2*snoise(vec3(a*3.0, r*4.0, uTime*0.3));
    // lensed image of disk's far side wraps over the top & under the bottom
    float arcTop = exp(-pow((r - 0.42)/0.07, 2.0)) * smoothstep(0.0, 0.6, q.y/r) ;
    float arcBot = exp(-pow((r - 0.36)/0.04, 2.0)) * smoothstep(0.0, 0.6, -q.y/r) * 0.55;
    float lens = (arcTop + arcBot) * uEdge * flick;
    vec3 col = uColor * (ring*flick + glow + lens*1.4);
    float alpha = clamp(ring + glow + lens, 0.0, 1.0);
    if (r < shadowR) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); }
    else { if (alpha < 0.01) discard; gl_FragColor = vec4(col, alpha); }
    ${FTAIL}
  }`,
  transparent: true, depthWrite: false
});

/* Generic emissive star sphere (deep space) */
O.starMaterial = (rgb, opts) => new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uC: {value: new THREE.Color(rgb[0], rgb[1], rgb[2])}, uBoil: {value: opts && opts.boil || 0.3}, uPulse: {value: 0}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime, uBoil, uPulse; uniform vec3 uC; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
  void main(){
    float n = fbm(vObj*3.0 + vec3(uTime*0.03, -uTime*0.02, uTime*0.01));
    float big = snoise(vObj*1.4 + uTime*0.01);
    vec3 col = uC * (1.0 + n*uBoil + big*uBoil*0.6);
    vec3 V = normalize(cameraPosition - vWP); float mu = clamp(dot(normalize(vWN),V),0.0,1.0);
    col *= 0.5 + 0.5*pow(mu,0.5);
    col *= 1.0 + uPulse;
    gl_FragColor = vec4(col*1.3, 1.0);
    ${FTAIL}
  }`
});

/* Expanding shell (supernova / remnant) */
O.shellMaterial = (color) => new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uC: {value: new THREE.Color(color)}, uOp: {value: 1}},
  vertexShader: sphereVert,
  fragmentShader: `${FHEAD}${NOISE}
  uniform float uTime, uOp; uniform vec3 uC; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
  void main(){
    vec3 V = normalize(cameraPosition - vWP); float mu = abs(dot(normalize(vWN), V));
    float n = fbm(vObj*4.0 + uTime*0.05);
    float fil = smoothstep(0.1, 0.6, n + 0.3);
    float rim = pow(1.0 - mu, 2.0);
    float a = (0.15 + rim*0.85) * fil * uOp;
    gl_FragColor = vec4(uC*(0.8+n), a);
    ${FTAIL}
  }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
});

/* Simple lit textured sphere using MeshStandardMaterial */
O.rockyMaterial = (map, color) => new THREE.MeshStandardMaterial({map: map || null, color: map ? 0xffffff : new THREE.Color(color), roughness: 0.95, metalness: 0});

})(window.ORR);
