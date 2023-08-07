import * as ShaderUtility from '@ts/shaderUtility';
import { Shader } from './shader';
import FRAGMENT_SHADER_UNRIT from '@shader/unlit.frag';
import VERTEX_SHADER_SYNTHESIS from '@shader/synthesis_wave.vert';

export class ShaderSyntesis extends Shader {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initialize();
  }

  protected override vertexShaderSource: string = VERTEX_SHADER_SYNTHESIS;
  protected override fragmentShaderSource: string = FRAGMENT_SHADER_UNRIT;
  protected override drawType: number = 1;

  protected uniformLocationTime: WebGLUniformLocation | null = null;
  protected uniformLocationWaveNumber: WebGLUniformLocation | null = null;
  protected uniformLocationWaveAmplitude: WebGLUniformLocation | null = null;
  protected uniformLocationWaveLength: WebGLUniformLocation | null = null;
  protected unifromLocationWaveCycle: WebGLUniformLocation | null = null;
  protected uniformLocationWaveDirection: WebGLUniformLocation | null = null;

  protected waveNumber: number = 4;
  protected amplitude: number[] = [0.3, 0.2, 0.3, 0.05];
  protected length: number[] = [4.0, 4.2, 3.5, 3.1];
  protected cycle: number[] = [3200, 2700, 3500, 1000];
  protected direction: number[][] = [
    [0.5, 0.7],
    [-0.6, -0.2],
    [0.7, -0.4],
    [-0.2, 0.4],
  ];

  // derived from Shader.ts
  override initialize(): boolean {
    if (!this.gl) {
      return false;
    }
    super.initialize();
    return true;
  }

  // derived from Shader.ts
  override initializeUniform(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }

    super.initializeUniform();

    this.uniformLocationTime = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_TIME_NAME);
    this.uniformLocationWaveNumber = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_WAVE_NUMBER_NAME);
    this.uniformLocationWaveAmplitude = this.gl.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_AMPLITUDE_NAME
    );
    this.uniformLocationWaveLength = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_WAVE_LENGTH_NAME);
    this.unifromLocationWaveCycle = this.gl.getUniformLocation(this.program, ShaderUtility.UNIFORM_WAVE_CYCLE_NAME);
    this.uniformLocationWaveDirection = this.gl.getUniformLocation(
      this.program,
      ShaderUtility.UNIFORM_WAVE_DIRECTION_NAME
    );

    return true;
  }

  // derived from Shader.ts
  override registerUniform(): boolean {
    if (!this.gl || !this.program) {
      return false;
    }

    super.registerUniform();

    if (this.uniformLocationTime) {
      this.gl.uniform1f(this.uniformLocationTime, this.time);
    }

    if (this.uniformLocationWaveNumber) {
      this.gl.uniform1i(this.uniformLocationWaveNumber, this.waveNumber);
    }

    if (this.uniformLocationWaveAmplitude) {
      this.gl.uniform1fv(this.uniformLocationWaveAmplitude, this.amplitude);
    }

    if (this.uniformLocationWaveLength) {
      this.gl.uniform1fv(this.uniformLocationWaveLength, this.length);
    }

    if (this.unifromLocationWaveCycle) {
      this.gl.uniform1fv(this.unifromLocationWaveCycle, this.cycle);
    }

    if (this.uniformLocationWaveDirection) {
      this.gl.uniform2fv(this.uniformLocationWaveDirection, this.direction.flat());
    }

    return true;
  }

  protected calculateWaveContext(): boolean {
    this.amplitude.length = this.waveNumber;
    this.length.length = this.waveNumber;
    this.cycle.length = this.waveNumber;
    this.direction.length = this.waveNumber;
    return true;
  }

  // derived from Shader.ts
  override preUpdate(): void {
    super.preUpdate();
    ShaderUtility.generateSubdividedMesh2d(8, 8, this.vertexArray, this.colorArray, this.indexArray);
  }

  // derived from Shader.ts
  override update(deltaTime: number) {
    if (!this.gl || deltaTime <= 0.0) {
      return;
    }
    this.calculateWaveContext();
    super.update(deltaTime);
  }
}
