import VERTEX_SHADER_UNRIT from '@shader/unlit.vert';
import FRAGMENT_SHADER_UNRIT from '@shader/unlit.frag';
import * as openglUtility from '@ts/openglUtility';
import * as glm from 'gl-matrix';

/**
 * Canvas element class for webgl
 */
export class Canvas {
  /**
   * @constructor
   * @param {string} canvasID id of canvas element
   */
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.glContext = this.canvas.getContext('webgl2');

    this.initializeEventListener();

    this.initializeShader();
    this.initializeAttribute();
    this.registerAttribute();
    this.initializeUniformLocation();
    this.registerUniform();
    this.draw();
  }

  /** canvas dom element */
  protected canvas: HTMLCanvasElement | null = null;
  /** canvas element size */
  protected size: number[] = [512, 512];

  /** mouse cursor position on canvas */
  protected cursor: number[] = [0.0, 0.0];
  /** mouse down or not */
  protected cursorOn: boolean = false;

  /** webgl2.0 context this canvas */
  protected glContext: WebGLRenderingContext | null = null;
  /** current shader program */
  protected program: WebGLProgram | null = null;

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

  /** uniform location of model matrix */
  protected uniformLocationModelMatrix: WebGLUniformLocation | null = null;
  /** uniform location of view matrix */
  protected uniformLocationViewMatrix: WebGLUniformLocation | null = null;
  /** uniform location of projection matrix */
  protected uniformLocationProjectionMatrix: WebGLUniformLocation | null = null;

  /** model position */
  protected position: glm.vec3 = [0.0, 0.0, -1.0];
  /** model rotation */
  protected rotation: glm.vec3 = [0.0, 0.0, 0.0];
  /** model scale */
  protected scale: glm.vec3 = [1.0, 1.0, 1.0];
  /** 4x4 model matrix */
  protected modelMatrix: glm.mat4 = glm.mat4.create();

  /** view position a.k.a camera position */
  protected viewPosition: glm.vec3 = [2.0, 2.0, 5.0];
  /** the position camera look at */
  protected viewLookAt: glm.vec3 = [0.0, 0.0, 0.0];
  /** basis upvector , basically [0, 1, 0] or [0, 0, 0] and it depends on industry */
  protected viewUp: glm.vec3 = [0.0, 0.0, 1.0];
  /** 4x4 view matrix */
  protected viewMatrix: glm.mat4 = glm.mat4.create();

  /** camera FOV - field of range */
  protected projectionFovy: number = glm.glMatrix.toRadian(60.0);
  /** camera aspect ratio - (width / height) */
  protected projectionAspect: number = this.size[0] / this.size[1];
  /** near bounds of camera */
  protected projectionNear: number = 0;
  /** far bounds of camera */
  protected projectionFar: number = 10000;
  /** 4x4 projection matrix */
  protected projectionMatrix: glm.mat4 = glm.mat4.create();

  /**
   * @returns {number[]} current canvas size
   */
  public getSize(): number[] {
    return this.size;
  }

  /**
   * edit canvas size
   * @param {number[]} size new size
   */
  public setSize(size: number[]) {
    if (size.length > 0) {
      this.size[0] = size[0];
      this.size[1] = size[1];
    }
  }

  /**
   * Setup event listener
   * @returns {boolean} setup is success or not
   */
  protected initializeEventListener(): boolean {
    if (this.canvas === null) {
      return false;
    }

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      this.cursor[0] = e.offsetX;
      this.cursor[1] = e.offsetY;
      if (this.cursorOn) {
        this.viewPosition[0] += e.movementX;
      }
    });

    this.canvas.addEventListener('mousedown', () => {
      this.cursorOn = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.cursorOn = false;
    });

    return true;
  }

  /**
   * Setup shader program
   * @returns {boolean} setup is success or not
   */
  protected initializeShader(): boolean {
    if (this.canvas === null) {
      return false;
    }
    if (this.glContext === null) {
      return false;
    }

    // init bg
    this.glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);

    // create shader
    const vertexShader: WebGLShader | null = openglUtility.createVertexShader(this.glContext, VERTEX_SHADER_UNRIT);
    const fragmentShader: WebGLShader | null = openglUtility.createFragmentShader(
      this.glContext,
      FRAGMENT_SHADER_UNRIT
    );

    // create program
    if (vertexShader && fragmentShader) {
      this.program = openglUtility.createProgram(this.glContext, vertexShader, fragmentShader);
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
    if (this.glContext === null) {
      return false;
    }

    this.vertexBuffer = this.glContext.createBuffer();
    this.colorBuffer = this.glContext.createBuffer();
    this.indexBuffer = this.glContext.createBuffer();

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.vertexBuffer);
    this.glContext.enableVertexAttribArray(this.vertexAttribLocation);
    this.glContext.vertexAttribPointer(
      this.vertexAttribLocation,
      openglUtility.VERTEX_SIZE,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.colorBuffer);
    this.glContext.enableVertexAttribArray(this.colorAttribLocation);
    this.glContext.vertexAttribPointer(
      this.colorAttribLocation,
      openglUtility.COLOR_SIZE,
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
    if (this.glContext === null) {
      return false;
    }

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.vertexBuffer);
    this.glContext.bufferData(this.glContext.ARRAY_BUFFER, openglUtility.MESH_2D_VERTICE, this.glContext.STATIC_DRAW);

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.colorBuffer);
    this.glContext.bufferData(this.glContext.ARRAY_BUFFER, openglUtility.MESH_2D_COLOR, this.glContext.STATIC_DRAW);

    this.glContext.bindBuffer(this.glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.glContext.bufferData(
      this.glContext.ELEMENT_ARRAY_BUFFER,
      new Int16Array(openglUtility.MESH_2D_INDEX),
      this.glContext.STATIC_DRAW
    );

    return true;
  }

  /**
   * Setup shader uniform variables
   * @returns {boolean} setup is success or not
   */
  protected initializeUniformLocation(): boolean {
    if (!this.glContext) {
      return false;
    }
    if (!this.program) {
      return false;
    }

    this.uniformLocationModelMatrix = this.glContext.getUniformLocation(
      this.program,
      openglUtility.UNIFORM_MODEL_MATRIX_NAME
    );
    this.uniformLocationViewMatrix = this.glContext.getUniformLocation(
      this.program,
      openglUtility.UNIFORM_VIEW_MATRIX_NAME
    );
    this.uniformLocationProjectionMatrix = this.glContext.getUniformLocation(
      this.program,
      openglUtility.UNIFORM_PROJECTION_MATRIX_NAME
    );
    return true;
  }

  /**
   * Register shader values to uniform variables
   * @returns {boolean} setup is success or not
   */
  protected registerUniform(): boolean {
    if (!this.glContext) {
      return false;
    }
    if (!this.program) {
      return false;
    }

    if (this.uniformLocationModelMatrix !== null) {
      this.glContext.uniformMatrix4fv(this.uniformLocationModelMatrix, false, this.modelMatrix);
    }
    if (this.uniformLocationViewMatrix !== null) {
      this.glContext.uniformMatrix4fv(this.uniformLocationViewMatrix, false, this.viewMatrix);
    }
    if (this.uniformLocationProjectionMatrix !== null) {
      this.glContext.uniformMatrix4fv(this.uniformLocationProjectionMatrix, false, this.projectionMatrix);
    }

    return true;
  }

  /**
   * Rendering current shader context
   * @returns {boolean} success or not
   */
  protected draw(): boolean {
    if (this.glContext === null) {
      return false;
    }
    const INDEX_LENGTH: number = openglUtility.MESH_2D_INDEX.length;
    this.glContext.drawElements(this.glContext.TRIANGLES, INDEX_LENGTH, this.glContext.UNSIGNED_SHORT, 0);
    this.glContext.flush();
    return true;
  }

  /**
   * Evaluate this object working without problems
   * @returns {boolean} working successfully or not
   */
  public isValid(): boolean {
    let valid: boolean = true;
    valid &&= this.canvas !== null;
    valid &&= this.glContext !== null;
    return valid;
  }

  /**
   * Start canvas animation update loop
   */
  public async beginAnimation() {
    function animationFramePromise(): Promise<number> {
      return new Promise<number>((resolve) => {
        globalThis.requestAnimationFrame(resolve);
      });
    }

    while (this.canvas) {
      const prevTime = Date.now();
      await animationFramePromise();
      const deltaTime = Date.now() - prevTime;
      console.log(deltaTime);
      this.updateAnimation(deltaTime);
    }
  }

  /**
   * Update loop function for canvas animation
   * @param {number} deltaTime duration time between current and prev frame
   */
  protected updateAnimation(deltaTime: number) {
    if (this.canvas === null) {
      return;
    }
    if (this.glContext === null) {
      return;
    }
    if (deltaTime <= 0.0) {
      return;
    }

    this.glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT);

    this.calculateMvpMatrices();

    this.registerAttribute();
    this.registerUniform();
    this.draw();
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
}
