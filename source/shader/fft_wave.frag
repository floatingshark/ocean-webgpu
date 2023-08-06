#version 300 es
precision mediump float;

in vec4 out_Color;
in vec2 out_Ht;
in vec2 out_UV;
in vec2 out_UV_m;
uniform int u_N;
uniform sampler2D u_texH0;
uniform sampler2D u_texH0Re;
uniform sampler2D u_texH0Im;
out vec4 fragment;

float decode_RGBA_to_float(vec4 rgba ) {
  return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0) );
}

void main() {
  //fragment = vec4(out_Ht, 0.0, 1.0);

  //vec4 sampleReRGBA = texture(u_texH0Re, out_UV);
  //vec4 sampleImRGBA = texture(u_texH0Im, out_UV);
  //vec2 h0_k = vec2(decode_RGBA_to_float(sampleReRGBA), decode_RGBA_to_float(sampleImRGBA));
  //fragment = vec4(h0_k, 0.0, 1.0);

  //vec3 sampleColor = vec3(texture(u_texH0, out_UV_m));
  //fragment = vec4(sampleColor, 1.0);

  //fragment = texture(u_texH0Re, out_UV);
  fragment = vec4(1.0, 1.0, 1.0, 1.0);
}