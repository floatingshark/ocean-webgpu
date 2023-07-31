import * as ShaderUtility from '@ts/shaderUtility';
import { Shader } from './shader';

export class ShaderSyntesis extends Shader {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initialize();
  }

  /** uniform location of time value */
  protected uniformLocationTime: WebGLUniformLocation | null = null;
  /** uniform location of wave number */
  protected uniformLocationWaveNumber: WebGLUniformLocation | null = null;
  /** uniform location of wave amplitude[A] */
  protected uniformLocationWaveAmplitude: WebGLUniformLocation | null = null;
  /** uniform location of wave length[λ] */
  protected uniformLocationWaveLength: WebGLUniformLocation | null = null;
  /** uniform location of wave speed[S] */
  protected unifromLocationWaveCycle: WebGLUniformLocation | null = null;
  /** uniform location of wave direction[D] */
  protected uniformLocationWaveDirection: WebGLUniformLocation | null = null;

  /** wave number >= 1 and integer */
  protected waveNumber: number = 4;
  /** each wave max height */
  protected amplitude: number[] = [0.3, 0.2, 0.3, 0.05];
  /** each wave length */
  protected length: number[] = [4.0, 4.2, 3.5, 3.1];
  /** each wave cycle - being different is better */
  protected cycle: number[] = [3200, 2700, 3500, 1000];
  /** each wave direction being different is better */
  protected direction: number[][] = [
    [0.5, 0.7],
    [-0.6, -0.2],
    [0.7, -0.4],
    [-0.2, 0.4],
  ];

  protected initialize(): boolean {
    if (!this.glContext) {
      return false;
    }

    super.initialize();

    this.drawType = 1;
    this.vertexShaderSource = ShaderUtility.VERTEX_SHADER_SYNTHESIS_SOURCE;
    this.fragmentShaderSource = ShaderUtility.FRAGMENT_SHADER_UNRIT_SOURCE;
    ShaderUtility.generateSubdividedMesh2d(8, 8, this.vertexArray, this.colorArray, this.indexArray);

    return true;
  }

  protected initializeUniformLocation(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }

    super.initializeUniformLocation();

    this.uniformLocationTime = this.glContext.getUniformLocation(this.program, ShaderUtility.UNIFORM_TIME_NAME);
    this.uniformLocationWaveNumber = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_NUMBER_NAME
    );
    this.uniformLocationWaveAmplitude = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_AMPLITUDE_NAME
    );
    this.uniformLocationWaveLength = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_LENGTH_NAME
    );
    this.unifromLocationWaveCycle = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_CYCLE_NAME
    );
    this.uniformLocationWaveDirection = this.glContext.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_DIRECTION_NAME
    );

    return true;
  }

  protected registerUniform(): boolean {
    if (!this.glContext || !this.program) {
      return false;
    }

    super.registerUniform();

    if (this.uniformLocationTime) {
      this.glContext.uniform1f(this.uniformLocationTime, this.time);
    }
    if (this.uniformLocationWaveNumber) {
      this.glContext.uniform1i(this.uniformLocationWaveNumber, this.waveNumber);
    }
    if (this.uniformLocationWaveAmplitude) {
      this.glContext.uniform1fv(this.uniformLocationWaveAmplitude, this.amplitude);
    }
    if (this.uniformLocationWaveLength) {
      this.glContext.uniform1fv(this.uniformLocationWaveLength, this.length);
    }
    if (this.unifromLocationWaveCycle) {
      this.glContext.uniform1fv(this.unifromLocationWaveCycle, this.cycle);
    }
    if (this.uniformLocationWaveDirection) {
      this.glContext.uniform2fv(this.uniformLocationWaveDirection, this.direction.flat());
    }

    return true;
  }

  /** Calc wave contexts - amplitude, speed, direction, frequency
   * @returns {boolean} calced successfully or not
   */
  protected calculateWaveContext(): boolean {
    this.amplitude.length = this.waveNumber;
    this.length.length = this.waveNumber;
    this.cycle.length = this.waveNumber;
    this.direction.length = this.waveNumber;
    return true;
  }

  public update(deltaTime: number) {
    if (!this.glContext || deltaTime <= 0.0) {
      return;
    }

    this.calculateWaveContext();

    super.update(deltaTime);
  }
}
