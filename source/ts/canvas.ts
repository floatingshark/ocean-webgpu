import * as glm from 'gl-matrix';
import { Scene } from '@ts/scene';
import { GLShader } from '@ts/glShader';
import { WebGPU } from './webGPU';

// import { GLShaderFFT } from '@ts/glShaderFFT';

export class Canvas {
	constructor(canvasID: string) {
		this.construct(canvasID);
	}

	public webGL: GLShader | null = null;
	public webGPU: WebGPU | null = null;

	protected canvas: HTMLCanvasElement | null = null;
	protected bMouseOn: boolean = false;
	protected bUpdate: boolean = true;

	protected construct(canvasID: string): void {
		this.canvas = document.getElementById(canvasID) as HTMLCanvasElement | null;
		if (!this.canvas) {
			throw new Error('Not found canvas element.');
		}

		this.canvas.width = this.canvas.clientWidth;
		this.canvas.height = this.canvas.clientHeight;
		this.initializeEventListener();

		// this.webGL = new GLShaderFFT(this.canvas);
		this.webGPU = new WebGPU();
	}

	protected initializeEventListener(): void {
		if (!this.canvas) {
			throw new Error('Not exist canvas element');
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
	}

	public async initializeRenderingContexts(): Promise<void> {
		if (!this.canvas) {
			throw new Error('Not found canvas element.');
		}
		
		/*
		if (this.webGL) {
			this.webGL.preUpdate();
		}*/

		if (this.webGPU) {
			await this.webGPU.initializeContexts(this.canvas);
		}
	}

	public update(): void {
		/*
		if (this.webGL) {
			this.webGL.update(deltaTime);
		}*/

		if (this.webGPU) {
			this.webGPU.draw();
		}
	}
}
