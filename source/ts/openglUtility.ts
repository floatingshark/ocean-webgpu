///
/// OpenGL utility
///
export const VERTEX_SIZE: number = 3;
export const COLOR_SIZE: number = 4;

export const MESH_2D_VERTICE: Float32Array = new Float32Array([
	-1.0, -1.0, 0.0,
	-1.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	1.0, -1.0, 0.0,
]);

export const MESH_2D_COLOR: Float32Array = new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	1.0, 1.0, 1.0, 1.0,
]);

export const MESH_2D_INDEX: Int32Array = new Int32Array([
	0, 1, 2,
	0, 2, 3
]);

export function createVertexShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
	const vertexShader: WebGLShader | null = glContext.createShader(glContext.VERTEX_SHADER)
	if (vertexShader) {
		glContext.shaderSource(vertexShader, source)
		glContext.compileShader(vertexShader)

		if (!glContext.getShaderParameter(vertexShader, glContext.COMPILE_STATUS)) {
			const info = glContext.getShaderInfoLog(vertexShader)
			console.warn(info);
		}
	}
	return vertexShader;
}

export function createFragmentShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
	const fragmentShader: WebGLShader | null = glContext.createShader(glContext.FRAGMENT_SHADER)
	if (fragmentShader) {
		glContext.shaderSource(fragmentShader, source)
		glContext.compileShader(fragmentShader)

		if (!glContext.getShaderParameter(fragmentShader, glContext.COMPILE_STATUS)) {
			const info = glContext.getShaderInfoLog(fragmentShader)
			console.warn(info);
		}
	}
	return fragmentShader;
}

export function createProgram(glContext: WebGLRenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram | null {
	const program: WebGLProgram | null = glContext.createProgram();
	if (program) {
		glContext.attachShader(program, vertex)
		glContext.attachShader(program, fragment)
		glContext.linkProgram(program);

		if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
			const info: string | null = glContext.getProgramInfoLog(program)
			console.warn(info)
		}
	}
	return program;
}