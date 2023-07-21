import VERTEX_SHADER_UNRIT from '@shader/unlit.vert';
import FRAGMENT_SHADER_UNRIT from '@shader/unlit.frag';
import * as openglUtility from '@ts/openglUtility';

/**
 *canvas element class for webgl
 */
export class Canvas {
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.glContext = this.canvas.getContext('webgl2');

    this.initializeShader();
  }

  protected canvas: HTMLCanvasElement | null = null;
  protected width: number = 512;
  protected height: number = 512;

  protected glContext: WebGLRenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  protected vertexBuffer: WebGLBuffer | null = null;
  protected vertexAttribLocation: number = 0;
  protected colorBuffer: WebGLBuffer | null = null;
  protected colorAttribLocation: number = 0;
  protected indexBuffer: WebGLBuffer | null = null;

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  public getWidth(): number {
    return this.width;
  }
  public setWidth(width: number) {
    this.width = width;
  }
  public getHeight(): number {
    return this.height;
  }
  public setHeight(height: number) {
    this.height = height;
  }

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

    // create buffer
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

    // set data to buffer
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

    // draw
    const INDEX_LENGTH: number = openglUtility.MESH_2D_INDEX.length;
    this.glContext.drawElements(this.glContext.TRIANGLES, INDEX_LENGTH, this.glContext.UNSIGNED_SHORT, 0);
    this.glContext.flush();

    return true;
  }

  public isValid(): boolean {
    let valid: boolean = true;
    valid &&= this.canvas !== null;
    valid &&= this.glContext !== null;
    return valid;
  }

  public update() {
    if (this.canvas === null) {
      return;
    }
    if (this.glContext === null) {
      return;
    }

    this.initializeShader();
  }
}
