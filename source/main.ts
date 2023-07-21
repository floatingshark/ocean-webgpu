import './css/style.css';
import { Canvas } from './ts/canvas';

(() => {
	let canvas: Canvas = new Canvas('canvas');
	if (canvas.isValid()) {
		canvas.update();
	}
})();