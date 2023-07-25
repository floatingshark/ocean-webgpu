#version 300 es
precision highp float;

in vec3 in_VertexPosition;
in vec4 in_Color;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform float u_Time;
uniform int u_WaveNumber;
uniform float[8] u_Amplitude;
uniform float[8] u_Length;
uniform float[8] u_Speed;
uniform vec2[8] u_Direction;
out vec4 out_Color;

//const float PI  = 3.141592653589793;
//const float INVPI = 1.0 / PI;

float SinusoidalWave(vec2 pos, float amp, float len, float speed, vec2 dir, float time)
{
	float freq = 2.0 / len;
	float phase = dot(dir, pos) * freq + time * speed * freq;
	return amp * sin(phase);
}

void main() {
	vec2 posXY = vec2(in_VertexPosition.x, in_VertexPosition.y);
	float posZ = 0.0;
	// TODO: FFT
	for(int i = 0; i < u_WaveNumber; i++)
	{
		posZ += SinusoidalWave(posXY, u_Amplitude[i], u_Length[i], u_Speed[i], u_Direction[i], u_Time);
	}
	vec4 wavePosition = vec4(posXY, posZ, 1.0);

	out_Color = in_Color;
	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	gl_Position = mvpMatrix * wavePosition;
}