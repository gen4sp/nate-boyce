 precision highp float;
uniform sampler2D tMap;
uniform sampler2D tFluid;
uniform float uTime;
varying vec2 vUv;
void main() {
    vec3 fluid = texture2D(tFluid, vUv).rgb;
    vec2 uv = vUv - fluid.rg * 0.0002;
    gl_FragColor = mix( texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), step(0.5, vUv.x) ) ;
    // Oscillate between fluid values and the distorted scene
    // gl_FragColor = mix(texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), smoothstep(0.0, 0.7, sin(uTime)));
}