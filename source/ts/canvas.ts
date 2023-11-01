import * as glm from 'gl-matrix';
import { Scene } from '@ts/scene';
import { WebGPU } from './webGPU';

export class Canvas {
	constructor(canvasID: string) {
		this.construct(canvasID);
	}

	public webGPU: WebGPU | null = null;

	protected canvas: HTMLCanvasElement | null = null;
	protected bMouseOn: boolean = false;

	protected construct(canvasID: string): void {
		this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;
		if (!this.canvas) {
			throw new Error('Not found canvas element.');
		}

		this.canvas.width = Scene.canvasWidth = this.canvas.clientWidth;
		this.canvas.height = Scene.canvasHeight = this.canvas.clientHeight;
		this.initializeEventListener();
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

		this.canvas.addEventListener('mousedown', () => {
			this.bMouseOn = true;
		});
		this.canvas.addEventListener('mouseup', () => {
			this.bMouseOn = false;
		});
		window.addEventListener('mousedown', () => {
			this.bMouseOn = true;
		});
		window.addEventListener('mouseup', () => {
			this.bMouseOn = false;
		});

		window.addEventListener('mousemove', (e: MouseEvent) => {
			if (this.bMouseOn) {
				// X
				const X_MAG: number = 0.005;
				const Xrotate: glm.mat4 = glm.mat4.rotate(
					glm.mat4.create(),
					glm.mat4.create(),
					-e.movementX * X_MAG,
					Scene.viewUp
				);
				view = glm.vec3.transformMat4(view, view, Xrotate);
				// Y
				const Y_MAG: number = 0.005;
				const Yaxis: glm.vec3 = glm.vec3.cross(glm.vec3.create(), Scene.viewUp, view);
				const Yrotate: glm.mat4 = glm.mat4.rotate(
					glm.mat4.create(),
					glm.mat4.create(),
					-e.movementY * Y_MAG,
					Yaxis
				);
				view = glm.vec3.transformMat4(view, view, Yrotate);
				Scene.viewPosition = view;
			}
		});

		this.canvas.addEventListener('wheel', (e: WheelEvent) => {
			const ZOOM_MAG: number = 0.002;
			let zoomBasis: glm.vec3 = glm.vec3.subtract(glm.vec3.create(), lookat, view);
			zoomBasis = glm.vec3.normalize(zoomBasis, zoomBasis);
			let zoomVec: glm.vec3 = glm.vec3.multiply(glm.vec3.create(), zoomBasis, glm.vec3.create().fill(-e.deltaY));
			zoomVec = glm.vec3.multiply(zoomVec, zoomVec, glm.vec3.create().fill(ZOOM_MAG));
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
		if (this.webGPU) {
			this.webGPU.update();
		}
	}
}
