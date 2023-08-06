#version 300 es
precision mediump float;

uniform int u_N;
in vec4 out_Color;
in vec2 out_Ht;
out vec4 fragment;

void main() {
  fragment = vec4(out_Ht, 0.0, 1.0);
  //fragment = vec4(1.0, 1.0, 1.0, 1.0);
}