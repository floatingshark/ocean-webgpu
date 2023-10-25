import * as ShaderAPI from '@ts/shaderAPI';
import { Scene } from '@ts/scene';

export class WebGPU {
	constructor() {}

	public adapter: GPUAdapter | null = null;
	public device: GPUDevice | null = null;
	public context: GPUCanvasContext | null = null;
	public canvasFormat: GPUTextureFormat | null = null;

	protected vertices: Float32Array = new Float32Array();
	protected vertexBuffer: GPUBuffer | null = null;
	protected vertexBufferLayout: GPUVertexBufferLayout = { arrayStride: 0, attributes: [] };
	protected cellShaderModule: GPUShaderModule | null = null;
	protected cellPipeline: GPURenderPipeline | null = null;

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
	}

	public initializeShader(): void {
		this.vertices = ShaderAPI.MESH_2D_VERTICE_ARRAY_TYPE;

		if (this.device) {
			this.vertexBuffer = this.device.createBuffer({
				label: 'Cell vertices',
				size: this.vertices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			});

			this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

			this.vertexBufferLayout = {
				arrayStride: 12,
				attributes: [
					{
						format: 'float32x3',
						offset: 0,
						shaderLocation: 0,
					},
				],
			};

			this.cellShaderModule = this.device.createShaderModule({
				label: 'Cell shader',
				code: `
					@vertex
					fn vertexMain(@location(0) pos: vec3f) ->
					@builtin(position) vec4f {
					return vec4f(pos * 0.8, 1);
					}

					@fragment
					fn fragmentMain() -> @location(0) vec4f {
					return vec4f(1, 0, 0, 1);
					}
				`,
			});

			this.cellPipeline = this.device.createRenderPipeline({
				label: 'Cell pipeline',
				layout: 'auto',
				vertex: {
					module: this.cellShaderModule,
					entryPoint: 'vertexMain',
					buffers: [this.vertexBufferLayout],
				},
				fragment: {
					module: this.cellShaderModule,
					entryPoint: 'fragmentMain',
					targets: [
						{
							format: this.canvasFormat as GPUTextureFormat,
						},
					],
				},
			});
		}
	}

	public draw(): void {
		if (!this.device) {
			return;
		}

		const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
		if (encoder) {
			if (this.context) {
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
					object.material.drawCommand(pass);
				}

				pass.end();
			}

			const commandBuffer = encoder.finish();
			this.device.queue.submit([commandBuffer]);
		}
	}
}
