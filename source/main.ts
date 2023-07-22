import '@css/style.css';
import { Canvas } from '@ts/canvas';

const canvas: Canvas = new Canvas('canvas');
console.log(canvas);
if (canvas && canvas.isValid()) {
  await canvas.beginAnimation();
}
