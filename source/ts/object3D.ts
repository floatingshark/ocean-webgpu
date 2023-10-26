import * as ShaderAPI from '@ts/shaderAPI';
import { Material, Uniform } from '@ts/material';
import { Scene } from './scene';

export class Object3D {
	costructor() {
		this.construct();
	}

	protected position: number[] = [0.0, 0.0, 0.0];
	protected rotation: number[] = [0.0, 0.0, 0.0];
	protected scale: number[] = [0.0, 0.0, 0.0];

	protected vertexArray: Float32Array = ShaderAPI.MESH_2D_VERTICE_ARRAY_TYPE;
	protected indexArray: Int32Array = ShaderAPI.MESH_2D_INDEX_ARRAY_TYPE;

	public material: Material = new Material();
	private device: GPUDevice | null = null;
	private canvasFormat: GPUTextureFormat | null = null;

	protected construct() {}

	public initializeMaterial(device: GPUDevice, canvasFormat: GPUTextureFormat) {
		this.device = device;
		this.canvasFormat = canvasFormat;
		this.material.initialize(this.device, this.canvasFormat, this.vertexArray, this.indexArray);
	}

	public update(): void {
		if (this.device) {
			const uniform: Uniform = new Uniform();
			uniform.view = Scene.viewMatrix;
			uniform.projection = Scene.projectionMatrix;
			this.material.update(this.device, uniform);
		}
	}
}
