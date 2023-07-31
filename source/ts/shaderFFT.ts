import * as ShaderUtility from '@ts/shaderUtility';
import { Shader } from './shader';

export class ShaderOverlap extends Shader {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initialize();
  }

  protected initialize(): boolean {
    if (!this.glContext) {
      return false;
    }

    super.initialize();

    this.drawType = 1;
    this.vertexShaderSource = ShaderUtility.VERTEX_SHADER_FFT_SOURCE;
    this.fragmentShaderSource = ShaderUtility.FRAGMENT_SHADER_UNRIT_SOURCE;
    ShaderUtility.generateSubdividedMesh2d(8, 8, this.vertexArray, this.colorArray, this.indexArray);

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

    super.registerUniform()
    return true;
  }


  public update(deltaTime: number) {
    if (!this.glContext || deltaTime <= 0.0) {
      return;
    }

    super.update(deltaTime);
  }
}
