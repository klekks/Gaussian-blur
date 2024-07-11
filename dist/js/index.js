"use strict";
var kernelSize;
var sigma;
var direction;
/**
 *
 * @param GL
 * @param vertexShader
 * @param fragmentShader
 * @returns WebGLProgram
 *
 * Function for compiling WebGL shaders into WebGL program
 */
function makeProgramFromShaders(GL, vertexShader, fragmentShader) {
    var shaders = getShaders(GL, vertexShader, fragmentShader);
    var PROGRAM = GL.createProgram();
    GL.attachShader(PROGRAM, shaders.vertex);
    GL.attachShader(PROGRAM, shaders.fragment);
    GL.linkProgram(PROGRAM);
    return PROGRAM;
}
/**
 *
 * @param GL
 * @param vertexShader
 * @param fragmentShader
 * @returns
 * Function for compiling vertex shader and fragment shader
 */
function getShaders(GL, vertexShader, fragmentShader) {
    return {
        vertex: compileShader(GL, GL.VERTEX_SHADER, document.getElementById(vertexShader).textContent),
        fragment: compileShader(GL, GL.FRAGMENT_SHADER, document.getElementById(fragmentShader).textContent)
    };
}
function compileShader(GL, type, source) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    console.log(GL.getShaderInfoLog(shader));
    return shader;
}
function MyBlur(src) {
    var image = new Image();
    image.onload = function () {
        if (image.width * image.height > 8000 * 4100)
            alert("Images > 32800000 pixels in size cannot be displayed correctly after processinng.");
        direction = 1; // horizontal mode
        var canvas = render(image);
        image.onload = function () {
            direction = 0; // vertical mode
            var canvas2 = render(image);
            document.getElementById("imgAfter").src = canvas2.toDataURL(); // set result into img tag
        };
        image.src = canvas.toDataURL(); // result of horizontal stage in base64
    };
    image.src = src;
}
function render(image) {
    // Get A WebGL context
    var canvas = document.createElement("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return canvas;
    }
    gl.canvas.width = image.width;
    gl.canvas.height = image.height;
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
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);
    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);
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
function setRectangle(gl, x, y, width, height) {
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
window.onload = function () {
    var fileInput = document.getElementById("fileInput");
    var urlInput = document.getElementById("URLInput");
    var beforeImg = document.getElementById("imgBefore");
    var afterImg = document.getElementById("imgAfter");
    var blurButton = document.getElementById("blurButton");
    var kernelSizeInput = document.getElementById("kernelSizeInput");
    var sigmaInput = document.getElementById("sigmaInput");
    window.onresize = function () {
        if (window.innerWidth < 1100)
            alert("The window width of less than 1100 pixels is a bad idea.");
    };
    beforeImg.onload = function () {
        blurButton.removeAttribute("disabled"); // we can blur image by button now
    };
    fileInput.onchange = function () {
        beforeImg.src = 'media/loading.gif'; // loader img
        var reader = new FileReader();
        reader.onload = function () {
            beforeImg.src = reader.result; // load image in base64
        };
        reader.readAsDataURL(fileInput.files[0]);
    };
    blurButton.onclick = function () {
        afterImg.src = 'media/loading.gif'; // loader img
        MyBlur(beforeImg.src);
    };
    kernelSize = Number(kernelSizeInput.value);
    sigma = Number(sigmaInput.value);
    kernelSizeInput.oninput = function () {
        kernelSize = Number(kernelSizeInput.value);
        document.getElementById("kernelLabel").innerText = "Kernel size: " + String(kernelSize); // updating label in UI 
    };
    sigmaInput.oninput = function () {
        sigma = Number(sigmaInput.value);
        document.getElementById("sigmaLabel").innerText = "Radius: " + String(sigma); // updating label in UI
    };
    urlInput.onchange = function () {
        beforeImg.src = 'media/loading.gif'; // loader img
        function toDataURL(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var reader = new FileReader();
                reader.onloadend = function () {
                    callback(reader.result);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        }
        // using cors-anywhere herokuapp as a proxy to avoid CORS policy
        toDataURL('https://cors-anywhere.herokuapp.com/' + urlInput.value, function (dataUrl) {
            beforeImg.src = dataUrl;
        });
    };
};
