import { Scene } from '@ts/scene';
import * as ShaderAPI from '@ts/shaderAPI';
import { gpuShader } from './gpuShader';

export class UniformFFT {
	public time: number = 0.0;
	public N: number = 128;
	public A: number = 50.0;
	public T: number = 150.0;
}

export class gpuShaderFFT extends gpuShader {
	constructor() {
		super();
	}

	protected uniformFFT: UniformFFT = new UniformFFT();
	protected uniformBufferFFT: GPUBuffer | null = null;

	protected h0Array: Float32Array = new Float32Array(2 * this.uniformFFT.N * this.uniformFFT.N);
	protected storageBufferH0: GPUBuffer | null = null;
	protected storageBufferHt: GPUBuffer | null = null;
	protected storageBufferDz: GPUBuffer | null = null;
	protected computeInputBuffer: GPUBuffer | null = null;
	protected computeHtModule: GPUShaderModule | null = null;
	protected computeHtPipeline: GPUComputePipeline | null = null;
	protected computeHtBindGroup: GPUBindGroup | null = null;
	protected computeFFTModule: GPUShaderModule | null = null;
	protected computeFFTPipeline: GPUComputePipeline | null = null;
	protected computeFFTBindGroup: GPUBindGroup | null = null;

	override initialize(
		device: GPUDevice,
		canvasFormat: GPUTextureFormat,
		vertexArray: Float32Array, // eslint-disable-line
		indexArray: Int32Array // eslint-disable-line
	): void {
		const subVertexArray = ShaderAPI.Plane.subdividedVertexArray(this.uniformFFT.N);
		const subIndexArray = ShaderAPI.Plane.subdividedIndexArray(this.uniformFFT.N);

		super.initialize(device, canvasFormat, subVertexArray, subIndexArray);
		this.initializeH0();
		this.initializeComputeShaderHt(device);
		this.initializeComputeShaderFFT(device);

		if (this.uniformFFT) {
			const uniformBufferFFTSize: number = 4 * 6;
			this.uniformBufferFFT = device.createBuffer({
				size: uniformBufferFFTSize,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.uniformBufferFFT, 0, new Float32Array([this.uniformFFT.time]));
			device.queue.writeBuffer(this.uniformBufferFFT, 4, new Int32Array([this.uniformFFT.N]));
			device.queue.writeBuffer(this.uniformBufferFFT, 8, new Float32Array([this.uniformFFT.A]));
			device.queue.writeBuffer(this.uniformBufferFFT, 12, new Float32Array([this.uniformFFT.T]));
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
						N : u32,
						A : f32,
						T : f32,
					}
					struct VertexOutput {
						@builtin(position) position : vec4<f32>,
						@location(0) normal : vec4<f32>,
					}
					@group(0) @binding(0) var<uniform> uniformsMVP : UniformsMVP;
					@group(0) @binding(1) var<uniform> uniformsFFT : UniformsFFT;
					@group(0) @binding(2) var<storage> dz : array<f32>;

					@vertex
					fn vertexMain(@location(0) pos: vec3f, @builtin(vertex_index) i: u32) -> VertexOutput {
						var output: VertexOutput;
						output.position   = vec4f(pos, 1.0);
						output.position.z = dz[i];
						output.position   = uniformsMVP.projectionMatrix * uniformsMVP.viewMatrix * uniformsMVP.worldMatrix * output.position;
						
						let N: u32    = uniformsFFT.N;
						let x_id: u32 = i % N;
						let y_id: u32 = i / N;
						let x0: u32   = (x_id - 1 + N) % N;
    					let x1: u32   = (x_id + 1) % N;
						let y0: u32   = (y_id - 1 + N) % N;
    					let y1: u32   = (y_id + 1) % N;
						let subx : f32 = 0.5 * (dz[x1 + y_id * N] - dz[x0 + y_id * N]) * 100.0;
    					let suby : f32 = 0.5 * (dz[x_id + y1 * N] - dz[x_id + y0 * N]) * 100.0;
						let vec: vec3f = normalize(vec3f(-subx, -suby, 1.0));
						output.normal = vec4f(vec, 1.0);

						return output;
					}

					@fragment
					fn fragmentMain(@location(0) normal: vec4f) -> @location(0) vec4f {
						return normal;
						//return vec4f(0, 1.0, 1.0, 1);
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

		if (this.pipeline && this.uniformBufferMVP && this.uniformBufferFFT && this.storageBufferDz) {
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
					{
						binding: 2,
						resource: {
							buffer: this.storageBufferDz,
						},
					},
				],
			});
		}
	}

	override update(device: GPUDevice) {
		super.update(device);

		if (!this.uniformBufferFFT || !this.computeInputBuffer) {
			throw new Error('Not exist FFT uniform buffer');
		}

		this.uniformFFT.time = Scene.time;
		device.queue.writeBuffer(this.uniformBufferFFT, 0, new Float32Array([this.uniformFFT.time]));
		device.queue.writeBuffer(this.computeInputBuffer, 4, new Float32Array([Scene.time]));
	}

	override computeCommand(computePass: GPUComputePassEncoder): void {
		if (!this.computeHtPipeline) {
			throw new Error('Not exist compute shader ht contexts');
		}

		computePass.setPipeline(this.computeHtPipeline);
		computePass.setBindGroup(0, this.computeHtBindGroup);
		computePass.dispatchWorkgroups(1, this.uniformFFT.N, 1);

		if (!this.computeFFTPipeline) {
			throw new Error('Not exist compute shader fft contexts');
		}

		computePass.setPipeline(this.computeFFTPipeline);
		computePass.setBindGroup(0, this.computeFFTBindGroup);
		computePass.dispatchWorkgroups(1, this.uniformFFT.N, 1);
	}

	override drawCommand(pass: GPURenderPassEncoder): void {
		super.drawCommand(pass);
	}

	override postCommand(device: GPUDevice): void {
		super.postCommand(device);

		if (!this.storageBufferHt || !this.storageBufferDz) {
			throw new Error('Not exist export buffer');
		}

		const stagingBuffer = device.createBuffer({
			mappedAtCreation: false,
			size: 4 * this.h0Array.length,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});

		const stagingBuffer2 = device.createBuffer({
			mappedAtCreation: false,
			size: 4 * this.uniformFFT.N * this.uniformFFT.N,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});

		const copyEncoder = device.createCommandEncoder();
		copyEncoder.copyBufferToBuffer(this.storageBufferHt, 0, stagingBuffer, 0, 4 * this.h0Array.length);
		copyEncoder.copyBufferToBuffer(
			this.storageBufferDz,
			0,
			stagingBuffer2,
			0,
			4 * this.uniformFFT.N * this.uniformFFT.N
		);
		const copyCommands = copyEncoder.finish();
		device.queue.submit([copyCommands]);

		/*
		stagingBuffer
			.mapAsync(GPUMapMode.READ)
			.then(() => {
				const copyArrayBuffer = stagingBuffer.getMappedRange();
				console.log(new Float32Array(copyArrayBuffer));
				stagingBuffer.unmap();
			})
			.catch((e) => {
				console.log(e);
			});*/
		/*
		stagingBuffer2
			.mapAsync(GPUMapMode.READ)
			.then(() => {
				const copyArrayBuffer = stagingBuffer2.getMappedRange();
				console.log(new Float32Array(copyArrayBuffer));
				stagingBuffer2.unmap();
			})
			.catch((e) => {
				console.log(e);
			});*/
	}

	private initializeH0(): void {
		const N = this.uniformFFT.N;
		const Lx = (N * 5) / 2;
		const Ly = (N * 5) / 2;

		function gauss(): number[] {
			const ret: number[] = [0.0, 0.0];
			ShaderAPI.getGaussianRandom([Math.random(), Math.random()], ret);
			return ret;
		}

		function phillips(kx: number, ky: number): number {
			const k2mag: number = kx * kx + ky * ky;
			if (k2mag == 0.0) {
				return 0.0;
			}

			const G: number = 9.81;
			const A: number = 0.00000001;
			const windSpeed: number = 5.0;
			const windDir: number = Math.PI * 1.234;

			const k4mag: number = k2mag * k2mag;
			const L: number = (windSpeed * windSpeed) / G;
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

				let p: number = phillips(kx, ky);
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

	private initializeComputeShaderHt(device: GPUDevice) {
		{
			this.storageBufferH0 = device.createBuffer({
				size: this.h0Array.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.storageBufferH0, 0, this.h0Array);

			this.storageBufferHt = device.createBuffer({
				size: this.h0Array.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
			});

			this.computeInputBuffer = device.createBuffer({
				size: 12,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});

			device.queue.writeBuffer(this.computeInputBuffer, 0, new Int32Array([this.uniformFFT.N]));
			device.queue.writeBuffer(this.computeInputBuffer, 4, new Float32Array([Scene.time]));
			device.queue.writeBuffer(this.computeInputBuffer, 8, new Float32Array([this.uniformFFT.T]));
		}

		this.computeHtModule = device.createShaderModule({
			code: `	
			  struct Input {
				N: u32,
				t: f32,
				T: f32
			  }
		
			  @group(0) @binding(0) var<storage, read> h0 : array<vec2f>;
			  @group(0) @binding(1) var<storage, read_write> ht : array<vec2f>;
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

			  @compute @workgroup_size(128, 1, 1)
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
				let t: f32	   = input.t / (2.0 * input.T * PI);
				if ((x < input.N) && (y < input.N))
				{
					let h0_k: vec2f  = h0[in_index];
					let h0_mk: vec2f = h0[in_mindex];
					// output frequency-space complex values
					ht[out_index] = complex_add(complex_mult(h0_k, complex_exp(w * t)), complex_mult(conjugate(h0_mk), complex_exp(-w * t)));
				}
			  }
			`,
		});

		this.computeHtPipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: this.computeHtModule,
				entryPoint: 'main',
			},
		});

		this.computeHtBindGroup = device.createBindGroup({
			layout: this.computeHtPipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: this.storageBufferH0 } },
				{ binding: 1, resource: { buffer: this.storageBufferHt } },
				{ binding: 2, resource: { buffer: this.computeInputBuffer } },
			],
		});
	}

	private initializeComputeShaderFFT(device: GPUDevice) {
		{
			this.storageBufferDz = device.createBuffer({
				size: 4 * this.uniformFFT.N * this.uniformFFT.N,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
			});
		}

		this.computeFFTModule = device.createShaderModule({
			code: `	
			  struct Input {
				N: u32,
				t: f32,
				T: f32
			  }

			  @group(0) @binding(0) var<storage, read> ht : array<vec2f>;
			  @group(0) @binding(1) var<storage, read_write> dz : array<f32>;
			  @group(0) @binding(2) var<storage, read> input: Input;

			  const PI: f32 = 3.14159265;
			  
			  @compute @workgroup_size(128, 1, 1)
			  fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
				let x : i32  = i32(global_id.x) - i32(input.N) / 2;
				let y : i32  = i32(global_id.y) - i32(input.N) / 2;
				let N : i32   = i32(input.N);
				let id : i32 = i32(global_id.y) * N + i32(global_id.x);

				var dftsum: vec2f = vec2f(0);
				for (var j: i32 = 0; j < N; j++)
				{
					let ky: i32 = -N / 2 + j;
					for (var i: i32 = 0; i < N; i++)
					{
						let kx: i32  = - N / 2 + i;
						let rad: f32 = f32((kx * x + ky * y) % N) * (2.0 * PI / f32(N));
						let h: vec2f  = ht[j * N + i];
						dftsum.x += h.x * cos(rad) - h.y * sin(rad);
						dftsum.y += h.y * cos(rad) + h.x * sin(rad);
					}
				}

				dz[id] = dftsum.x;
			  }
			`,
		});

		this.computeFFTPipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: this.computeFFTModule,
				entryPoint: 'main',
			},
		});

		if (this.storageBufferHt && this.computeInputBuffer) {
			this.computeFFTBindGroup = device.createBindGroup({
				layout: this.computeFFTPipeline.getBindGroupLayout(0),
				entries: [
					{ binding: 0, resource: { buffer: this.storageBufferHt } },
					{ binding: 1, resource: { buffer: this.storageBufferDz } },
					{ binding: 2, resource: { buffer: this.computeInputBuffer } },
				],
			});
		}
	}
}
