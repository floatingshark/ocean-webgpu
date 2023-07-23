/**
 * OpenGL shader util export functions and parameters
 */

/** difinition of vertex dimension size */
export const VERTEX_SIZE: number = 3;
/** difinition of color dimension size */
export const COLOR_SIZE: number = 4;
/** uniform name of model matrix in shader program */
export const UNIFORM_MODEL_MATRIX_NAME: string = 'u_ModelMatrix';
/** uniform name of view matrix in shader program */
export const UNIFORM_VIEW_MATRIX_NAME: string = 'u_ViewMatrix';
/** uniform name of projection matrix in shader program */
export const UNIFORM_PROJECTION_MATRIX_NAME: string = 'u_ProjectionMatrix';

/**
 * compile vertex shader and get shader object
 * @param {WebGLRenderingContext} glContext webGL context in target canvas
 * @param {string} source vertex shader source string
 * @returns {WebGLShader | null} a compiled shader object or null
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
 * compile fragment shader and get shader object
 * @param {WebGLRenderingContext} glContext webGL context in target canvas
 * @param {string} source fragment shader source string
 * @returns {WebGLShader | null} a compiled shader object or null
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
 * merge vertex and fragment shader and get shade program
 * @param {WebGLRenderingContext} glContext webGL context in target canvas
 * @param {WebGLShader} vertex vertex shader object
 * @param {WebGLShader} fragment fragment shader object
 * @returns {WegGLProgram | null} a webGL shader program or null
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
 * create plane mesh like a graph paper
 * @param {number} size plane mesh size ex. max vertex position = [size, size];
 * @param {number} division number of division
 * @param {number[]} vertice out vertex array for attribute buffer
 * @param {number[]} colors out color array for attribute buffer
 * @param {number[]} indice out index array for element buffer
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

  for (let y = 0; y <= division; y++) {
    for (let x = 0; x <= division; x++) {
      const index: number = x + (division + 1) * y;
      const origin: number = -division / 2.0;
      vertice[index] = [((origin + x) / division) * size, ((origin + y) / division) * size, 0.0];
      colors[index] = [1.0, 1.0, 1.0, 1.0];
      if (x < division && y < division) {
        indice[2 * index] = [index, index + (division + 1), index + (division + 1) + 1];
        indice[2 * index + 1] = [index + 1, index, index + (division + 1) + 1];
      }
    }
  }

  return;
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

/** deprecated =============================== */

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
