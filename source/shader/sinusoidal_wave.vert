#version 300 es
precision highp float;

in vec3 in_VertexPosition;
in vec4 in_Color;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform float u_Time;
out vec4 out_Color;

const float PI  = 3.141592653589793;
const float INVPI = 1.0 / PI;

const float amplitude = 0.5;
const float speed = 0.001;
const vec2 direction = vec2(1.0, 1.0);
const float frequency = 1.0;

float SinusoidalWave(vec2 pos, float amp, float speed, vec2 dir, float freq, float time)
{
	float phase = dot(dir, pos) * freq + time * speed;
	return amp * sin(phase);
}

void main() {
	vec2 posXY = vec2(in_VertexPosition.x, in_VertexPosition.y);
	float posZ = SinusoidalWave(posXY, amplitude, speed, direction, frequency, u_Time);
	vec4 wavePosition = vec4(posXY, posZ, 1.0);

	out_Color = in_Color;
	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	gl_Position = mvpMatrix * wavePosition;
}