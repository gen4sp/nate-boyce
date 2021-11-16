#version 110

varying vec2 vertex_uv;

uniform sampler2D texture;
uniform sampler2D displace_map;
uniform float maximum;
uniform float time;

void
main (void)
{
  float time_e      = time * 0.001;

  vec2 uv_t         = vec2(vertex_uv.s + time_e, vertex_uv.t + time_e);
  vec4 displace     = texture2D(displace_map, uv_t);
 
  float displace_k  = displace.g * maximum;
  vec2 uv_displaced = vec2(vertex_uv.x + displace_k,
                           vertex_uv.y + displace_k);

  gl_FragColor      = texture2D(texture, uv_displaced);
}