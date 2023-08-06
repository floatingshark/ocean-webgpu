import * as ShaderUtility from '@ts/shaderUtility';
import { Shader } from './shader';

/**
 * WebGL shader class for fft ocean
 */
export class ShaderFFT extends Shader {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initialize();
  }

  protected vertexIndex: number[] = [];

  protected size: number = 5.0;
  protected N: number = 32;
  protected A: number = 0.2;
  protected T: number = 200.0;
  protected f: number = 1.0;
  protected phi: number = 50000;
  protected h0ReData: ImageData = new ImageData(this.N, this.N);
  protected h0ImData: ImageData = new ImageData(this.N, this.N);

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

  protected vertexIndexBuffer: WebGLBuffer | null = null;
  protected attribLocationVertexIndex: number = 2;

  protected initialize(): boolean {
    if (!this.gl) {
      return false;
    }

    super.initialize();

    this.drawType = 1;
    this.vertexShaderSource = ShaderUtility.VERTEX_SHADER_FFT_SOURCE;
    this.fragmentShaderSource = ShaderUtility.FRAGMENT_SHADER_FFT_SOURCE;

    return true;
  }

  protected initializeAttribute(): boolean {
    if (!this.gl) {
      return false;
    }
    super.initializeAttribute();

    this.vertexIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexIndexBuffer);
    this.gl.enableVertexAttribArray(this.attribLocationVertexIndex);
    this.gl.vertexAttribIPointer(this.attribLocationVertexIndex, 1, this.gl.INT, 0, 0);

    return true;
  }

  protected registerAttribute(): boolean {
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

  protected initializeUniform(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }
    super.initializeUniform();

    this.uniformLocationN = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_N_NAME);
    this.uniformLocationA = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_A_NAME);
    this.uniformLocationT = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_T_NAME);
    this.uniformLocationF = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_F_NAME);
    this.uniformLocationPhi = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_PHI_NAME);
    this.uniformLocationTexH0Re = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_H0_REAL_NAME);
    this.uniformLocationTexH0Im = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_H0_IMAGINARY_NAME);

    this.textureH0Re = this.gl.createTexture();
    this.textureH0Im = this.gl.createTexture();

    return true;
  }

  protected registerUniform(): boolean {
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

  /**
   * Calculate Phillips spectrum
   * @returns success or not
   */
  protected calcurateH0(): boolean {
    const Lx = (this.N * 5) / 2;
    const Ly = (this.N * 5) / 2;
    const g: number = 9.81;

    function gauss(): number[] {
      const ret: number[] = [0.0, 0.0];
      ShaderUtility.generateGaussianRandom([Math.random(), Math.random()], ret);
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
        const reRGBA: number[] = this.encodeFloatToRGBA(h0_i[0]);
        this.h0ReData.data[imageDataIndex] = reRGBA[0];
        this.h0ReData.data[imageDataIndex + 1] = reRGBA[1];
        this.h0ReData.data[imageDataIndex + 2] = reRGBA[2];
        this.h0ReData.data[imageDataIndex + 3] = reRGBA[3];

        const imRGBA: number[] = this.encodeFloatToRGBA(h0_i[1]);
        this.h0ImData.data[imageDataIndex] = imRGBA[0];
        this.h0ImData.data[imageDataIndex + 1] = imRGBA[1];
        this.h0ImData.data[imageDataIndex + 2] = imRGBA[2];
        this.h0ImData.data[imageDataIndex + 3] = imRGBA[3];
      }
    }

    console.log(this.h0ImData);

    return true;
  }

  /**
   * Calculate vertex index array
   * @returns success or not
   */
  protected calcurateVertexIndex(): boolean {
    this.vertexIndex = new Array(this.N * this.N).fill(null).map((_, i) => i);
    return true;
  }

  public preUpdate(): void {
    super.preUpdate();

    ShaderUtility.generateSubdividedMesh2d(this.size, this.N, this.vertexArray, this.colorArray, this.indexArray);
    this.calcurateH0();
    this.calcurateVertexIndex();
  }

  public update(deltaTime: number) {
    if (!this.gl || deltaTime <= 0.0) {
      return;
    }
    super.update(deltaTime);
  }

  protected encodeFloatToRGBA(inFloat: number): number[] {
    const v1: number = inFloat * 255.0;
    const r: number = Math.floor(v1);
    const v2: number = (v1 - r) * 255.0;
    const g: number = Math.floor(v2);
    const v3: number = (v2 - g) * 255.0;
    const b: number = Math.floor(v3);
    const v4: number = (v3 - b) * 255.0;
    const a: number = Math.floor(v4);
    return [r, g, b, a];
  }
}
