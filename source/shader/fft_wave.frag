#version 300 es
precision mediump float;

in vec4 out_Color;
in vec2 out_Ht;
in vec2 out_UV;
in vec2 out_UV_m;
uniform int u_N;
uniform sampler2D u_texH0;
uniform sampler2D u_texH0m;
out vec4 fragment;

void main() {
  fragment = vec4(out_Ht, 0.0, 1.0);
  //vec3 sampleColor = vec3(texture(u_texH0m, out_UV_m));
  //fragment = vec4(sampleColor, 1.0);
  //fragment = vec4(1.0, 1.0, 1.0, 1.0);
}