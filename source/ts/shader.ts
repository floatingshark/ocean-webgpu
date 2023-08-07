import * as ShaderUtility from '@ts/shaderUtility';
import * as glm from 'gl-matrix';
import VERTEX_SHADER_UNRIT from '@shader/unlit.vert';
import FRAGMENT_SHADER_UNRIT from '@shader/unlit.frag';

/**
 * Webgl2 basis shader class
 */
export class Shader {
  /**
   * @constructor
   */
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2');
    this.initialize();
  }

  /** Webgl2.0 context in this canvas */
  protected gl: WebGL2RenderingContext | null = null;
  /** Current vertex shader source */
  protected vertexShaderSource: string = VERTEX_SHADER_UNRIT;
  /** Current fragment shader source */
  protected fragmentShaderSource: string = FRAGMENT_SHADER_UNRIT;
  /** Current shader program */
  protected program: WebGLProgram | null = null;
  /** Current shader draw type [TRIANGLES, LINES] */
  protected drawType: number = 0;

  /** Attribute buffer of vertices */
  protected vertexBuffer: WebGLBuffer | null = null;
  /** Attribute buffer of vertex colors */
  protected colorBuffer: WebGLBuffer | null = null;
  /** Index element buffer */
  protected indexBuffer: WebGLBuffer | null = null;

  /** A vertex 2D array for attribute buffer */
  protected vertexArray: number[][] = ShaderUtility.MESH_2D_VERTICE;
  /** A vertex color 2D array for attribute buffer */
  protected colorArray: number[][] = ShaderUtility.MESH_2D_COLOR;
  /** A index 2D array for index buffer */
  protected indexArray: number[][] = ShaderUtility.MESH_2D_INDEX;

  /** Model matrix uniform location */
  protected uniformLocationModelMatrix: WebGLUniformLocation | null = null;
  /** View matrix uniform location */
  protected uniformLocationViewMatrix: WebGLUniformLocation | null = null;
  /** Projection matrix uniform location */
  protected uniformLocationProjectionMatrix: WebGLUniformLocation | null = null;

  /** Model position for model matrix */
  protected position: glm.vec3 = [0.0, 0.0, 0.0];
  /** Model rotation for model matrix */
  protected rotation: glm.vec3 = [0.0, 0.0, 0.0];
  /** Model scale for model matrix */
  protected scale: glm.vec3 = [1.0, 1.0, 1.0];
  /** 4x4 model matrix */
  protected modelMatrix: glm.mat4 = glm.mat4.create();

  /** View position / Camera position */
  public viewPosition: glm.vec3 = [-1, -2, 0.3];
  /** Look at position */
  public viewLookAt: glm.vec3 = [0.0, 0.0, 0.0];
  /** Basis upvector, basically [0, 1, 0] or [0, 0, 0] and it depends on emvironments */
  public viewUp: glm.vec3 = [0.0, 0.0, 1.0];
  /** 4x4 view matrix */
  protected viewMatrix: glm.mat4 = glm.mat4.create();

  /** FOV - field of range */
  protected projectionFovy: number = glm.glMatrix.toRadian(60.0);
  /** Aspect ratio - (width / height) */
  protected projectionAspect: number = 1.0;
  /** Near bounds of camera */
  protected projectionNear: number = 0;
  /** Far bounds of camera */
  protected projectionFar: number = 10000;
  /** 4x4 projection matrix */
  protected projectionMatrix: glm.mat4 = glm.mat4.create();

  /** Time count uniform location */
  protected uniformLocationTime: WebGLUniformLocation | null = null;
  /** Current animation count [ms] */
  protected time: number = 0.0;

  /**
   * Initializer function which would called in constructor
   */
  protected initialize(): boolean {
    if (!this.gl) {
      return false;
    }
    this.initializeShaderProgram();
    this.initializeAttribute();
    this.initializeUniform();
    return true;
  }

  /**
   * Create shader program from vertex and fragment source file
   */
  protected initializeShaderProgram(): boolean {
    if (!this.gl) {
      return false;
    }
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    const vertexShader: WebGLShader | null = ShaderUtility.createVertexShader(this.gl, this.vertexShaderSource);
    const fragmentShader: WebGLShader | null = ShaderUtility.createFragmentShader(this.gl, this.fragmentShaderSource);

    if (vertexShader && fragmentShader) {
      this.program = ShaderUtility.createProgram(this.gl, vertexShader, fragmentShader);
      this.gl.useProgram(this.program);
    }
    return true;
  }

  /**
   * Create attribute buffer and get attribute location
   */
  protected initializeAttribute(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }

    const attribLocationVertex: number = this.gl.getAttribLocation(this.program, 'in_VertexPosition');
    const attribLocationColor: number = this.gl.getAttribLocation(this.program, 'in_Color');

    this.vertexBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(attribLocationVertex);
    this.gl.vertexAttribPointer(attribLocationVertex, ShaderUtility.VERTEX_SIZE, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(attribLocationColor);
    this.gl.vertexAttribPointer(attribLocationColor, ShaderUtility.COLOR_SIZE, this.gl.FLOAT, false, 0, 0);

    return true;
  }

  /**
   * Register values to attribute buffers
   */
  protected registerAttribute(): boolean {
    if (!this.gl) {
      return false;
    }

    if (this.vertexBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertexArray.flat()), this.gl.STATIC_DRAW);
    }

    if (this.colorBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colorArray.flat()), this.gl.STATIC_DRAW);
    }

    if (this.indexBuffer) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(this.indexArray.flat()), this.gl.STATIC_DRAW);
    }

    return true;
  }

  /**
   * Get uniform locations
   */
  protected initializeUniform(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }

    this.uniformLocationModelMatrix = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_MODEL_MATRIX_NAME);
    this.uniformLocationViewMatrix = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_VIEW_MATRIX_NAME);
    this.uniformLocationProjectionMatrix = this.gl.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_PROJECTION_MATRIX_NAME
    );
    this.uniformLocationTime = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_TIME_NAME);
    return true;
  }

  /**
   * Register values to uniform variables
   */
  protected registerUniform(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }

    if (this.uniformLocationModelMatrix) {
      this.gl.uniformMatrix4fv(this.uniformLocationModelMatrix, false, this.modelMatrix);
    }

    if (this.uniformLocationViewMatrix) {
      this.gl.uniformMatrix4fv(this.uniformLocationViewMatrix, false, this.viewMatrix);
    }

    if (this.uniformLocationProjectionMatrix) {
      this.gl.uniformMatrix4fv(this.uniformLocationProjectionMatrix, false, this.projectionMatrix);
    }

    if (this.uniformLocationTime) {
      this.gl.uniform1f(this.uniformLocationTime, this.time);
    }

    return true;
  }

  /**
   * Draw elements using this.drayType
   */
  protected draw(): boolean {
    if (!this.gl) {
      return false;
    }

    const INDEX_LENGTH: number = this.indexArray.flat().length;
    if (this.drawType == 0) {
      this.gl.drawElements(this.gl.TRIANGLES, INDEX_LENGTH, this.gl.UNSIGNED_SHORT, 0);
    } else {
      this.gl.drawElements(this.gl.LINE_STRIP, INDEX_LENGTH, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.flush();
    return true;
  }

  /**
   * Calculate model, view, and projection matrices
   */
  protected calculateMvpMatrices(): boolean {
    const translateMatrix: glm.mat4 = glm.mat4.translate(glm.mat4.create(), glm.mat4.create(), [
      this.position[0],
      this.position[1],
      this.position[2],
    ]);

    const rotateMatrixX: glm.mat4 = glm.mat4.rotate(
      glm.mat4.create(),
      glm.mat4.create(),
      this.rotation[0],
      [1.0, 0.0, 0.0]
    );
    const rotateMatrixY: glm.mat4 = glm.mat4.rotate(
      glm.mat4.create(),
      glm.mat4.create(),
      this.rotation[1],
      [0.0, 1.0, 0.0]
    );
    const rotateMatrixZ: glm.mat4 = glm.mat4.rotate(
      glm.mat4.create(),
      glm.mat4.create(),
      this.rotation[0],
      [0.0, 0.0, 1.0]
    );
    const rotateMatrix: glm.mat4 = glm.mat4.multiply(
      glm.mat4.create(),
      glm.mat4.multiply(glm.mat4.create(), rotateMatrixZ, rotateMatrixY),
      rotateMatrixX
    );
    const scaleMatrix: glm.mat4 = glm.mat4.scale(glm.mat4.create(), glm.mat4.create(), [
      this.scale[0],
      this.scale[1],
      this.scale[2],
    ]);
    this.modelMatrix = glm.mat4.multiply(
      glm.mat4.create(),
      glm.mat4.multiply(glm.mat4.create(), translateMatrix, rotateMatrix),
      scaleMatrix
    );

    this.viewMatrix = glm.mat4.lookAt(glm.mat4.create(), this.viewPosition, this.viewLookAt, this.viewUp);

    this.projectionMatrix = glm.mat4.perspective(
      glm.mat4.create(),
      this.projectionFovy,
      this.projectionAspect,
      this.projectionNear,
      this.projectionFar
    );

    return true;
  }

  /**
   * This function will be executed once before update loop
   */
  public preUpdate(): void {
    this.registerAttribute();
    this.registerUniform();
    this.draw();
  }

  /**
   * This function will be executed on every frame
   * @param {number} deltaTime duration time between current and prev frame
   */
  public update(deltaTime: number) {
    if (!this.gl || deltaTime <= 0.0) {
      return;
    }
    this.time += deltaTime;

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.calculateMvpMatrices();

    this.registerAttribute();
    this.registerUniform();
    this.draw();
  }
}
