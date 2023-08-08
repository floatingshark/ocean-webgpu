/**
 * Utilities - calculation snippets mainly
 */

/**
 * Compile vertex shader and return shader object
 * @param {WebGLRenderingContext} glContext Webgl2 context
 * @param {string} source Vertex shader source code as string
 * @returns {WebGLShader | null} Out vertex shader object
 */
export function createVertexShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
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

/**
 * Compile fragment shader and return shader object
 * @param {WebGLRenderingContext} glContext Webgl2 context
 * @param {string} source Fragment shader source code as string
 * @returns {WebGLShader | null} Out fragment shader object
 */
export function createFragmentShader(glContext: WebGLRenderingContext, source: string): WebGLShader | null {
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

/**
 * Merge vertex and fragment shaders and return shader program
 * @param {WebGLRenderingContext} glContext Webgl2 context
 * @param {WebGLShader} vertex Certex shader object
 * @param {WebGLShader} fragment Fragment shader object
 * @returns {WegGLProgram | null} Out shader program
 */
export function createProgram(
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

/**
 * Create plane mesh with subdiveded polygones like a graph paper
 * @param {number} size Target size, the mesh last index position is [size, size];
 * @param {number} division Number of division
 * @param {number[]} vertice Out vertex array for attribute buffer
 * @param {number[]} colors Out vertex color array for attribute buffer
 * @param {number[]} indice Out index array [Caution!] Have bit weird indices for line drawing
 */
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

/**
 * Create gaussian random numbers by Box–Muller's method
 * @param {number[]} seed Two uniform random numbers
 * @param {number[]} out Out two random values
 */
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

/**
 * 32 bit float to rgba [0, 255] 8bit * 4 values
 * @param inFloat A float value for encoding
 * @returns Out endoced rgba value
 */
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

// prettier-ignore
export const MESH_2D_VERTICE: number[][] = [
	[-1.0, -1.0, 0.0],
	[-1.0, 1.0, 0.0],
	[1.0, 1.0, 0.0],
	[1.0, -1.0, 0.0]
];

/**
 * a simple 2x2 mesh vertex color data
 */
// prettier-ignore
export const MESH_2D_COLOR: number[][] = [
	[1.0, 0.0, 0.0, 1.0],
	[0.0, 1.0, 0.0, 1.0],
	[0.0, 0.0, 1.0, 1.0],
	[1.0, 1.0, 1.0, 1.0],
];

/**
 * a simple 2x2 mesh index data
 */
// prettier-ignore
export const MESH_2D_INDEX: number[][] = [
  [0, 1, 2], 
  [0, 2, 3]
];

/** Deprecated =============================== */

/**
 * @deprecated
 * a simple 2x2 mesh vertex array type data
 */
// prettier-ignore
export const MESH_2D_VERTICE_ARRAY_TYPE: Float32Array = new Float32Array([
	-1.0, -1.0, 0.0,
	-1.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	1.0, -1.0, 0.0,
]);
/**
 * @deprecated
 * a simple 2x2 mesh vertex color array type data
 */
// prettier-ignore
export const MESH_2D_COLOR_ARRAY_TYPE: Float32Array = new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	1.0, 1.0, 1.0, 1.0,
]);
/**
 * @deprecated
 * a simple 2x2 mesh index array type data
 */
// prettier-ignore
export const MESH_2D_INDEX_ARRAY_TYPE: Int32Array = new Int32Array([
  0, 1, 2, 
  0, 2, 3
]);
