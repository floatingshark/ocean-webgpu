import * as glm from 'gl-matrix';
import { Scene } from '@ts/scene';

export class Uniform{
	public world: glm.mat4 = glm.mat4.create();
	public view: glm.mat4 = glm.mat4.create();
	public projection: glm.mat4 = glm.mat4.create();
}

export class Material {
	constructor() {}

	protected vertexBuffer: GPUBuffer | null = null;
	protected vertexBufferLayout: GPUVertexBufferLayout = { arrayStride: 0, attributes: [] };
	protected indexBuffer: GPUBuffer | null = null;
	protected uniformBuffer: GPUBuffer | null = null;
	protected bindGroup: GPUBindGroup | null = null;
	protected shaderModule: GPUShaderModule | null = null;
	protected pipeline: GPURenderPipeline | null = null;

	public initialize(
		device: GPUDevice,
		canvasFormat: GPUTextureFormat,
		vertexArray: Float32Array,
		indexArray: Int32Array
	): void {
		this.vertexBuffer = device.createBuffer({
			label: 'vertices',
			size: vertexArray.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});

		this.indexBuffer = device.createBuffer({
			label: 'indices',
			size: indexArray.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});

		const uniformBufferSize: number = 4 * 16 * 3;
		this.uniformBuffer = device.createBuffer({
			size: uniformBufferSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		device.queue.writeBuffer(this.vertexBuffer, 0, vertexArray);
		device.queue.writeBuffer(this.indexBuffer, 0, indexArray);

		const worldMatrix: Float32Array = glm.mat4.create() as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 0,
			worldMatrix.buffer,
			worldMatrix.byteOffset,
			worldMatrix.byteLength
		);

		const viewMatrix: Float32Array = Scene.viewMatrix as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 1,
			viewMatrix.buffer,
			viewMatrix.byteOffset,
			viewMatrix.byteLength
		);

		const projectionMatrix: Float32Array = Scene.projectionMatrix as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 2,
			projectionMatrix.buffer,
			projectionMatrix.byteOffset,
			projectionMatrix.byteLength
		);

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
			code: ` struct Uniforms {
						worldMatrix : mat4x4<f32>,
						viewMatrix : mat4x4<f32>,
						projectionMatrix : mat4x4<f32>
			 	 	}
					@binding(0) @group(0) var<uniform> uniforms : Uniforms;

					@vertex
					fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f {
						return uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.worldMatrix * vec4f(pos * 0.8, 1);
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

		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer,
					},
				},
			],
		});
	}

	public update(device: GPUDevice, uniform: Uniform) {
		if(!this.uniformBuffer){
			throw new Error('Uniform buffer is not initialized');
		}

		const worldMatrix: Float32Array = uniform.world as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 0,
			worldMatrix.buffer,
			worldMatrix.byteOffset,
			worldMatrix.byteLength
		);

		const viewMatrix: Float32Array = uniform.view as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 1,
			viewMatrix.buffer,
			viewMatrix.byteOffset,
			viewMatrix.byteLength
		);

		const projectionMatrix: Float32Array = uniform.projection as Float32Array;
		device.queue.writeBuffer(
			this.uniformBuffer,
			4 * 16 * 2,
			projectionMatrix.buffer,
			projectionMatrix.byteOffset,
			projectionMatrix.byteLength
		);
	}

	public drawCommand(pass: GPURenderPassEncoder): void {
		if (this.pipeline && this.vertexBuffer && this.indexBuffer) {
			pass.setPipeline(this.pipeline);
			pass.setBindGroup(0, this.bindGroup);
			pass.setVertexBuffer(0, this.vertexBuffer);
			pass.setIndexBuffer(this.indexBuffer, 'uint32');
			pass.drawIndexed(6);
		}
	}
}
