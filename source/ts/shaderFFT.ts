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

  protected size: number = 1.0;
  protected lattice: number = 64;
  protected spectrum: number[][] = [];

  protected spectrumBuffer: WebGLBuffer | null = null;
  protected attribLocationSpectrum: number = 2;

  protected initialize(): boolean {
    if (!this.glContext) {
      return false;
    }

    super.initialize();

    this.drawType = 1;
    this.vertexShaderSource = ShaderUtility.VERTEX_SHADER_FFT_SOURCE;
    this.fragmentShaderSource = ShaderUtility.FRAGMENT_SHADER_UNRIT_SOURCE;

    return true;
  }

  protected initializeAttribute(): boolean {
    if (!this.glContext) {
      return false;
    }
    super.initializeAttribute();

    this.spectrumBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.spectrumBuffer);
    this.glContext.enableVertexAttribArray(this.attribLocationSpectrum);
    this.glContext.vertexAttribPointer(this.attribLocationSpectrum, 2, this.glContext.FLOAT, false, 0, 0);

    return true;
  }

  protected registerAttribute(): boolean {
    if (!this.glContext) {
      return false;
    }
    super.registerAttribute();

    this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.spectrumBuffer);
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      new Float32Array(this.spectrum.flat()),
      this.glContext.STATIC_DRAW
    );

    return true;
  }

  protected initializeUniformLocation(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }
    super.initializeUniformLocation();
    return true;
  }

  protected registerUniform(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }
    super.registerUniform();
    return true;
  }

  /**
   * Calculate Phillips spectrum
   * @returns success or not
   */
  protected calcurateSpectrum(): boolean {
    const Lx = (this.lattice * 5) / 2;
    const Ly = (this.lattice * 5) / 2;

    function gauss(): number[] {
      const ret: number[] = [0.0, 0.0];
      ShaderUtility.generateGaussianRandom([Math.random(), Math.random()], ret);
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

    const h0: number[][] = [];

    for (let y: number = 0; y < this.lattice; y++) {
      for (let x = 0; x < this.lattice; x++) {
        const kx: number = (-this.lattice / 2.0 + x) * ((2.0 * Math.PI) / Lx);
        const ky: number = (-this.lattice / 2.0 + y) * ((2.0 * Math.PI) / Ly);
        let p: number = phillips(kx, ky);
        if (kx == 0.0 && ky == 0.0) {
          p = 0.0;
        }

        const gaussRand: number[] = gauss();
        const h0_i: number[] = [0.0, 0.0];
        h0_i[0] = (gaussRand[0] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
        h0_i[1] = (gaussRand[1] * Math.sqrt(p * 0.5)) / Math.sqrt(2.0);
        h0.push(h0_i);
      }
    }

    this.spectrum = h0;
    return true;
  }

  public preUpdate(): void {
    super.preUpdate();

    ShaderUtility.generateSubdividedMesh2d(this.size, this.lattice, this.vertexArray, this.colorArray, this.indexArray);
    this.calcurateSpectrum();
  }

  public update(deltaTime: number) {
    if (!this.glContext || deltaTime <= 0.0) {
      return;
    }
    super.update(deltaTime);
  }
}
