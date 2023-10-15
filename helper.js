'use strict';

async function getFileText(url) {
    let response = await fetch(url)
    let text = await response.text()
    return text
}

async function makeSkybox(gl, worldViewMatrix, projectionMatrix, textureTarget) {
    let fragmentShaderText = await getFileText('shaders/skyboxFragmentShader')
    let vertexShaderText = await getFileText('shaders/skyboxVertexShader')
  
    const vertexShader = initVertexShader(gl, vertexShaderText)
    const fragmentShader = initFragShader(gl, fragmentShaderText)
     
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT)

    const vertices = [
        // pos(x,y,z)
        // Top
		-1.0, 1.0, -1.0, 
		-1.0, 1.0, 1.0,  
		1.0, 1.0, 1.0,   
		1.0, 1.0, -1.0,  

		// Left
		-1.0, 1.0, 1.0,  
		-1.0, -1.0, 1.0, 
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0, 

		// Right
		1.0, 1.0, 1.0,   
		1.0, -1.0, 1.0,  
		1.0, -1.0, -1.0, 
		1.0, 1.0, -1.0,  

		// Front
		1.0, 1.0, 1.0,   
		1.0, -1.0, 1.0,  
		-1.0, -1.0, 1.0, 
		-1.0, 1.0, 1.0,  

		// Back
		1.0, 1.0, -1.0,  
		1.0, -1.0, -1.0, 
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0, 

		// Bottom
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0, 
		1.0, -1.0, 1.0,  
		1.0, -1.0, -1.0, 
    ]

    var indices = [
        // Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

        // Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23,
    ]

    const vbo = vboSetup(gl, vertices)
    const ibo = iboSetup(gl, indices)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

    var positionAttribLocation = gl.getAttribLocation(program, "vertPos")
    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        3 * Float32Array.BYTES_PER_ELEMENT,
        0 * Float32Array.BYTES_PER_ELEMENT
        )
    gl.enableVertexAttribArray(positionAttribLocation)

    // var modelMatrix = new Float32Array(16)
    // var viewMatrix = new Float32Array(16)
    // var projectionMatrix = new Float32Array(16)
    // var modelViewMatrix = new Float32Array(16)

    // identity(worldMatrix)
    // lookAt(viewMatrix, [10,10,40], [0,10,0], [0,1,0])
    // perspective(projectionMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0)
    // multiply(modelViewMatrix, viewMatrix, modelMatrix)

    const worldViewLocation = gl.getUniformLocation(program, "modelViewMatrix")
    const projLocation = gl.getUniformLocation(program, "projMatrix")
    gl.uniformMatrix4fv(worldViewLocation, gl.FALSE, worldViewMatrix)
    gl.uniformMatrix4fv(projLocation, gl.FALSE, projectionMatrix)

    const textureUniformLocation = gl.getUniformLocation(program, 'texture')
    gl.uniform1i(textureUniformLocation, textureTarget)
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
    var leftTexture = await loadTextureWithTarget(gl, 'skybox/left.png', gl.TEXTURE_CUBE_MAP_POSITIVE_X)
    var rightTexture = await loadTextureWithTarget(gl, 'skybox/right.png', gl.TEXTURE_CUBE_MAP_NEGATIVE_X)
    var topTexture = await loadTextureWithTarget(gl, 'skybox/down.png', gl.TEXTURE_CUBE_MAP_POSITIVE_Y)
    var botTexture = await loadTextureWithTarget(gl, 'skybox/up.png', gl.TEXTURE_CUBE_MAP_NEGATIVE_Y)
    var frontTexture = await loadTextureWithTarget(gl, "skybox/front.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z)
    var backTexture = await loadTextureWithTarget(gl, 'skybox/back.png', gl.TEXTURE_CUBE_MAP_NEGATIVE_Z)

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

    return [program, vbo, indices.length]
}

function objectSetup(gl, vbo, program) {
    // const vbo = vboSetup(gl, vertices)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)

    var positionAttribLocation = gl.getAttribLocation(program, "vertPos")
    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        8 * Float32Array.BYTES_PER_ELEMENT,
        0 * Float32Array.BYTES_PER_ELEMENT
    )
    gl.enableVertexAttribArray(positionAttribLocation)

    var normalAttribLocation = gl.getAttribLocation(program, "v_Normal")
    gl.vertexAttribPointer(
        normalAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        8 * Float32Array.BYTES_PER_ELEMENT,
        5 * Float32Array.BYTES_PER_ELEMENT
    )
    gl.enableVertexAttribArray(normalAttribLocation)

    var texCoordAttribLocation = gl.getAttribLocation(program, "vertTexCoord")
    gl.vertexAttribPointer(
        texCoordAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        8 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    )
    gl.enableVertexAttribArray(texCoordAttribLocation)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return vbo
}

function setTransformUniforms(gl, program, worldMatrix, viewMatrix, projectionMatrix, normalMatrix) {
    var worldMatUniformLocation = gl.getUniformLocation(program, "worldMat")
    var viewMatUniformLocation = gl.getUniformLocation(program, "viewMat")
    var projectionMatUniformLocation = gl.getUniformLocation(program, "projectionMat")
    var normalMatUniformLocation = gl.getUniformLocation(program, "normalMat")

    gl.uniformMatrix4fv(worldMatUniformLocation, gl.FALSE, worldMatrix)
    gl.uniformMatrix4fv(viewMatUniformLocation, gl.FALSE, viewMatrix)
    gl.uniformMatrix4fv(projectionMatUniformLocation, gl.FALSE, projectionMatrix)
    gl.uniformMatrix3fv(normalMatUniformLocation, gl.FALSE, normalMatrix)
}

function setLightUniforms(gl, program, lightPosition, lightAmbient, lightDiffuse, lightSpecular, lightHalfVector) {
    var lightPositonUniformLocation = gl.getUniformLocation(program, "lightPosition");
    var lightAmbientUniformLocation = gl.getUniformLocation(program, "lightAmbient");
    var lightDiffuseUniformLocation = gl.getUniformLocation(program, "lightDiffuse");
    var lightSpecularUniformLocation = gl.getUniformLocation(program, "lightSpecular");
    var lightHalfVectorUniformLocation = gl.getUniformLocation(program, "lightHalfVector");

    gl.uniform4fv(lightPositonUniformLocation, lightPosition)
    gl.uniform4fv(lightAmbientUniformLocation, lightAmbient)
    gl.uniform4fv(lightDiffuseUniformLocation,lightDiffuse)
    gl.uniform4fv(lightSpecularUniformLocation, lightSpecular)
    gl.uniform3fv(lightHalfVectorUniformLocation, lightHalfVector)
}

function setMaterialUniforms(gl, program, materialAmbient, materialDiffuse, materialSpecular, materialEmission, materialShininess) {
    var materialEmissionUniformLocation = gl.getUniformLocation(program, "materialEmission");
    var materialAmbientUniformLocation = gl.getUniformLocation(program, "materialAmbient");
    var materialDiffuseUniformLocation = gl.getUniformLocation(program, "materialDiffuse");
    var materialSpecularUniformLocation = gl.getUniformLocation(program, "materialSpecular");
    var materialShininessUniformLocation = gl.getUniformLocation(program, "materialShininess");

    gl.uniform4fv(materialEmissionUniformLocation, materialEmission)
    gl.uniform4fv(materialAmbientUniformLocation, materialAmbient)
    gl.uniform4fv(materialDiffuseUniformLocation, materialDiffuse)
    gl.uniform4fv(materialSpecularUniformLocation, materialSpecular)
    gl.uniform1f(materialShininessUniformLocation, materialShininess)
}

async function getDataFromObj(url) {
    let text = await getFileText(url)
    let lineList = text.split(/\r*\n/)

    var vList = [] // 3-4 elemnts per vertex x,y,z(,w)
    var vtList = [] // 1-3 elements per texture coordinate u(,v,w)
    var vnList = [] // 3 elements per vertex normal x,y,z
    var fList = [] // TODO: should vbo?
    
    lineList.forEach(line => {
        let splitLine = line.trim().split(/\s+/)
        switch (splitLine.shift()) {
            case "v":
                addSplitLineToList(splitLine, vList)
                break;
            case "vn":
                addSplitLineToList(splitLine, vnList)
                break;
            case "vt":
                addSplitLineToList(splitLine, vtList)
                break;
            case "f":
                splitLine.forEach(element => {
                    let indices = element.split("/") 
                    let index = parseInt(indices[0]) - 1
                    vList[index].forEach(coord => {
                        fList.push(coord)
                    });
                    
                    if (vtList.length != 0) {
                        vtList[parseInt(indices[1]) - 1].forEach(coord => {
                            fList.push(coord)
                        });
                    }

                    if (vnList.length != 0) {
                        vnList[parseInt(indices[2]) - 1].forEach(coord => {
                            fList.push(coord)
                        });
                    }
                });
                break;
            default:
                break;
        }
    });

    return fList
}

async function setupVideo(id) {
    const video = document.getElementById(id)
    var playing = false
    var timeUpdate = false
    var copyVideo = false

    video.autoplay = true
    video.muted = true
    video.loop = true

    video.addEventListener('playing', function() {
        playing = true
        checkReady()
    }, true)

    video.addEventListener('timeupdate', function() {
        timeUpdate = true
        checkReady()
    }, true)

    video.play()

    function checkReady() {
        if( playing && timeUpdate){
            copyVideo = true
        }
    }

    return video
}

async function loadTexture(gl, url) {
    const texture = gl.createTexture()

    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE

    let promise = new Promise(resolve => {
        const img = new Image()

        img.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 
                level, 
                internalFormat, 
                srcFormat, 
                srcType, 
                img)
            
            gl.generateMipmap(gl.TEXTURE_2D)

            resolve()
        }

        img.src = url

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip texture
    
    })
    
    return promise
}

// // returns a promise, so one can wait for the image to load before using it
async function loadTextureWithTarget(gl, url, glTarget) {
    const texture = gl.createTexture()
    // gl.bindTexture(glTarget, texture)

    // make texture with one pixel to allow texture to load
    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    
    // attach and load real texture
    return new Promise( resolve => {
        const image = new Image()
        image.onload = () => resolve(texture,
            gl.texImage2D(glTarget,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image
            ))
        image.src = url
    })
}

function addSplitLineToList(line, list) {
    for (let i = 0; i < line.length; i++) {
        line[i] = parseFloat(line[i])
    }

    // if (splitLine.length == 3) { // add default w if only x,y,z were given
    //     splitLine.push(1.0)
    // }

    list.push(line)
}

function vboSetup(context, vertices) {
    let vbo = context.createBuffer()
    context.bindBuffer(context.ARRAY_BUFFER, vbo)
    context.bufferData(context.ARRAY_BUFFER,
        new Float32Array(vertices),
        context.STATIC_DRAW)
    context.bindBuffer(context.ARRAY_BUFFER, null)
    return vbo
}

function iboSetup(context, indices) {
    let ibo = context.createBuffer()
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, ibo)
    context.bufferData(context.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        context.STATIC_DRAW)
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, null)
    return ibo
}

function feedDataToShader(context, program, shaderAttrName) {
    const positionAttributeLocation = context.getAttribLocation(program, shaderAttrName)
    context.vertexAttribPointer(
        positionAttributeLocation,
        2,
        context.FLOAT,
        context.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT,
        0 * Float32Array.BYTES_PER_ELEMENT
    )
    context.enableVertexAttribArray(positionAttributeLocation)
}

function initVertexShader(context, vertexShaderText) {
    const vertexShader = context.createShader(context.VERTEX_SHADER)
    context.shaderSource(vertexShader, vertexShaderText)
    context.compileShader(vertexShader)

    // check for compile errors (not automatic)
	if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) 
	{
        console.error("Error compiling vertexShader: ", context.getShaderInfoLog(vertexShader))
	}

    return vertexShader
}

function initFragShader(context, fragmentShaderText) {
    const fragShader = context.createShader(context.FRAGMENT_SHADER)
    context.shaderSource(fragShader, fragmentShaderText)
    context.compileShader(fragShader)

    // check for compile errors (not automatic)
	if (!context.getShaderParameter(fragShader, context.COMPILE_STATUS)) 
	{
        console.error("Error compiling fragmentShader: ", context.getShaderInfoLog(fragShader))
	}

    return fragShader
}
