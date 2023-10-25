import '@css/style.css';
import { Canvas } from '@ts/canvas';
import { Scene } from '@ts/scene';

const canvas: Canvas = new Canvas('canvas');

// initialize
if (canvas) {
	Scene.initialize();
	await canvas.initializeRenderingContexts();
	for (const object of Scene.getObjects()) {
		object.initializeMaterial(canvas.webGPU?.device as GPUDevice, canvas.webGPU?.canvasFormat as GPUTextureFormat);
	}
}

// update
function animationFramePromise(): Promise<number> {
	return new Promise<number>((resolve) => {
		globalThis.requestAnimationFrame(resolve);
	});
}

const FPS_30 = 33.33;
let prevTime = Date.now();
while (canvas) {
	await animationFramePromise();
	const deltaTime = Date.now() - prevTime;
	if (deltaTime > FPS_30) {
		prevTime = Date.now();

		Scene.update(deltaTime);
		canvas.update();
	}
}
