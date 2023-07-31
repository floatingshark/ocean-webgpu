#version 300 es
precision highp float;

in vec3 in_VertexPosition;
in vec4 in_Color;
in vec2 in_Spectrum;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform float u_Time;
out vec4 out_Color;

const float PI  = 3.1415926;
const float INVPI = 1.0 / PI;

const int div = 8;

void main() {

	// h = Σ_k h(k,t) * e^(ikx)
	// k = 2π/L + n, 2π/L * m
	// x = L/N * u
	// η_n(t) = Σ(-2/N->N/2) h_m(t) * e^(2πimn/N)

	out_Color = in_Color * vec4(in_Spectrum, 0.0, 1.0);
	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	gl_Position = mvpMatrix * vec4(in_VertexPosition, 1.0);
}