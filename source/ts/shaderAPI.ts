/** WebGL Snippets ========================= */

export function createWebGLVertexShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
	const vertexShader: WebGLShader | null = glContext.createShader(glContext.VERTEX_SHADER);
	if (vertexShader) {
		glContext.shaderSource(vertexShader, source);
		glContext.compileShader(vertexShader);

		if (!glContext.getShaderParameter(vertexShader, glContext.COMPILE_STATUS)) {
			const info = glContext.getShaderInfoLog(vertexShader);
			console.warn(info);
		}
	}
	return vertexShader;
}

export function createWebGLFragmentShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
	const fragmentShader: WebGLShader | null = glContext.createShader(glContext.FRAGMENT_SHADER);
	if (fragmentShader) {
		glContext.shaderSource(fragmentShader, source);
		glContext.compileShader(fragmentShader);

		if (!glContext.getShaderParameter(fragmentShader, glContext.COMPILE_STATUS)) {
			const info = glContext.getShaderInfoLog(fragmentShader);
			console.warn(info);
		}
	}
	return fragmentShader;
}

export function createWebGLProgram(
	glContext: WebGLRenderingContext,
	vertex: WebGLShader,
	fragment: WebGLShader
): WebGLProgram | null {
	const program: WebGLProgram | null = glContext.createProgram();
	if (program) {
		glContext.attachShader(program, vertex);
		glContext.attachShader(program, fragment);
		glContext.linkProgram(program);

		if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
			const info: string | null = glContext.getProgramInfoLog(program);
			console.warn(info);
		}
	}
	return program;
}

/** Generate Functions ====================== */

export function generateSubdividedMesh2d(
	size: number,
	division: number,
	vertice: number[][],
	colors: number[][],
	indice: number[][]
) {
	//assert(size > 0);
	//assert(division > 0);

	vertice.length = division * division;
	colors.length = division * division;
	indice.length = division * division;

	const lattice: number = division;
	for (let y = 0; y < lattice; y++) {
		for (let x = 0; x < lattice; x++) {
			const index: number = x + lattice * y;
			const origin: number = -lattice / 2.0;
			vertice[index] = [((origin + x + 0.5) / lattice) * size, ((origin + y + 0.5) / lattice) * size, 0.0];
			colors[index] = [1.0, 1.0, 1.0, 1.0];
			if (x < lattice - 1 && y < lattice - 1) {
				if (y % 2 == 0) {
					indice[2 * index] = [index, index + lattice, index + lattice + 1];
					indice[2 * index + 1] = [index + 1, index, index + lattice + 1];
				} else {
					const rowLastIndex = y * lattice + lattice - 1;
					const evenIndex = rowLastIndex - x;
					indice[2 * index] = [evenIndex - 1, evenIndex + lattice, evenIndex];
					indice[2 * index + 1] = [evenIndex + lattice, evenIndex + lattice - 1, evenIndex - 1];
				}
			}
		}
	}

	return;
}

export function generateGaussianRandom(seed: number[], out: number[]) {
	if (seed.length > 1 && out.length > 0) {
		const log = -2.0 * Math.log(seed[0]);
		const R = log <= 0.0 ? 0.0 : Math.sqrt(log);
		const theta = 2 * Math.PI * seed[1];
		out[0] = R * Math.cos(theta);
		if (out.length > 1) {
			out[1] = R * Math.sin(theta);
		}
		return;
	}
}

export function encodeFloatToRGBA(inFloat: number): number[] {
	const v1: number = inFloat * 255.0;
	const r: number = Math.floor(v1);
	const v2: number = (v1 - r) * 255.0;
	const g: number = Math.floor(v2);
	const v3: number = (v2 - g) * 255.0;
	const b: number = Math.floor(v3);
	const v4: number = (v3 - b) * 255.0;
	const a: number = Math.floor(v4);
	return [r, g, b, a];
}

/** Mesh Datum ================================= */

// prettier-ignore
export const MESH_PLANE_VERTICE: number[][] = [
	[-1.0, -1.0, 0.0],
	[-1.0, 1.0, 0.0],
	[1.0, 1.0, 0.0],
	[1.0, -1.0, 0.0]
];

// prettier-ignore
export const MESH_PLANE_COLOR: number[][] = [
	[1.0, 0.0, 0.0, 1.0],
	[0.0, 1.0, 0.0, 1.0],
	[0.0, 0.0, 1.0, 1.0],
	[1.0, 1.0, 1.0, 1.0],
];

// prettier-ignore
export const MESH_PLANE_INDEX: number[][] = [
  [0, 1, 2], 
  [0, 2, 3]
];

/** Deprecated =============================== */

// prettier-ignore
export const MESH_2D_VERTICE_ARRAY_TYPE: Float32Array = new Float32Array([
	-1.0, -1.0, 0.0,
	-1.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	1.0, -1.0, 0.0,
]);

// prettier-ignore
export const MESH_2D_COLOR_ARRAY_TYPE: Float32Array = new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	1.0, 1.0, 1.0, 1.0,
]);

// prettier-ignore
export const MESH_2D_INDEX_ARRAY_TYPE: Int32Array = new Int32Array([
  0, 1, 2, 
  0, 2, 3
]);
