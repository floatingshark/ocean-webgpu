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
 * a simple 2x2 mesh vertex data
 */
// prettier-ignore
export const MESH_2D_VERTICE: Float32Array = new Float32Array([
	-1.0, -1.0, 0.0,
	-1.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	1.0, -1.0, 0.0,
]);
/**
 * a simple 2x2 mesh vertex color data
 */
// prettier-ignore
export const MESH_2D_COLOR: Float32Array = new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 1.0, 1.0,
	1.0, 1.0, 1.0, 1.0,
]);
/**
 * a simple 2x2 mesh index data
 */
// prettier-ignore
export const MESH_2D_INDEX: Int32Array = new Int32Array([
  0, 1, 2, 
  0, 2, 3
]);

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
