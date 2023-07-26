#version 300 es
precision highp float;

in vec3 in_VertexPosition;
in vec4 in_Color;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform float u_Time;
uniform int u_WaveNumber;
// v(speed) = λν(wave length * frequency) = λ/T
uniform float[8] u_Amplitude; // A
uniform float[8] u_Length; // λ
uniform float[8] u_Cycle; // T
uniform vec2[8] u_Direction; // D
out vec4 out_Color;

const float PI  = 3.1415926;
const float INVPI = 1.0 / PI;

float SinusoidalWave(vec2 pos, float A, float rambda, float T, vec2 dir, float t)
{
	float k = 2.0 * PI / rambda;
	float x = dot(dir, pos);
	float omega = 2.0 * PI / T;
	float phase = k * x + omega * t;
	return A * sin(phase);
}

void main() {
	vec2 posXY = vec2(in_VertexPosition.x, in_VertexPosition.y);
	float posZ = 0.0;
	// TODO: FFT
	for(int i = 0; i < u_WaveNumber; i++)
	{
		posZ += SinusoidalWave(posXY, u_Amplitude[i], u_Length[i], u_Cycle[i], u_Direction[i], u_Time);
	}
	vec4 wavePosition = vec4(posXY, posZ, 1.0);

	out_Color = in_Color;
	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	gl_Position = mvpMatrix * wavePosition;
}