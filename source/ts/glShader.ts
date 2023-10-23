import * as ShaderAPI from '@ts/shaderAPI';
import * as glm from 'gl-matrix';
import VERTEX_SHADER_UNRIT from '@shader/unlit.vert';
import FRAGMENT_SHADER_UNRIT from '@shader/unlit.frag';

export class GLShader {
	constructor(canvas: HTMLCanvasElement) {
		this.construct(canvas);
	}

	protected gl: WebGL2RenderingContext | null = null;
	protected vertexShaderSource: string = VERTEX_SHADER_UNRIT;
	protected fragmentShaderSource: string = FRAGMENT_SHADER_UNRIT;
	protected program: WebGLProgram | null = null;
	protected drawType: number = 0;

	protected vertexBuffer: WebGLBuffer | null = null;
	protected colorBuffer: WebGLBuffer | null = null;
	protected indexBuffer: WebGLBuffer | null = null;

	protected vertexArray: number[][] = ShaderAPI.MESH_2D_VERTICE;
	protected colorArray: number[][] = ShaderAPI.MESH_2D_COLOR;
	protected indexArray: number[][] = ShaderAPI.MESH_2D_INDEX;

	protected uniformLocationModelMatrix: WebGLUniformLocation | null = null;
	protected uniformLocationViewMatrix: WebGLUniformLocation | null = null;
	protected uniformLocationProjectionMatrix: WebGLUniformLocation | null = null;

	protected position: glm.vec3 = [0.0, 0.0, 0.0];
	protected rotation: glm.vec3 = [0.0, 0.0, 0.0];
	protected scale: glm.vec3 = [1.0, 1.0, 1.0];
	protected modelMatrix: glm.mat4 = glm.mat4.create();

	public viewPosition: glm.vec3 = [-0.5, -3.0, 5.0];
	public viewLookAt: glm.vec3 = [0.0, 0.0, 0.0];
	public viewUp: glm.vec3 = [0.0, 0.0, 1.0];
	protected viewMatrix: glm.mat4 = glm.mat4.create();

	protected projectionFovy: number = glm.glMatrix.toRadian(60.0);
	protected projectionAspect: number = 1.0;
	protected projectionNear: number = 0;
	protected projectionFar: number = 10000;
	protected projectionMatrix: glm.mat4 = glm.mat4.create();

	protected uniformLocationTime: WebGLUniformLocation | null = null;
	protected time: number = 0.0;

	private UNIFORM_MODEL_MATRIX_NAME: string = 'u_ModelMatrix';
	private UNIFORM_VIEW_MATRIX_NAME: string = 'u_ViewMatrix';
	private UNIFORM_PROJECTION_MATRIX_NAME: string = 'u_ProjectionMatrix';
	private UNIFORM_TIME_NAME: string = 'u_Time';

	protected construct(canvas: HTMLCanvasElement): boolean {
		this.gl = canvas.getContext('webgl2');
		if (!this.gl) {
			return false;
		}
		return this.initializeShaderProgram();
	}

	protected initializeShaderProgram(): boolean {
		if (!this.gl) {
			return false;
		}
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		const vertexShader: WebGLShader | null = ShaderAPI.createWebGLVertexShader(this.gl, this.vertexShaderSource);
		const fragmentShader: WebGLShader | null = ShaderAPI.createWebGLFragmentShader(
			this.gl,
			this.fragmentShaderSource
		);

		if (vertexShader && fragmentShader) {
			this.program = ShaderAPI.createWebGLProgram(this.gl, vertexShader, fragmentShader);
			this.gl.useProgram(this.program);
		}
		return true;
	}

	protected initializeAttribute(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}

		const attribLocationVertex: number = 0;
		const attribLocationColor: number = 1;

		this.vertexBuffer = this.gl.createBuffer();
		this.colorBuffer = this.gl.createBuffer();
		this.indexBuffer = this.gl.createBuffer();

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.enableVertexAttribArray(attribLocationVertex);
		this.gl.vertexAttribPointer(attribLocationVertex, 3, this.gl.FLOAT, false, 0, 0);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
		this.gl.enableVertexAttribArray(attribLocationColor);
		this.gl.vertexAttribPointer(attribLocationColor, 4, this.gl.FLOAT, false, 0, 0);

		return true;
	}

	protected registerAttribute(): boolean {
		if (!this.gl) {
			return false;
		}

		if (this.vertexBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertexArray.flat()), this.gl.STATIC_DRAW);
		}

		if (this.colorBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colorArray.flat()), this.gl.STATIC_DRAW);
		}

		if (this.indexBuffer) {
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			this.gl.bufferData(
				this.gl.ELEMENT_ARRAY_BUFFER,
				new Int16Array(this.indexArray.flat()),
				this.gl.STATIC_DRAW
			);
		}

		return true;
	}

	protected initializeUniform(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}

		this.uniformLocationModelMatrix = this.gl.getUniformLocation(this.program, this.UNIFORM_MODEL_MATRIX_NAME);
		this.uniformLocationViewMatrix = this.gl.getUniformLocation(this.program, this.UNIFORM_VIEW_MATRIX_NAME);
		this.uniformLocationProjectionMatrix = this.gl.getUniformLocation(
			this.program,
			this.UNIFORM_PROJECTION_MATRIX_NAME
		);
		this.uniformLocationTime = this.gl.getUniformLocation(this.program, this.UNIFORM_TIME_NAME);
		return true;
	}

	protected registerUniform(): boolean {
		if (!this.gl || !this.program) {
			return false;
		}

		if (this.uniformLocationModelMatrix) {
			this.gl.uniformMatrix4fv(this.uniformLocationModelMatrix, false, this.modelMatrix);
		}

		if (this.uniformLocationViewMatrix) {
			this.gl.uniformMatrix4fv(this.uniformLocationViewMatrix, false, this.viewMatrix);
		}

		if (this.uniformLocationProjectionMatrix) {
			this.gl.uniformMatrix4fv(this.uniformLocationProjectionMatrix, false, this.projectionMatrix);
		}

		if (this.uniformLocationTime) {
			this.gl.uniform1f(this.uniformLocationTime, this.time);
		}

		return true;
	}

	protected draw(): boolean {
		if (!this.gl) {
			return false;
		}

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		const INDEX_LENGTH: number = this.indexArray.flat().length;
		if (this.drawType == 0) {
			this.gl.drawElements(this.gl.TRIANGLES, INDEX_LENGTH, this.gl.UNSIGNED_SHORT, 0);
		} else {
			this.gl.drawElements(this.gl.LINE_STRIP, INDEX_LENGTH, this.gl.UNSIGNED_SHORT, 0);
		}
		this.gl.flush();
		return true;
	}

	protected calculateMvpMatrices(): boolean {
		const translateMatrix: glm.mat4 = glm.mat4.translate(glm.mat4.create(), glm.mat4.create(), [
			this.position[0],
			this.position[1],
			this.position[2],
		]);

		const rotateMatrixX: glm.mat4 = glm.mat4.rotate(
			glm.mat4.create(),
			glm.mat4.create(),
			this.rotation[0],
			[1.0, 0.0, 0.0]
		);
		const rotateMatrixY: glm.mat4 = glm.mat4.rotate(
			glm.mat4.create(),
			glm.mat4.create(),
			this.rotation[1],
			[0.0, 1.0, 0.0]
		);
		const rotateMatrixZ: glm.mat4 = glm.mat4.rotate(
			glm.mat4.create(),
			glm.mat4.create(),
			this.rotation[0],
			[0.0, 0.0, 1.0]
		);
		const rotateMatrix: glm.mat4 = glm.mat4.multiply(
			glm.mat4.create(),
			glm.mat4.multiply(glm.mat4.create(), rotateMatrixZ, rotateMatrixY),
			rotateMatrixX
		);
		const scaleMatrix: glm.mat4 = glm.mat4.scale(glm.mat4.create(), glm.mat4.create(), [
			this.scale[0],
			this.scale[1],
			this.scale[2],
		]);
		this.modelMatrix = glm.mat4.multiply(
			glm.mat4.create(),
			glm.mat4.multiply(glm.mat4.create(), translateMatrix, rotateMatrix),
			scaleMatrix
		);

		this.viewMatrix = glm.mat4.lookAt(glm.mat4.create(), this.viewPosition, this.viewLookAt, this.viewUp);

		this.projectionMatrix = glm.mat4.perspective(
			glm.mat4.create(),
			this.projectionFovy,
			this.projectionAspect,
			this.projectionNear,
			this.projectionFar
		);

		return true;
	}

	public preUpdate(): void {
		this.initializeAttribute();
		this.initializeUniform();
		this.registerAttribute();
		this.registerUniform();
		this.draw();
	}

	public update(deltaTime: number) {
		if (!this.gl || deltaTime <= 0.0) {
			return;
		}
		this.time += deltaTime;

		this.calculateMvpMatrices();

		this.registerAttribute();
		this.registerUniform();
		this.draw();
	}
}
