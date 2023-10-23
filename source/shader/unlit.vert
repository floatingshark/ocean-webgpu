#version 300 es

in vec3 in_VertexPosition;
in vec4 in_Color;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
out vec4 out_Color;

void main() {
	out_Color      = in_Color;
	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	gl_Position    = mvpMatrix * vec4(in_VertexPosition, 1.0);
}