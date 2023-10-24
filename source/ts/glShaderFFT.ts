import * as ShaderAPI from '@ts/shaderAPI';
import { GLShader } from './glShader';
import VERTEX_SHADER_FFT from '@shader/fft_wave.vert';
import FRAGMENT_SHADER_FFT from '@shader/fft_wave.frag';

export class GLShaderFFT extends GLShader {
	constructor(canvas: HTMLCanvasElement) {
		super(canvas);
		this.construct(canvas);
	}

	protected override vertexShaderSource: string = VERTEX_SHADER_FFT;
	protected override fragmentShaderSource: string = FRAGMENT_SHADER_FFT;
	protected override drawType: number = 1;

	protected vertexIndex: number[] = [];

	protected size: number = 5.0;
	protected N: number = 8;
	protected A: number = 50.0;
	protected T: number = 200.0;
	protected f: number = 1.0;
	protected phi: number = 50000;
	protected h0ReData: ImageData = new ImageData(this.N, this.N);
	protected h0ImData: ImageData = new ImageData(this.N, this.N);

	protected vertexIndexBuffer: WebGLBuffer | null = null;

	protected uniformLocationN: WebGLUniformLocation | null = null;
	protected uniformLocationA: WebGLUniformLocation | null = null;
	protected uniformLocationT: WebGLUniformLocation | null = null;
	protected uniformLocationF: WebGLUniformLocation | null = null;
	protected uniformLocationPhi: WebGLUniformLocation | null = null;
	protected uniformLocationTexH0Re: WebGLUniformLocation | null = null;
	protected uniformLocationTexH0Im: WebGLUniformLocation | null = null;

	protected textureH0: WebGLTexture | null = null;
	protected textureH0Re: WebGLTexture | null = null;
	protected textureH0Im: WebGLTexture | null = null;

	private UNIFORM_N_NAME: string = 'u_N';
	private UNIFORM_A_NAME: string = 'u_A';
	private UNIFORM_T_NAME: string = 'u_T';
	private UNIFORM_F_NAME: string = 'u_f';
	private UNIFORM_PHI_NAME: string = 'u_Phi';
	private UNIFORM_H0_REAL_NAME: string = 'u_texH0Re';
	private UNIFORM_H0_IMAGINARY_NAME: string = 'u_texH0Im';

	// derived from Shader.ts
	override initializeAttributeBuffer(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}
		super.initializeAttributeBuffer();

		const attribLocationVertexIndex: number = 2;

		this.vertexIndexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexIndexBuffer);
		this.gl.enableVertexAttribArray(attribLocationVertexIndex);
		this.gl.vertexAttribIPointer(attribLocationVertexIndex, 1, this.gl.INT, 0, 0);

		return true;
	}

	// derived from Shader.ts
	override registerAttribute(): boolean {
		if (!this.gl) {
			return false;
		}
		super.registerAttribute();

		if (this.vertexIndexBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexIndexBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Int32Array(this.vertexIndex), this.gl.STATIC_DRAW);
		}

		return true;
	}

	// derived from Shader.ts
	override initializeUniform(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}
		super.initializeUniform();
		this.uniformLocationN = this.gl.getUniformLocation(this.program, this.UNIFORM_N_NAME);
		this.uniformLocationA = this.gl.getUniformLocation(this.program, this.UNIFORM_A_NAME);
		this.uniformLocationT = this.gl.getUniformLocation(this.program, this.UNIFORM_T_NAME);
		this.uniformLocationF = this.gl.getUniformLocation(this.program, this.UNIFORM_F_NAME);
		this.uniformLocationPhi = this.gl.getUniformLocation(this.program, this.UNIFORM_PHI_NAME);
		this.uniformLocationTexH0Re = this.gl.getUniformLocation(this.program, this.UNIFORM_H0_REAL_NAME);
		this.uniformLocationTexH0Im = this.gl.getUniformLocation(this.program, this.UNIFORM_H0_IMAGINARY_NAME);

		this.textureH0Re = this.gl.createTexture();
		this.textureH0Im = this.gl.createTexture();

		return true;
	}

	// derived from Shader.ts
	override registerUniform(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}
		super.registerUniform();

		if (this.uniformLocationN) {
			this.gl.uniform1i(this.uniformLocationN, this.N);
		}

		if (this.uniformLocationA) {
			this.gl.uniform1f(this.uniformLocationA, this.A);
		}

		if (this.uniformLocationT) {
			this.gl.uniform1f(this.uniformLocationT, this.T);
		}

		if (this.uniformLocationF) {
			this.gl.uniform1f(this.uniformLocationF, this.f);
		}

		if (this.uniformLocationPhi) {
			this.gl.uniform1f(this.uniformLocationPhi, this.phi);
		}

		if (this.uniformLocationTexH0Re && this.textureH0Re) {
			this.gl.activeTexture(this.gl.TEXTURE1);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureH0Re);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.h0ReData);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.gl.uniform1i(this.uniformLocationTexH0Re, 1);
		}

		if (this.uniformLocationTexH0Im && this.textureH0Im) {
			this.gl.activeTexture(this.gl.TEXTURE2);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureH0Im);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.h0ImData);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.gl.uniform1i(this.uniformLocationTexH0Im, 2);
		}

		return true;
	}

	protected calcurateH0(): boolean {
		const Lx = (this.N * 5) / 2;
		const Ly = (this.N * 5) / 2;
		const g: number = 9.81;

		function gauss(): number[] {
			const ret: number[] = [0.0, 0.0];
			ShaderAPI.generateGaussianRandom([Math.random(), Math.random()], ret);
			// ret[0] = Math.abs(ret[0]);
			// ret[1] = Math.abs(ret[1]);
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

		for (let y: number = 0; y < this.N; y++) {
			for (let x = 0; x < this.N; x++) {
				const kx: number = (-this.N / 2.0 + x) * ((2.0 * Math.PI) / Lx);
				const ky: number = (-this.N / 2.0 + y) * ((2.0 * Math.PI) / Ly);

				let p: number = phillips(kx, ky, 1.0, g);
				if (kx == 0.0 && ky == 0.0) {
					p = 0.0;
				}

				const gaussRand: number[] = gauss();
				const h0_i: number[] = [0.0, 0.0];
				h0_i[0] = (gaussRand[0] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
				h0_i[1] = (gaussRand[1] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);

				const imageDataIndex: number = (x + y * this.N) * 4;
				const reRGBA: number[] = ShaderAPI.encodeFloatToRGBA(h0_i[0]);
				this.h0ReData.data[imageDataIndex] = reRGBA[0];
				this.h0ReData.data[imageDataIndex + 1] = reRGBA[1];
				this.h0ReData.data[imageDataIndex + 2] = reRGBA[2];
				this.h0ReData.data[imageDataIndex + 3] = reRGBA[3];

				const imRGBA: number[] = ShaderAPI.encodeFloatToRGBA(h0_i[1]);
				this.h0ImData.data[imageDataIndex] = imRGBA[0];
				this.h0ImData.data[imageDataIndex + 1] = imRGBA[1];
				this.h0ImData.data[imageDataIndex + 2] = imRGBA[2];
				this.h0ImData.data[imageDataIndex + 3] = imRGBA[3];
			}
		}

		return true;
	}

	protected calcurateVertexIndex(): boolean {
		this.vertexIndex = new Array(this.N * this.N).fill(null).map((_, i) => i);
		return true;
	}

	// derived from Shader.ts
	override preUpdate(): void {
		super.preUpdate();
		ShaderAPI.generateSubdividedMesh2d(this.size, this.N, this.vertexArray, this.colorArray, this.indexArray);
		this.calcurateH0();
		this.calcurateVertexIndex();
	}

	// derived from Shader.ts
	override update(deltaTime: number) {
		if (!this.gl || deltaTime <= 0.0) {
			return;
		}
		super.update(deltaTime);
	}
}
