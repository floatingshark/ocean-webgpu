import { Scene } from '@ts/scene';
import * as ShaderAPI from '@ts/shaderAPI';
import { gpuShader } from './gpuShader';

export class UniformFFT {
	public time: number = 0.0;
	public N: number = 256;
	public A: number = 50.0;
	public T: number = 200.0;
	public f: number = 1.0;
	public phi: number = 50000;
}

export class gpuShaderFFT extends gpuShader {
	constructor() {
		super();
	}

	protected uniformFFT: UniformFFT = new UniformFFT();
	protected uniformBufferFFT: GPUBuffer | null = null;

	protected h0Array: Float32Array = new Float32Array(2 * this.uniformFFT.N * this.uniformFFT.N);
	protected h0Buffer: GPUBuffer | null = null;
	protected htBuffer: GPUBuffer | null = null;
	protected computeInputBuffer: GPUBuffer | null = null;
	protected computeModule: GPUShaderModule | null = null;
	protected computePipeline: GPUComputePipeline | null = null;
	protected computeBindGroup: GPUBindGroup | null = null;

	override initialize(
		device: GPUDevice,
		canvasFormat: GPUTextureFormat,
		vertexArray: Float32Array,
		indexArray: Int32Array
	): void {
		super.initialize(device, canvasFormat, vertexArray, indexArray);
		this.initializeH0();
		this.initializeComputeShader(device);

		if (this.uniformFFT) {
			const uniformBufferFFTSize: number = 4 * 6;
			this.uniformBufferFFT = device.createBuffer({
				size: uniformBufferFFTSize,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.uniformBufferFFT, 0, new Float32Array([this.uniformFFT.time]));
			device.queue.writeBuffer(this.uniformBufferFFT, 4, new Float32Array([this.uniformFFT.N]));
			device.queue.writeBuffer(this.uniformBufferFFT, 8, new Float32Array([this.uniformFFT.A]));
			device.queue.writeBuffer(this.uniformBufferFFT, 12, new Float32Array([this.uniformFFT.T]));
			device.queue.writeBuffer(this.uniformBufferFFT, 16, new Float32Array([this.uniformFFT.f]));
			device.queue.writeBuffer(this.uniformBufferFFT, 20, new Float32Array([this.uniformFFT.phi]));
		}

		this.shaderModule = device.createShaderModule({
			label: 'FFT Ocean Shader',
			code: ` struct UniformsMVP {
						worldMatrix : mat4x4<f32>,
						viewMatrix : mat4x4<f32>,
						projectionMatrix : mat4x4<f32>
			  		}
					struct UniformsFFT {
						time : f32,
						N : f32,
						A : f32,
						T : f32,
						f : f32,
						phi: f32
					}
					@group(0) @binding(0) var<uniform> uniformsMVP : UniformsMVP;
					@group(0) @binding(1) var<uniform> uniformsFFT : UniformsFFT;

					@vertex
					fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f {
						return uniformsMVP.projectionMatrix * uniformsMVP.viewMatrix * uniformsMVP.worldMatrix * vec4f(pos * 0.8, 1);
					}

					@fragment
					fn fragmentMain() -> @location(0) vec4f {
						let time = uniformsFFT.time;
						return vec4f(1, 0, 0, 1);
					}
					`,
		});

		this.pipeline = device.createRenderPipeline({
			label: 'FFT Ocean Pipeline',
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

		if (this.pipeline && this.uniformBufferMVP && this.uniformBufferFFT) {
			this.bindGroup = device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(0),
				entries: [
					{
						binding: 0,
						resource: {
							buffer: this.uniformBufferMVP,
						},
					},
					{
						binding: 1,
						resource: {
							buffer: this.uniformBufferFFT,
						},
					},
				],
			});
		}
	}

	override update(device: GPUDevice) {
		super.update(device);

		if (!this.uniformBufferFFT) {
			throw new Error('Not exist FFT uniform buffer');
		}

		this.uniformFFT.time = Scene.time;
		device.queue.writeBuffer(this.uniformBufferFFT, 0, new Float32Array([this.uniformFFT.time]));
	}

	override computeCommand(computePass: GPUComputePassEncoder): void {
		if (!this.computePipeline) {
			throw new Error('Not exist compute shader contexts');
		}

		computePass.setPipeline(this.computePipeline);
		computePass.setBindGroup(0, this.computeBindGroup);
		computePass.dispatchWorkgroups(1, this.uniformFFT.N, 1);
	}

	override drawCommand(pass: GPURenderPassEncoder): void {
		super.drawCommand(pass);
	}

	override postCommand(device: GPUDevice): void {
		super.postCommand(device);

		if (!this.htBuffer) {
			throw new Error('Not exist ht buffer');
		}

		const stagingBuffer = device.createBuffer({
			mappedAtCreation: false,
			size: 4 * this.h0Array.length,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});

		const copyEncoder = device.createCommandEncoder();
		copyEncoder.copyBufferToBuffer(this.htBuffer, 0, stagingBuffer, 0, 4 * this.h0Array.length);
		const copyCommands = copyEncoder.finish();
		device.queue.submit([copyCommands]);

		stagingBuffer
			.mapAsync(GPUMapMode.READ)
			.then(() => {
				const copyArrayBuffer = stagingBuffer.getMappedRange();
				console.log(new Float32Array(copyArrayBuffer)); // [2, 4, 6, 8]
				stagingBuffer.unmap();
			})
			.catch((e) => {
				console.log(e);
			});
	}

	private initializeH0(): void {
		const N = this.uniformFFT.N;
		const Lx = (N * 5) / 2;
		const Ly = (N * 5) / 2;
		const g: number = 9.81;

		function gauss(): number[] {
			const ret: number[] = [0.0, 0.0];
			ShaderAPI.getGaussianRandom([Math.random(), Math.random()], ret);
			return ret;
		}

		function phillips(kx: number, ky: number, A: number, g: number): number {
			const k2mag: number = kx * kx + ky * ky;
			if (k2mag == 0.0) {
				return 0.0;
			}

			const windSpeed: number = 30.0;
			const windDir: number = Math.PI * 1.234;

			const k4mag: number = k2mag * k2mag;
			const L: number = (windSpeed * windSpeed) / g;
			const k_x: number = kx / Math.sqrt(k2mag);
			const k_y: number = ky / Math.sqrt(k2mag);
			const w_dot_k: number = k_x * Math.cos(windDir) + k_y * Math.sin(windDir);
			let phillips: number = ((A * Math.exp(-1.0 / (k2mag * L * L))) / k4mag) * w_dot_k * w_dot_k;
			const l2: number = (L / 1000) * (L / 1000);
			phillips *= Math.exp(-k2mag * l2);

			return phillips;
		}

		for (let y: number = 0; y < N; y++) {
			for (let x = 0; x < N; x++) {
				const kx: number = (-N / 2.0 + x) * ((2.0 * Math.PI) / Lx);
				const ky: number = (-N / 2.0 + y) * ((2.0 * Math.PI) / Ly);

				let p: number = phillips(kx, ky, 1.0, g);
				if (kx == 0.0 && ky == 0.0) {
					p = 0.0;
				}

				const gaussRand: number[] = gauss();
				const h0_i: number[] = [0.0, 0.0];
				h0_i[0] = (gaussRand[0] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
				h0_i[1] = (gaussRand[1] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);

				this.h0Array[y * N + x] = h0_i[0];
				this.h0Array[y * N + x + 1] = h0_i[1];
			}
		}
	}

	private initializeComputeShader(device: GPUDevice) {
		{
			this.h0Buffer = device.createBuffer({
				size: this.h0Array.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.h0Buffer, 0, this.h0Array);

			this.htBuffer = device.createBuffer({
				size: this.h0Array.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
			});

			this.computeInputBuffer = device.createBuffer({
				size: 8,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.computeInputBuffer, 0, new Int32Array([this.uniformFFT.N]));
			device.queue.writeBuffer(this.computeInputBuffer, 4, new Float32Array([Scene.time]));
		}

		this.computeModule = device.createShaderModule({
			code: `
			  struct H0 {
				data: array<vec2f>,
			  };
		
			  struct Ht {
				data: array<vec2f>,
			  };

			  struct Input {
				N: u32,
				t: f32
			  }
		
			  @group(0) @binding(0) var<storage, read> h0 : H0;
			  @group(0) @binding(1) var<storage, read_write> ht : Ht;
			  @group(0) @binding(2) var<storage, read> input: Input;
			  
			  const PI: f32 = 3.14159265;
			
			  fn conjugate(arg: vec2f) -> vec2f {
				var f2: vec2f = vec2f(0.0);
				f2.x = arg.x;
				f2.y = -arg.y;
				return f2;
			  }

			  fn complex_exp(arg: f32) -> vec2f {
				return vec2f(cos(arg), sin(arg));
			  }

			  fn complex_add(a: vec2f, b: vec2f) -> vec2f {
				return vec2f(a.x + b.x, a.y + b.y);
			  }

			  fn complex_mult(ab: vec2f, cd :vec2f) -> vec2f {
				return vec2f(ab.x * cd.x - ab.y * cd.y, ab.x * cd.y + ab.y * cd.x);
			  }

			  @compute @workgroup_size(256, 1, 1)
			  fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
				let x: u32 = global_id.x;
				let y: u32 = global_id.y;
				let in_index: u32  = y * input.N + x;
				let in_mindex: u32 = (input.N - y) % input.N * input.N + (input.N - x) % input.N;
				let out_index: u32 = y * input.N + x;

				let Lx: f32 = f32(input.N) * 5 / 2;
				let Ly: f32 = f32(input.N) * 5 / 2;

				// calculate wave vector
				var k: vec2f = vec2f(0.0, 0.0);
				k.x = (- f32(input.N) / 2.0 + f32(x)) * (2.0 * PI / Lx);
				k.y = (- f32(input.N) / 2.0 + f32(y)) * (2.0 * PI / Ly);

				// calculate dispersion w(k)
				let k_len: f32 = sqrt(k.x * k.x + k.y * k.y);
				let w: f32     = sqrt(9.81 * k_len);

				if ((x < input.N) && (y < input.N))
				{
					let h0_k: vec2f  = h0.data[in_index];
					let h0_mk: vec2f = h0.data[in_mindex];
					// output frequency-space complex values
					ht.data[out_index] = complex_add(complex_mult(h0_k, complex_exp(w * input.t)), complex_mult(conjugate(h0_mk), complex_exp(-w * input.t)));
				}

				//ht.data[out_index] = vec2f(f32(y));
			  }
			`,
		});

		this.computePipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: this.computeModule,
				entryPoint: 'main',
			},
		});

		this.computeBindGroup = device.createBindGroup({
			layout: this.computePipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: this.h0Buffer } },
				{ binding: 1, resource: { buffer: this.htBuffer } },
				{ binding: 2, resource: { buffer: this.computeInputBuffer } },
			],
		});
	}
}
