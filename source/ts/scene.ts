import * as glm from 'gl-matrix';
import { Object3D } from './object3D';

export class Scene {
	static viewPosition: glm.vec3 = [-0.01, -0.57, 0.15];
	static viewLookAt: glm.vec3 = [0.0, 0.0, 0.0];
	static viewUp: glm.vec3 = [0.0, 0.0, 1.0];
	static viewMatrix: glm.mat4 = glm.mat4.create();

	static projectionFovy: number = glm.glMatrix.toRadian(60.0);
	static projectionAspect: number = 1.0;
	static projectionNear: number = 0;
	static projectionFar: number = 1000;
	static projectionMatrix: glm.mat4 = glm.mat4.create();

	static time: number = 0;
	static deltaTime: number = 0;

	static objects: Object3D[] = [];

	public static initialize(): void {
		Scene.update(0.0);

		const water: Object3D = new Object3D();
		Scene.objects.push(water);
	}

	public static getObjects(): Object3D[] {
		return this.objects;
	}

	public static update(deltaTime: number): void {
		Scene.viewMatrix = glm.mat4.lookAt(glm.mat4.create(), Scene.viewPosition, Scene.viewLookAt, Scene.viewUp);
		Scene.projectionMatrix = glm.mat4.perspective(
			glm.mat4.create(),
			Scene.projectionFovy,
			Scene.projectionAspect,
			Scene.projectionNear,
			Scene.projectionFar
		);

		Scene.time += deltaTime;
		Scene.deltaTime = deltaTime;

		for (const object of Scene.objects) {
			object.update();
		}
	}
}
