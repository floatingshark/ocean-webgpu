#version 300 es
precision highp float;

in vec4 out_Color;
out vec4 fragment;

void main() {
  fragment = out_Color;
}