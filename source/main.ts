import '@css/style.css';
import { Canvas } from '@ts/canvas';

const canvas: Canvas = new Canvas('canvas');
if (canvas && canvas.isValid()) {
  await canvas.beginAnimation();
}
