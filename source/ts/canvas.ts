import * as glm from 'gl-matrix';
import { Scene } from '@ts/scene';
import { WebGPU } from './webGPU';
import { GLShader } from '@ts/glShader';
//import { GLShaderFFT } from '@ts/glShaderFFT';

export class Canvas {
	constructor(canvasID: string) {
		this.construct(canvasID);
	}

	protected canvas: HTMLCanvasElement | null = null;
	protected bMouseOn: boolean = false;
	protected time: number = 0.0;
	protected bUpdate: boolean = true;

	protected webGL: GLShader | null = null;
	protected webGPU: WebGPU | null = null;

	protected construct(canvasID: string): void {
		this.canvas = document.getElementById(canvasID) as HTMLCanvasElement | null;
		if (this.canvas) {
			this.canvas.width = this.canvas.clientWidth;
			this.canvas.height = this.canvas.clientHeight;
			//this.webGL = new GLShaderFFT(this.canvas);
			this.webGPU = new WebGPU();
			this.initializeEventListener();
		}
	}

	protected initializeEventListener(): boolean {
		if (!this.canvas || !this.webGL) {
			return false;
		}

		let view = Scene.viewPosition;
		const lookat = Scene.viewLookAt;

		this.canvas.addEventListener('resize', () => {
			if (this.canvas) {
				this.canvas.width = this.canvas.clientWidth;
				this.canvas.height = this.canvas.clientHeight;
			}
		});

		this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
			this.bMouseOn = true;
			if (e.button == 1) {
				this.bUpdate = this.bUpdate ? false : true;
			}
		});

		this.canvas.addEventListener('mouseup', () => {
			this.bMouseOn = false;
		});

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
				Scene.viewPosition = view;
			}
		});

		this.canvas.addEventListener('wheel', (e: WheelEvent) => {
			const ZOOM_MAGNITUDE: number = 0.01;
			let zoomBasis: glm.vec3 = glm.vec3.subtract(glm.vec3.create(), lookat, view);
			zoomBasis = glm.vec3.normalize(zoomBasis, zoomBasis);
			let zoomVec: glm.vec3 = glm.vec3.multiply(glm.vec3.create(), zoomBasis, glm.vec3.create().fill(-e.deltaY));
			zoomVec = glm.vec3.multiply(zoomVec, zoomVec, glm.vec3.create().fill(ZOOM_MAGNITUDE));
			glm.vec3.add(view, view, zoomVec);
			Scene.viewPosition = view;
		});

		return true;
	}

	public async initializeContext(): Promise<void> {
		if ((this.canvas && this, this.webGPU)) {
			await this.webGPU.initializeWebGPUContexts(this.canvas as HTMLCanvasElement);
			this.webGPU.initializeShader();
			this.webGPU.drawCommand();
		}
	}

	public async beginUpdate(): Promise<void> {
		function animationFramePromise(): Promise<number> {
			return new Promise<number>((resolve) => {
				globalThis.requestAnimationFrame(resolve);
			});
		}

		if (this.webGL) {
			this.webGL.preUpdate();
		}

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

	protected update(deltaTime: number): void {
		Scene.update(deltaTime);
		//this.webGL.update(deltaTime);
	}
}
