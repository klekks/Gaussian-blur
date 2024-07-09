//import blur from './blur'
let kernelSize: number;
let sigma: number;
let direction: number;

function makeProgramFromShaders(GL: WebGLRenderingContext, vertexShader: string, fragmentShader: string): WebGLProgram {

    const shaders = getShaders(GL, vertexShader, fragmentShader);

    const PROGRAM = GL.createProgram()!;

    GL.attachShader(PROGRAM, shaders.vertex);
    GL.attachShader(PROGRAM, shaders.fragment);
    GL.linkProgram(PROGRAM);

    return PROGRAM;
}

function getShaders(GL: WebGLRenderingContext, vertexShader: string, fragmentShader: string): { vertex: WebGLShader, fragment: WebGLShader } {
    return {
        vertex: compileShader(
            GL,
            GL.VERTEX_SHADER,
            document.getElementById(vertexShader)!.textContent!
        ),
        fragment: compileShader(
            GL,
            GL.FRAGMENT_SHADER,
            document.getElementById(fragmentShader)!.textContent!
        )
    };
}

function compileShader(GL: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = GL.createShader(type)!;

    GL.shaderSource(shader, source);
    GL.compileShader(shader);

    console.log(GL.getShaderInfoLog(shader));

    return shader;
}

function MyBlur(src: string) {
    var image = new Image();
    
    image.onload = () => {
        direction = 1;
        let canvas = render(image);
        direction = 0;

        image.onload = () => {
            let canvas2 = render(image);
            (document.getElementById("imgAfter") as HTMLImageElement).src = canvas2.toDataURL();
        }

        image.src = canvas.toDataURL();

        
    }

    image.src = src;
}

function render(image: HTMLImageElement): HTMLCanvasElement {
    // Get A WebGL context
    var canvas = document.createElement("canvas")! as HTMLCanvasElement;
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return canvas;
    }

    gl.canvas.width = image.width;
    gl.canvas.height = image.height;

    if (image.width * image.height > 8000 * 4100)
        alert("Images > 32800000 pixels in size cannot be displayed correctly.");

    // setup GLSL program
    var program = makeProgramFromShaders(gl, "vertex-shader-2d", "fragment-shader-2d");

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, image.width, image.height);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var kernelSizeLocation = gl.getUniformLocation(program, "u_kernelSize");
    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    var sigmaLocation = gl.getUniformLocation(program, "u_sigma");
    var directionLocation = gl.getUniformLocation(program, "u_horizontal");


    //webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(kernelSizeLocation, kernelSize);
    gl.uniform1i(directionLocation, direction);
    gl.uniform1f(sigmaLocation, sigma);
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
    return canvas;
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}


window.onload = () => {
    const fileInput = document.getElementById("fileInput")! as HTMLInputElement;
    const urlInput = document.getElementById("URLInput")! as HTMLInputElement;
    const beforeImg = document.getElementById("imgBefore")! as HTMLImageElement;
    const afterImg = document.getElementById("imgAfter")! as HTMLImageElement;
    const blurButton = document.getElementById("blurButton")! as HTMLButtonElement;

    const kernelSizeInput = document.getElementById("kernelSizeInput")! as HTMLInputElement;
    const sigmaInput = document.getElementById("sigmaInput")! as HTMLInputElement;

    window.onresize = () =>
    {
        if (window.innerWidth < 1100)
            alert("The window width of less than 1100 pixels is a bad idea.");
    }

    beforeImg.onload = () => {
        console.log("123")
        blurButton.removeAttribute("disabled");
    };


    fileInput.onchange = () => {
        beforeImg.src = 'media/loading.gif';

        const reader = new FileReader();
        reader.onload = () => {
            beforeImg.src = reader.result as string;
        };
        reader.readAsDataURL(fileInput.files![0]);
    };

    blurButton.onclick = () => {
        console.log("click");
        afterImg.src = 'media/loading.gif';
        MyBlur(beforeImg.src);
    };

    kernelSize = Number(kernelSizeInput.value);
    sigma = Number(sigmaInput.value);

    kernelSizeInput.onmousemove = () => {
        kernelSize = Number(kernelSizeInput.value);
        document.getElementById("kernelLabel")!.innerText = "Kernel size: " + String(kernelSize);
    };

    sigmaInput.onmousemove = () => {
        sigma = Number(sigmaInput.value);
        document.getElementById("sigmaLabel")!.innerText = "Sigma: " + String(sigma);

    };

    urlInput.onchange = () => {
        beforeImg.src = 'media/loading.gif';

        function toDataURL(url: string, callback: CallableFunction) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var reader = new FileReader();
                reader.onloadend = function () {
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };

            xhr.open('GET', url);
            xhr.responseType = 'blob';
            
            xhr.send();
            
        }

        toDataURL('https://cors-anywhere.herokuapp.com/' + urlInput.value, function (dataUrl: string) {
            beforeImg.src = dataUrl
        })
    };

};

