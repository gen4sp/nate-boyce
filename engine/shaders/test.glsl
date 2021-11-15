vec2 iResolution=vec2(600,400);
uniform float time;
void main()
{
   // Normalized pixel coordinates (from 0 to 1)
   vec2 uv=gl_FragCoord.xy/iResolution.xy;
   
   // // Time varying pixel color
   vec3 col=.5+.5*cos(5.+uv.xyx+vec3(0,2,4)+time);
   
   // // Output to screen
   gl_FragColor=vec4(col,1.);
   // gl_FragColor=vec4(sin(time*gl_FragCoord.x/1000.),0.,0.,1.);
}