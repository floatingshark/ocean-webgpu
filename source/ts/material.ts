export class Material {
	constructor() {}

	protected vertexBuffer: GPUBuffer | null = null;
	protected vertexBufferLayout: GPUVertexBufferLayout = { arrayStride: 0, attributes: [] };
	protected shaderModule: GPUShaderModule | null = null;
	protected pipeline: GPURenderPipeline | null = null;

	public initialize(device: GPUDevice, canvasFormat: GPUTextureFormat, vertices: Float32Array): void {
		if (device) {
			this.vertexBuffer = device.createBuffer({
				label: 'Cell vertices',
				size: vertices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

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

			this.shaderModule = device.createShaderModule({
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

			this.pipeline = device.createRenderPipeline({
				label: 'Cell pipeline',
				layout: 'auto',
				vertex: {
					module: this.shaderModule,
					entryPoint: 'vertexMain',
					buffers: [this.vertexBufferLayout],
				},
				fragment: {
					module: this.shaderModule,
					entryPoint: 'fragmentMain',
					targets: [
						{
							format: canvasFormat as GPUTextureFormat,
						},
					],
				},
			});
		}
	}

	public drawCommand(pass: GPURenderPassEncoder): void {
		if (this.pipeline && this.vertexBuffer) {
			pass.setPipeline(this.pipeline);
			pass.setVertexBuffer(0, this.vertexBuffer);
			pass.draw(this.vertexBufferLayout.arrayStride / 3);
		}
	}
}
