import { Scene } from '@ts/scene';

export class GUI {
	constructor() {
		this.construct();
	}

	private viewXElement: HTMLElement | null = null;
	private viewYElement: HTMLElement | null = null;
	private viewZElement: HTMLElement | null = null;

	construct() {
		this.viewXElement = document.getElementById('viewX');
		this.viewYElement = document.getElementById('viewY');
		this.viewZElement = document.getElementById('viewZ');
	}

	public update() {
		if (!this.viewXElement || !this.viewYElement || !this.viewZElement) {
			throw new Error('No view element');
		}
		this.viewXElement.textContent = Scene.viewPosition[0].toFixed(2).toString();
		this.viewYElement.textContent = Scene.viewPosition[1].toFixed(2).toString();
		this.viewZElement.textContent = Scene.viewPosition[2].toFixed(2).toString();
	}
}
