///
///	canvas element class for webgl
///
export class Canvas {

	constructor(canvasId: string) {
		this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		this.initialize();
	};

	protected canvas: HTMLCanvasElement | null = null;
	protected gl: WebGLRenderingContext | null = null;
	protected width: number = 500;
	protected height: number = 500;

	public getCanvas(): HTMLCanvasElement | null { return this.canvas; }
	public getWidth(): number { return this.width; }
	public setWidth(width: number) { this.width = width; }
	public getHeight(): number { return this.height; }
	public setHeight(height: number) { this.height = height; }

	public initialize() {
		if (this.canvas === null) { return; }
		this.gl = this.canvas.getContext('webgl');
		if (this.gl !== null) {
			this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		}
	}

	public isValid(): boolean {
		let valid: boolean = true;
		valid &&= this.canvas !== null;
		valid &&= this.gl !== null;
		return valid;
	}

	public update() {
		if (this.canvas === null) { return; }
		if (this.gl === null) { return; }

		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}
};