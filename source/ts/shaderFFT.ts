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

  protected size: number = 1.0;
  protected N: number = 32;
  protected h0: number[][] = [];
  protected h0m: number[][] = [];

  protected uniformLocationN: WebGLUniformLocation | null = null;

  protected vertexIndexBuffer: WebGLBuffer | null = null;
  protected h0Buffer: WebGLBuffer | null = null;
  protected h0mBuffer: WebGLBuffer | null = null;
  protected attribLocationVertexIndex: number = 2;
  protected attribLocationH0: number = 3;
  protected attribLocationH0m: number = 4;

  protected initialize(): boolean {
    if (!this.gl) {
      return false;
    }

    super.initialize();

    this.drawType = 0;
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

    this.h0Buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.h0Buffer);
    this.gl.enableVertexAttribArray(this.attribLocationH0);
    this.gl.vertexAttribPointer(this.attribLocationH0, 2, this.gl.FLOAT, false, 0, 0);

    this.h0mBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.h0mBuffer);
    this.gl.enableVertexAttribArray(this.attribLocationH0m);
    this.gl.vertexAttribPointer(this.attribLocationH0m, 2, this.gl.FLOAT, false, 0, 0);

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

    if (this.h0Buffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.h0Buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.h0.flat()), this.gl.STATIC_DRAW);
    }

    if (this.h0mBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.h0mBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.h0m.flat()), this.gl.STATIC_DRAW);
    }

    return true;
  }

  protected initializeUniformLocation(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }
    super.initializeUniformLocation();

    this.uniformLocationN = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_N_NAME);

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

    return true;
  }

  /**
   * Calculate Phillips spectrum
   * @returns success or not
   */
  protected calcurateH0(): boolean {
    const Lx = (this.N * 5) / 2;
    const Ly = (this.N * 5) / 2;

    function gauss(): number[] {
      const ret: number[] = [0.0, 0.0];
      ShaderUtility.generateGaussianRandom([Math.random(), Math.random()], ret);
      // ret[0] = Math.abs(ret[0]);
      // ret[1] = Math.abs(ret[1]);
      return ret;
    }

    function phillips(kx: number, ky: number): number {
      const k2mag: number = kx * kx + ky * ky;
      if (k2mag == 0.0) {
        return 0.0;
      }

      const G: number = 9.81;
      const A: number = 0.01;
      const windSpeed: number = 30.0;
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

    for (let y: number = 0; y < this.N; y++) {
      for (let x = 0; x < this.N; x++) {
        const kx: number = (-this.N / 2.0 + x) * ((2.0 * Math.PI) / Lx);
        const ky: number = (-this.N / 2.0 + y) * ((2.0 * Math.PI) / Ly);
        let p: number = phillips(kx, ky);
        if (kx == 0.0 && ky == 0.0) {
          p = 0.0;
        }

        const gaussRand: number[] = gauss();
        const h0_i: number[] = [0.0, 0.0];
        h0_i[0] = (gaussRand[0] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
        h0_i[1] = (gaussRand[1] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
        this.h0.push(h0_i);
        this.h0m.unshift(h0_i);
      }
    }

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
}
