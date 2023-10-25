import * as ShaderAPI from '@ts/shaderAPI';
import { Material } from '@ts/material';

export class Object3D {
	costructor() {
		this.construct();
	}

	protected position: number[] = [0.0, 0.0, 0.0];
	protected rotation: number[] = [0.0, 0.0, 0.0];
	protected scale: number[] = [0.0, 0.0, 0.0];

	protected vertices: Float32Array = ShaderAPI.MESH_2D_VERTICE_ARRAY_TYPE;
	protected indices: Int32Array = ShaderAPI.MESH_2D_INDEX_ARRAY_TYPE;

	public material: Material = new Material();

	protected construct() {}

	public initializeMaterial(device: GPUDevice, canvasFormat: GPUTextureFormat) {
		this.material.initialize(device, canvasFormat, this.vertices);
	}

	public update(): void {}

	public setPosition(inPos: number[]) {
		this.position = inPos;
	}

	public setRotation(inRot: number[]) {
		this.rotation = inRot;
	}

	public setScale(inScl: number[]) {
		this.scale = inScl;
	}
}
