const tfragment = /* glsl */ `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;

uniform sampler2D uSampler;
uniform sampler2D uAddMap;


void main(void) {
    float mix = 1.0;
    vec4 colOrig = texture2D(uSampler, vUv);
    vec4 colAdd = texture2D(uAddMap, vUv);
  gl_FragColor = (colOrig * mix) + (colAdd * (1.0-mix));
}
`

const mixer = /* glsl */ `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;

uniform sampler2D uOrig;
uniform sampler2D uAdd;
uniform float uMix;

void main(void) {
    vec4 colOrig = texture2D(uOrig, vUv);
    vec4 colAdd = texture2D(uAdd, vUv);
    gl_FragColor =  (colOrig * uMix) + (colAdd * (1.0-uMix));
}
`
const postFragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
varying highp vec2 vUv;

uniform sampler2D uSampler;
uniform float uWhiter;
uniform float uDimmer;
uniform float uBright;

void main(void) {
  // gl_FragColor = texture2D(uSampler, vUv);
  vec4 dimmer =  mix( texture2D(tMap, vUv), vec4(0,0,0, 1),  uDimmer ) ;
  gl_FragColor = mix( dimmer, vec4(1,1,1, 1),  uWhiter ) ;
}
`
const displacement = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    uniform sampler2D tMap;
    uniform sampler2D tOrigMap;
    uniform sampler2D tFluid;
    uniform float tMix;
    uniform bool tDebug;
    varying vec2 vUv;
    void main() {
        vec3 fluid = texture2D(tFluid, vUv).rgb;
        vec2 uvDisp = vUv - fluid.rg * 0.00009;
        vec2 uvOrig = vUv - fluid.rg * 0.0001;
        vec4 dispCol = texture2D(tMap, uvDisp);
        vec4 origCol = texture2D(tOrigMap, uvOrig);
        // gl_FragColor = dispCol;
        if(tDebug){
            gl_FragColor = vec4(fluid, 1);
        } else {
            gl_FragColor = (dispCol * tMix) + (origCol * (1.0 - tMix));
        }
        
    }
`
const fragment = /* glsl */ `
    precision highp float;
    uniform sampler2D tMap;
    uniform sampler2D tFluid;
    uniform float uTime;
    uniform float uWhiter;
    varying vec2 vUv;
    void main() {
        vec3 fluid = texture2D(tFluid, vUv).rgb;
        // float bright = 0.5 * (fluid.r + fluid.g);
        // float tresholdr = mix(0.0, fluid.r, step(0.5, bright));
        // float tresholdg = mix(0.0, fluid.g, step(0.5, bright));
        // vec2 ft = vec2(tresholdr, tresholdg);
        vec2 uv = vUv - fluid.rg * 0.00001;
        //gl_FragColor = mix( texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), step(0.5, vUv.x) ) ;
        //gl_FragColor = mix( texture2D(tMap, uv), vec4(fluid, 1), step(0.5, vUv.x) ) ;
        
        // Oscillate between fluid values and the distorted scene
         //gl_FragColor = mix(texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), smoothstep(0.0, 0.7, sin(uTime)));
         gl_FragColor = mix(texture2D(tMap, uv), vec4(1,1,1, 1), smoothstep(0.5, 1.0, uTime));
         //gl_FragColor = texture2D(tMap, vUv);
    }
`
const baseVertex2 = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main () {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`
const baseVertex = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
        vUv = uv;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(position, 0, 1);
    }
`

const clearShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`

const splatShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`

const advectionManualFilteringShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
    }
`

const advectionShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`

const divergenceShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`

const curlShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`

const vorticityShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`

const pressureShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`

const gradientSubtractShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`

export default {
  tfragment,
  fragment,
  baseVertex2,
  baseVertex, // fluid vertex
  clearShader,
  splatShader,
  advectionManualFilteringShader,
  advectionShader,
  divergenceShader,
  curlShader,
  vorticityShader,
  pressureShader,
  gradientSubtractShader,
  postFragment,
  displacement,
  mixer
}
