/**
 * Utility - constant values / calculation snippets
 */

/** difinition of vertex dimension size */
export const VERTEX_SIZE: number = 3;
/** difinition of color dimension size */
export const COLOR_SIZE: number = 4;
/** difinition of spectrum dimension size */
export const SPECTRUM_SIZE: number = 1;
/** uniform name of model matrix in shader program */
export const UNIFORM_MODEL_MATRIX_NAME: string = 'u_ModelMatrix';
/** uniform name of view matrix in shader program */
export const UNIFORM_VIEW_MATRIX_NAME: string = 'u_ViewMatrix';
/** uniform name of projection matrix in shader program */
export const UNIFORM_PROJECTION_MATRIX_NAME: string = 'u_ProjectionMatrix';
/** uniform name of time value in shader program */
export const UNIFORM_TIME_NAME: string = 'u_Time';
/** uniform name of wave number in shader program */
export const UNIFORM_WAVE_NUMBER_NAME: string = 'u_WaveNumber';
/** uniform name of wave amplitude in shader program */
export const UNIFORM_WAVE_AMPLITUDE_NAME: string = 'u_Amplitude';
/** uniform name of wave length in shader program */
export const UNIFORM_WAVE_LENGTH_NAME: string = 'u_Length';
/** uniform name of wave speed in shader program */
export const UNIFORM_WAVE_CYCLE_NAME: string = 'u_Cycle';
/** uniform name of wave direction in shader program */
export const UNIFORM_WAVE_DIRECTION_NAME: string = 'u_Direction';
/** uniform name of wave frequency in shader program */
export const UNIFORM_WAVE_FREQUENCY_NAME: string = 'u_Frequency';
/** uniform name of lattice number in shade program */
export const UNIFORM_N_NAME: string = 'u_N';
/** uniform name of amplitude in shade program */
export const UNIFORM_A_NAME: string = 'u_A';
/** uniform name of cycle period in shade program */
export const UNIFORM_T_NAME: string = 'u_T';
/** uniform name of frequency in shade program */
export const UNIFORM_F_NAME: string = 'u_f';
/** uniform name of initial phase in shade program */
export const UNIFORM_PHI_NAME: string = 'u_Phi';
/** uniform name of initial spectrum texture in shade program */
export const UNIFORM_H0_NAME: string = 'u_texH0';
/** uniform name of initial spectrum real part encoded rgba texture in shade program */
export const UNIFORM_H0_REAL_NAME: string = 'u_texH0Re';
/** uniform name of initial spectrum imaginary part encoded rgba texture in shade program */
export const UNIFORM_H0_IMAGINARY_NAME: string = 'u_texH0Im';

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
 * @param {number} size generated plane mesh size, last position is [size, size];
 * @param {number} division number of division
 * @param {number[]} vertice out vertex array for attribute buffer
 * @param {number[]} colors out color array for attribute buffer
 * @param {number[]} indice [caution] out index array is a bit weird for line draw
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
      vertice[index] = [((origin + x) / lattice) * size, ((origin + y) / lattice) * size, 0.0];
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
 * create gaussian random by Box–Muller's method
 * @param {number[]} seed two uniform random numbers for gaussian random generator
 * @param {number} out1 result 1
 * @param {number} out2 result 2
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
 * @returns AN Endoced rgba value
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
