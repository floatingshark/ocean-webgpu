import '@css/style.css';
import { Canvas } from '@ts/canvas';

const canvas: Canvas = new Canvas('canvas');
if (canvas) {
	await canvas.initializeContext();
	await canvas.beginUpdate();
}
