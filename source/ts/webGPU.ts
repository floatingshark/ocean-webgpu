import { Scene } from '@ts/scene';

export class WebGPU {
	constructor() {}

	public adapter: GPUAdapter | null = null;
	public device: GPUDevice | null = null;
	public context: GPUCanvasContext | null = null;
	public canvasFormat: GPUTextureFormat | null = null;

	public async initializeContexts(canvas: HTMLCanvasElement): Promise<void> {
		if (!navigator.gpu) {
			throw new Error('WebGPU not supported on this browser.');
		}

		this.adapter = await navigator.gpu.requestAdapter();
		if (!this.adapter) {
			throw new Error('No appropriate GPUAdapter found.');
		}

		this.device = await this.adapter.requestDevice();

		this.context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
		if (!this.context) {
			throw new Error('Failed get context');
		}

		this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
		this.context.configure({
			device: this.device,
			format: this.canvasFormat,
		});
	}

	public draw(): void {
		if (!this.device) {
			throw new Error('Not exist device');
		}
		if (!this.context) {
			throw new Error('Not exist context');
		}

		const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
		if (encoder) {
			const pass: GPURenderPassEncoder = encoder.beginRenderPass({
				colorAttachments: [
					{
						view: this.context.getCurrentTexture().createView(),
						loadOp: 'clear',
						storeOp: 'store',
						clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
					},
				],
			});

			for (const object of Scene.getObjects()) {
				object.gpuShader.drawCommand(pass);
			}

			pass.end();

			const commandBuffer = encoder.finish();
			this.device.queue.submit([commandBuffer]);
		}
	}
}
