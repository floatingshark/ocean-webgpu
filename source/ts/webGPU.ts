export class WebGPU {
	constructor() {}

	protected adapter: GPUAdapter | null = null;
	protected device: GPUDevice | null = null;
	protected context: GPUCanvasContext | null = null;
	protected canvasFormat: GPUTextureFormat | null = null;
	protected encoder: GPUCommandEncoder | null = null;

	public async initializeWebGPUContexts(canvas: HTMLCanvasElement): Promise<void> {
		if (!navigator.gpu) {
			throw new Error('WebGPU not supported on this browser.');
		}

		this.adapter = await navigator.gpu.requestAdapter();
		if (!this.adapter) {
			throw new Error('No appropriate GPUAdapter found.');
		}

		this.device = await this.adapter.requestDevice();

		this.context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
		if (this.context) {
			this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
			this.context.configure({
				device: this.device,
				format: this.canvasFormat,
			});
		}

		this.encoder = this.device.createCommandEncoder();
		if (this.context) {
			const pass = this.encoder.beginRenderPass({
				colorAttachments: [
					{
						view: this.context.getCurrentTexture().createView(),
						loadOp: 'clear',
						storeOp: 'store',
						clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
					},
				],
			});
			pass.end();
		}

		const commandBuffer = this.encoder.finish();
		this.device.queue.submit([commandBuffer]);
		this.device.queue.submit([this.encoder.finish()]);
	}
}
