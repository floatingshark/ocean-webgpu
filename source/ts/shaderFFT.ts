import * as ShaderUtility from '@ts/shaderUtility';
import { Shader } from './shader';

export class ShaderFFT extends Shader {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initialize();
  }

  protected size: number = 3.0
  protected lattice: number = 32;
  protected spectrum: number[] = [0.0];

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
    this.glContext.bufferData(this.glContext.ARRAY_BUFFER, new Float32Array(this.spectrum), this.glContext.STATIC_DRAW);

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

  protected calcurateSpectrum(): boolean {
    const sum: number = this.lattice * this.lattice * 2;
    this.spectrum.length = sum;
    for (let i = 0; i < sum; i += 2) {
      const gaussianRand: number[] = [0.0, 0.0];
      ShaderUtility.generateGaussianRandom([Math.random(), Math.random()], gaussianRand);
      this.spectrum[i] = gaussianRand[0];
      this.spectrum[i + 1] = gaussianRand[1];
    }

    return true;
  }

  public preUpdate(): void {
    super.preUpdate();
    ShaderUtility.generateSubdividedMesh2d(
      this.size,
      this.lattice,
      this.vertexArray,
      this.colorArray,
      this.indexArray
    );
    this.calcurateSpectrum();
  }

  public update(deltaTime: number) {
    if (!this.glContext || deltaTime <= 0.0) {
      return;
    }
    super.update(deltaTime);
  }
}
