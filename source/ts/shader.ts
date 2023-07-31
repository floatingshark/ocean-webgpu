import * as ShaderUtility from '@ts/shaderUtility';
import * as glm from 'gl-matrix';

/**
 * WebGL shader class
 */
export class Shader {
  /**
   * @constructor
   */
  constructor(canvas: HTMLCanvasElement) {
    this.glContext = canvas.getContext('webgl2');
    this.initialize();
  }

  /** webgl2.0 context this canvas */
  protected glContext: WebGLRenderingContext | null = null;
  /** a using current vertex shader source code */
  protected vertexShaderSource: string = ShaderUtility.VERTEX_SHADER_UNRIT_SOURCE;
  /** a using current fragment shader source code */
  protected fragmentShaderSource: string = ShaderUtility.FRAGMENT_SHADER_UNRIT_SOURCE;
  /** current shader program */
  protected program: WebGLProgram | null = null;
  /** current shader draw type */
  protected drawType: number = 0;

  /** attribute buffer of vertices */
  protected vertexBuffer: WebGLBuffer | null = null;
  /** attribute buffer of vertex colors */
  protected colorBuffer: WebGLBuffer | null = null;
  /** index element buffer */
  protected indexBuffer: WebGLBuffer | null = null;

  /** attribute location of vertices */
  protected vertexAttribLocation: number = 0;
  /** attribute location of vertix colors */
  protected colorAttribLocation: number = 0;

  /** a vertex 2D array for attribute vertex buffer */
  protected vertexArray: number[][] = ShaderUtility.MESH_2D_VERTICE;
  /** a color 2D array for attribute color buffer */
  protected colorArray: number[][] = ShaderUtility.MESH_2D_COLOR;
  /** a index 2D array for index element buffer */
  protected indexArray: number[][] = ShaderUtility.MESH_2D_INDEX;

  /** uniform location of model matrix */
  protected uniformLocationModelMatrix: WebGLUniformLocation | null = null;
  /** uniform location of view matrix */
  protected uniformLocationViewMatrix: WebGLUniformLocation | null = null;
  /** uniform location of projection matrix */
  protected uniformLocationProjectionMatrix: WebGLUniformLocation | null = null;

  /** model position */
  protected position: glm.vec3 = [0.0, 0.0, 0.0];
  /** model rotation */
  protected rotation: glm.vec3 = [0.0, 0.0, 0.0];
  /** model scale */
  protected scale: glm.vec3 = [1.0, 1.0, 1.0];
  /** 4x4 model matrix */
  protected modelMatrix: glm.mat4 = glm.mat4.create();

  /** view position a.k.a camera position */
  public viewPosition: glm.vec3 = [1, 2, 5.0];
  /** the position camera look at */
  public viewLookAt: glm.vec3 = [0.0, 0.0, 0.0];
  /** basis upvector , basically [0, 1, 0] or [0, 0, 0] and it depends on industry */
  public viewUp: glm.vec3 = [0.0, 0.0, 1.0];
  /** 4x4 view matrix */
  protected viewMatrix: glm.mat4 = glm.mat4.create();

  /** camera FOV - field of range */
  protected projectionFovy: number = glm.glMatrix.toRadian(60.0);
  /** camera aspect ratio - (width / height) */
  protected projectionAspect: number = 1.0;
  /** near bounds of camera */
  protected projectionNear: number = 0;
  /** far bounds of camera */
  protected projectionFar: number = 10000;
  /** 4x4 projection matrix */
  protected projectionMatrix: glm.mat4 = glm.mat4.create();

  /** current animation time */
  protected time: number = 0.0;

  protected initialize(): boolean {
    if (!this.glContext) {
      return false;
    }

    this.initializeShaderProgram();
    this.initializeAttribute();
    this.registerAttribute();
    this.initializeUniformLocation();
    this.registerUniform();
    this.draw();

    return true;
  }

  /**
   * Setup shader program
   * @returns {boolean} setup is success or not
   */
  protected initializeShaderProgram(): boolean {
    if (!this.glContext) {
      return false;
    }

    // init bg
    this.glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);

    // create shader
    const vertexShader: WebGLShader | null = ShaderUtility.createVertexShader(this.glContext, this.vertexShaderSource);
    const fragmentShader: WebGLShader | null = ShaderUtility.createFragmentShader(
      this.glContext,
      this.fragmentShaderSource
    );

    // create program
    if (vertexShader && fragmentShader) {
      this.program = ShaderUtility.createProgram(this.glContext, vertexShader, fragmentShader);
      this.glContext.useProgram(this.program);

      if (this.program) {
        this.vertexAttribLocation = this.glContext.getAttribLocation(this.program, 'in_VertexPosition');
        this.colorAttribLocation = this.glContext.getAttribLocation(this.program, 'in_Color');
      }
    }
    return true;
  }

  /**
   * Setup shader attribute variables
   * @returns {boolean} setup is success or not
   */
  protected initializeAttribute(): boolean {
    if (!this.glContext) {
      return false;
    }

    this.vertexBuffer = this.glContext.createBuffer();
    this.colorBuffer = this.glContext.createBuffer();
    this.indexBuffer = this.glContext.createBuffer();

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.vertexBuffer);
    this.glContext.enableVertexAttribArray(this.vertexAttribLocation);
    this.glContext.vertexAttribPointer(
      this.vertexAttribLocation,
      ShaderUtility.VERTEX_SIZE,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.colorBuffer);
    this.glContext.enableVertexAttribArray(this.colorAttribLocation);
    this.glContext.vertexAttribPointer(
      this.colorAttribLocation,
      ShaderUtility.COLOR_SIZE,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    return true;
  }

  /**
   * Register shader values to attribute buffers
   * @returns {boolean} setup is success or not
   */
  protected registerAttribute(): boolean {
    if (!this.glContext) {
      return false;
    }

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.vertexBuffer);
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      new Float32Array(this.vertexArray.flat()),
      this.glContext.STATIC_DRAW
    );

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.colorBuffer);
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      new Float32Array(this.colorArray.flat()),
      this.glContext.STATIC_DRAW
    );

    this.glContext.bindBuffer(this.glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.glContext.bufferData(
      this.glContext.ELEMENT_ARRAY_BUFFER,
      new Int16Array(this.indexArray.flat()),
      this.glContext.STATIC_DRAW
    );

    return true;
  }

  /**
   * Setup shader uniform variables
   * @returns {boolean} setup is success or not
   */
  protected initializeUniformLocation(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }

    this.uniformLocationModelMatrix = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_MODEL_MATRIX_NAME
    );
    this.uniformLocationViewMatrix = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_VIEW_MATRIX_NAME
    );
    this.uniformLocationProjectionMatrix = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_PROJECTION_MATRIX_NAME
    );
    return true;
  }

  /**
   * Register shader values to uniform variables
   * @returns {boolean} setup is success or not
   */
  protected registerUniform(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }

    if (this.uniformLocationModelMatrix) {
      this.glContext.uniformMatrix4fv(this.uniformLocationModelMatrix, false, this.modelMatrix);
    }
    if (this.uniformLocationViewMatrix) {
      this.glContext.uniformMatrix4fv(this.uniformLocationViewMatrix, false, this.viewMatrix);
    }
    if (this.uniformLocationProjectionMatrix) {
      this.glContext.uniformMatrix4fv(this.uniformLocationProjectionMatrix, false, this.projectionMatrix);
    }

    return true;
  }

  /**
   * Rendering current shader context
   * @returns {boolean} success or not
   */
  protected draw(): boolean {
    if (!this.glContext) {
      return false;
    }

    const INDEX_LENGTH: number = this.indexArray.flat().length;
    if (this.drawType == 0) {
      this.glContext.drawElements(this.glContext.TRIANGLES, INDEX_LENGTH, this.glContext.UNSIGNED_SHORT, 0);
    } else {
      this.glContext.drawElements(this.glContext.LINE_STRIP, INDEX_LENGTH, this.glContext.UNSIGNED_SHORT, 0);
    }
    this.glContext.flush();
    return true;
  }

  /**
   * Calc model, view, and projection matrices
   * @returns {boolean} calculated successfully or not
   */
  protected calculateMvpMatrices(): boolean {
    // Create model matrix
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

    // Create view matrix
    this.viewMatrix = glm.mat4.lookAt(glm.mat4.create(), this.viewPosition, this.viewLookAt, this.viewUp);

    // Create prjection matrix
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
   * Update loop function for canvas animation
   * @param {number} deltaTime duration time between current and prev frame
   */
  public update(deltaTime: number) {
    if (!this.glContext || deltaTime <= 0.0) {
      return;
    }

    this.glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);

    this.time += deltaTime;
    this.calculateMvpMatrices();

    this.registerAttribute();
    this.registerUniform();
    this.draw();
  }
}
