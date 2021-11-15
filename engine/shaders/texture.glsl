varying vec2 vTextureCoord;

uniform sampler2D uSampler2;
uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform vec2 shadowDirection;
uniform float floorY;

void main(void){
   gl_FragColor=texture2D(uSampler2,vTextureCoord);
}
