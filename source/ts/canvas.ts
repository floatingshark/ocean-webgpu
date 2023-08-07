import * as glm from 'gl-matrix';
import { Shader } from '@ts/shader';
//import { ShaderSyntesis } from '@ts/shaderSynthesis';
import { ShaderFFT } from '@ts/shaderFFT';

/**
 * Canvas element class for webgl
 */
export class Canvas {
  /**
   * @constructor
   * @param {string} canvasID DOM dlement id of canvas element
   */
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;

    if (this.canvas !== null) {
      this.shader = new ShaderFFT(this.canvas);
      this.initializeEventListener();
    }
  }

  /** a dom element of this canvas */
  protected canvas: HTMLCanvasElement | null = null;
  /** this canvas element screen size [width, height] */
  protected size: number[] = [512, 512];
  /** is mouse left button downed or not */
  protected cursorOn: boolean = false;
  /** current animation time from begin [ms] */
  protected time: number = 0.0;
  /** to update rendering this canvas or not */
  protected bUpdate: boolean = true;

  /** shader object */
  protected shader: Shader | null = null;

  /**
   * @returns {number[]} current this canvas size [width, height]
   */
  public getSize(): number[] {
    return this.size;
  }

  /**
   * Edit this canvas viewports size
   * @param {number[]} size a new size of this canvas [width, height]
   */
  public setSize(size: number[]) {
    if (size.length > 0) {
      this.size[0] = size[0];
      this.size[1] = size[1];
    }
  }

  /**
   * Setup event listener to catch [mousedown, mouseup, mousemove, wheel] events
   * @returns {boolean} this setup successed or not
   */
  protected initializeEventListener(): boolean {
    if (!this.canvas || !this.shader) {
      return false;
    }

    let view = this.shader.viewPosition;
    const look = this.shader.viewLookAt;

    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.cursorOn = true;

      if (e.button == 1) {
        this.bUpdate = this.bUpdate ? false : true;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.cursorOn = false;
    });

    // rotate when mouse downed
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.cursorOn) {
        // TODO: support every up vector
        const ROTATE_MAGNITUDE: number = 0.005;
        const rotateSizeX = -e.movementX * ROTATE_MAGNITUDE;
        view = glm.vec3.rotateZ(glm.vec3.create(), view, glm.vec3.create(), rotateSizeX);
        // TODO: support mouse Y move rotate

        // temp Y movement(not orbital rotate)
        const MOVEMENT_MAGNITUDE: number = 0.01;
        view[2] += e.movementY * MOVEMENT_MAGNITUDE;
        if (this.shader) {
          this.shader.viewPosition = view;
        }
      }
    });

    // zoom when mouse wheeled
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      const ZOOM_MAGNITUDE: number = 0.01;
      let zoomBasis: glm.vec3 = glm.vec3.subtract(glm.vec3.create(), look, view);
      zoomBasis = glm.vec3.normalize(zoomBasis, zoomBasis);
      let zoomVec: glm.vec3 = glm.vec3.multiply(glm.vec3.create(), zoomBasis, glm.vec3.create().fill(-e.deltaY));
      zoomVec = glm.vec3.multiply(zoomVec, zoomVec, glm.vec3.create().fill(ZOOM_MAGNITUDE));
      glm.vec3.add(view, view, zoomVec);
      if (this.shader) {
        this.shader.viewPosition = view;
      }
    });

    return true;
  }

  /**
   * Begin this canvas's renderer update loop by using async timer
   */
  public async beginUpdate(): Promise<void> {
    function animationFramePromise(): Promise<number> {
      return new Promise<number>((resolve) => {
        globalThis.requestAnimationFrame(resolve);
      });
    }

    // pre update
    if (this.shader) {
      this.shader.preUpdate();
    }

    // execute update loop
    const FPS_30 = 33.33;
    let prevTime = Date.now();
    while (this.canvas) {
      await animationFramePromise();
      const deltaTime = Date.now() - prevTime;
      if (deltaTime > FPS_30) {
        prevTime = Date.now();
        this.update(deltaTime);
      }
    }
  }

  /**
   * Update loop function which codes executed in every frame
   * @param {number} deltaTime duration between current and prev frame [ms]
   */
  protected update(deltaTime: number): void {
    if (!this.canvas || !this.shader || deltaTime <= 0.0 || !this.bUpdate) {
      return;
    }
    this.shader.update(deltaTime);
  }
}
