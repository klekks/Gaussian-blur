//export default function makeProgramFromShaders(GL: WebGLRenderingContext, vertexShader: string, fragmentShader: string) : WebGLProgram
//{

//    const shaders = getShaders(GL, vertexShader, fragmentShader);

//    const PROGRAM = GL.createProgram()!;

//    GL.attachShader(PROGRAM, shaders.vertex);
//    GL.attachShader(PROGRAM, shaders.fragment);
//    GL.linkProgram(PROGRAM);

//    const vertexPositionAttribute = GL.getAttribLocation(PROGRAM, 'a_position');
//    //console.log(PROGRAM, vertexPositionAttribute);
//    //GL.enableVertexAttribArray(vertexPositionAttribute);
//    //GL.vertexAttribPointer(vertexPositionAttribute, 2, GL.FLOAT, false, 0, 0);

//    return PROGRAM;
//}

//function getShaders(GL: WebGLRenderingContext, vertexShader: string, fragmentShader: string): { vertex: WebGLShader, fragment: WebGLShader } {
//    return {
//        vertex: compileShader(
//            GL,
//            GL.VERTEX_SHADER,
//            document.getElementById(vertexShader)!.textContent!
//        ),
//        fragment: compileShader(
//            GL,
//            GL.FRAGMENT_SHADER,
//            document.getElementById(fragmentShader)!.textContent!
//        )
//    };
//}

//function compileShader(GL: WebGLRenderingContext, type: number, source: string): WebGLShader {
//    const shader = GL.createShader(type)!;

//    GL.shaderSource(shader, source);
//    GL.compileShader(shader);

//    return shader;
//}