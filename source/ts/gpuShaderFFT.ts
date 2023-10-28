import {Scene} from '@ts/scene'
import * as ShaderAPI from '@ts/shaderAPI';
import { gpuShader } from './gpuShader';

export class UniformFFT {
	public time: number = 0.0;
	public N: number = 64;
	public A: number = 50.0;
	public T: number = 200.0;
	public f: number = 1.0;
	public phi: number = 50000;
	public h0Re: ImageData = new ImageData(this.N, this.N);
	public h0Im: ImageData = new ImageData(this.N, this.N);
}

export class gpuShaderFFT extends gpuShader {
	constructor() {
		super();
	}

	protected uniformFFT: UniformFFT = new UniformFFT();
	protected uniformBufferFFT: GPUBuffer | null = null;

	override initialize(
		device: GPUDevice,
		canvasFormat: GPUTextureFormat,
		vertexArray: Float32Array,
		indexArray: Int32Array
	): void {
		super.initialize(device, canvasFormat, vertexArray, indexArray);
		this.initializeH0();

		const uniformBufferFFTSize: number = 4 * 6;
		this.uniformBufferFFT = device.createBuffer({
			size: uniformBufferFFTSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
	}

	override update(devece: GPUDevice) {
		super.update(devece);
		
		this.uniformFFT.time = Scene.time;
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

				const imageDataIndex: number = (x + y * N) * 4;
				const reRGBA: number[] = ShaderAPI.encodeFloatToRGBA(h0_i[0]);
				this.uniformFFT.h0Re.data[imageDataIndex] = reRGBA[0];
				this.uniformFFT.h0Re.data[imageDataIndex + 1] = reRGBA[1];
				this.uniformFFT.h0Re.data[imageDataIndex + 2] = reRGBA[2];
				this.uniformFFT.h0Re.data[imageDataIndex + 3] = reRGBA[3];

				const imRGBA: number[] = ShaderAPI.encodeFloatToRGBA(h0_i[1]);
				this.uniformFFT.h0Im.data[imageDataIndex] = imRGBA[0];
				this.uniformFFT.h0Im.data[imageDataIndex + 1] = imRGBA[1];
				this.uniformFFT.h0Im.data[imageDataIndex + 2] = imRGBA[2];
				this.uniformFFT.h0Im.data[imageDataIndex + 3] = imRGBA[3];
			}
		}
	}
}
