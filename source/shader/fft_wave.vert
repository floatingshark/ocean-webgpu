#version 300 es
precision highp float;

layout (location = 0) in vec3 in_VertexPosition;
layout (location = 1) in vec4 in_VertexColor;
layout (location = 2) in int in_vertexIndex;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform float u_Time;
uniform int u_N;
uniform float u_A;
uniform float u_T;
uniform float u_f;
uniform float u_Phi;
uniform sampler2D u_texH0Re;
uniform sampler2D u_texH0Im;
out vec4 out_Color;
out vec2 out_Ht;
out vec2 out_UV;
out vec2 out_UV_m;

const float PI  = 3.1415926;
const float INVPI = 1.0 / PI;

float decode_RGBA_to_float(vec4 rgba ) {
  return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0) );
}

vec2 conjugate(vec2 arg)
{
	vec2 f2;
	f2.x = arg.x;
	f2.y = -arg.y;
	return f2;
}

vec2 complex_exp(float arg)
{
	return vec2(cos(arg), sin(arg));
}

vec2 complex_add(vec2 a, vec2 b)
{
	return vec2(a.x + b.x, a.y + b.y);
}

vec2 complex_mult(vec2 ab, vec2 cd)
{
	return vec2(ab.x * cd.x - ab.y * cd.y, ab.x * cd.y + ab.y * cd.x);
}

vec2 generate_spectrum(int x_index, int y_index)
{
	int Lx = u_N * 5 / 2;
	int Ly = u_N * 5 / 2;

	vec2 k;
	k.x = float(- u_N / 2 + x_index) * (2.0 * PI / float(Lx));
	k.y = float(- u_N / 2 + y_index) * (2.0 * PI / float(Ly));
	float k_len = sqrt(k.x * k.x + k.y * k.y);
	float omega = sqrt(9.81 * k_len);

	float t = u_Time / (u_T * 2.0 * PI);

	vec2 uv = vec2(float(x_index) / float(u_N), float(y_index) / float(u_N));
	vec2 uv_m = vec2(float(u_N - 1 - x_index) / float(u_N), float(u_N - 1 - y_index) / float(u_N));
	vec4 rgba_re = texture(u_texH0Re, uv);
	vec4 rgba_im = texture(u_texH0Im, uv);
	vec4 rgba_m_re = texture(u_texH0Re, uv_m);
	vec4 rgba_m_im = texture(u_texH0Im, uv_m);
	vec2 h0_k = vec2(decode_RGBA_to_float(rgba_re), decode_RGBA_to_float(rgba_im)) * sqrt(u_A * 0.5);
	vec2 h0_mk = vec2(decode_RGBA_to_float(rgba_m_re), decode_RGBA_to_float(rgba_m_im)) * sqrt(u_A * 0.5);
	
	return complex_add(complex_mult(h0_k, complex_exp(omega * t)), complex_mult(conjugate(h0_mk), complex_exp(-omega * t)));
}

void main() 
{
	out_Color = in_VertexColor;

	int index = in_vertexIndex;
	int x_index = index % u_N;
	int y_index = int(index / u_N);
	out_Ht = generate_spectrum(x_index, y_index);

	int x = x_index - u_N / 2;
	int y = y_index - u_N / 2;

	vec2 dftsum;
	for (int j = 0; j < u_N; j++)
	{
		int ky = -u_N / 2 + j;
		for (int i = 0; i < u_N; i++)
		{
			int kx = -u_N / 2 + i;
			float rad = float((kx * x + ky * y) % u_N) * (2.0f * PI / float(u_N)) * u_f + u_Phi;
			vec2 h = generate_spectrum(i, j);
			dftsum.x += h.x * cos(rad) - h.y * sin(rad);
			dftsum.y += h.y * cos(rad) + h.x * sin(rad);
		}
	}


	out_UV = vec2(float(x_index) / float(u_N), float(y_index) / float(u_N));
	out_UV_m = vec2(float(u_N - 1 - x_index) / float(u_N), float(u_N - 1 -y_index) / float(u_N));

	mat4 mvpMatrix = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix;
	vec3 position = in_VertexPosition;
	position[2] += dftsum[0] / 100.0;
	gl_Position = mvpMatrix * vec4(position, 1.0);
}