import * as glm from 'gl-matrix';
import { Shader } from '@ts/shader';
//import { ShaderSyntesis } from '@ts/shaderSynthesis';
import { ShaderFFT } from '@ts/shaderFFT';

/**
 * Canvas element class for webgl2
 */
export class Canvas {
  /**
   * @constructor
   * @param {string} canvasID The canvas DOM element for webgl2
   */
  constructor(canvasID: string) {
    this.canvas = document.getElementById(canvasID) as HTMLCanvasElement | null;

    if (this.canvas !== null) {
      this.canvas.width = this.size[0];
      this.canvas.height = this.size[1];
      this.shader = new ShaderFFT(this.canvas);
      this.initializeEventListener();
    }
  }

  /** The DOM element of this canvas */
  protected canvas: HTMLCanvasElement | null = null;
  /** This canvas element's screen size [width, height] */
  protected size: number[] = [512, 512];
  /** A flag of mouse left button downed*/
  protected bMouseOn: boolean = false;
  /** Current rendering context elapsed time[ms] */
  protected time: number = 0.0;
  /** An update flag of this canvas */
  protected bUpdate: boolean = true;

  /** Shader object for webgl2 context */
  protected shader: Shader | null = null;

  /**
   * @returns {number[]} Current canvas viewport size [width, height]
   */
  public getSize(): number[] {
    return this.size;
  }

  /**
   * Edit this canvas viewports size
   * @param {number[]} size A new size of this canvas [width, height]
   */
  public setSize(size: number[]) {
    if (size.length > 0) {
      this.size[0] = size[0];
      this.size[1] = size[1];
      if (this.canvas) {
        this.canvas.width = this.size[0];
        this.canvas.height = this.size[1];
      }
    }
  }

  /**
   * Register some event listeners [mousedown, mouseup, mousemove, wheel]
   */
  protected initializeEventListener(): boolean {
    if (!this.canvas || !this.shader) {
      return false;
    }

    let view = this.shader.viewPosition;
    const look = this.shader.viewLookAt;

    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.bMouseOn = true;

      if (e.button == 1) {
        this.bUpdate = this.bUpdate ? false : true;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.bMouseOn = false;
    });

    // rotate when mouse downed
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.bMouseOn) {
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
   * Begin renderer update loop using async timer
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
      if (deltaTime > FPS_30 / 2.0) {
        prevTime = Date.now();
        this.update(deltaTime);
      }
    }
  }

  /**
   * Update loop function which executed on every frame
   * @param {number} deltaTime Duration between current and prev frame [ms]
   */
  protected update(deltaTime: number): void {
    if (!this.canvas || !this.shader || deltaTime <= 0.0 || !this.bUpdate) {
      return;
    }
    this.shader.update(deltaTime);
  }
}
