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
   * @param {string} canvasID id of canvas element
   */
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;

    if (this.canvas !== null) {
      this.shader = new ShaderFFT(this.canvas);
      this.initializeEventListener();
    }
  }

  /** canvas dom element */
  protected canvas: HTMLCanvasElement | null = null;
  /** canvas element size */
  protected size: number[] = [512, 512];
  /** is mouse down or not */
  protected cursorOn: boolean = false;
  /** current animation time */
  protected time: number = 0.0;

  /** shader object */
  protected shader: Shader | null = null;

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
   * Setup event listener mousedown, mouseup, mousemove, wheel
   * @returns {boolean} setup is success or not
   */
  protected initializeEventListener(): boolean {
    if (!this.canvas || !this.shader) {
      return false;
    }

    let view = this.shader.viewPosition;
    const look = this.shader.viewLookAt;

    this.canvas.addEventListener('mousedown', () => {
      this.cursorOn = true;
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
    });

    this.shader.viewPosition = view;

    return true;
  }

  /**
   * Start canvas update loop
   */
  public async beginUpdate(): Promise<void> {
    function animationFramePromise(): Promise<number> {
      return new Promise<number>((resolve) => {
        globalThis.requestAnimationFrame(resolve);
      });
    }

    if (this.shader) {
      this.shader.preUpdate();
    }
    while (this.canvas) {
      const prevTime = Date.now();
      await animationFramePromise();
      const deltaTime = Date.now() - prevTime;
      this.update(deltaTime);
    }
  }

  /**
   * Update loop function for canvas class
   * @param {number} deltaTime duration time between current and prev frame
   */
  protected update(deltaTime: number): void {
    if (!this.canvas || !this.shader || deltaTime <= 0.0) {
      return;
    }

    this.shader.update(deltaTime);
  }
}
