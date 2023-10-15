'use strict'

let cameraDistance = 5
const minCameraDistance = 2
const maxCameraDistance = 8
const yRotSpeed = 1
let mouseDeltaX = 0
let mouseDeltaY = 0

let isReflecting = false
let useToonshader = false
let triggerSkullAnimation = false;

async function init() {
    
    const canvas = document.getElementById("canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false })
    
    let vertexShaderText = await getFileText("shaders/vertexShader")
    let fragmentShaderText = await getFileText("shaders/fragmentShader")
    const vertexShader = initVertexShader(gl, vertexShaderText)
    const fragShader = initFragShader(gl, fragmentShaderText)
	
    const program = gl.createProgram()
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragShader)
	gl.linkProgram(program)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    const pedestalVertices = await getDataFromObj("objects/pedestal.obj")
    const pedestalVbo = vboSetup(gl, pedestalVertices)

    const skullVertices = await getDataFromObj("objects/skull.obj")
    const skullVbo = vboSetup(gl, skullVertices)

    const diamondVertices = await getDataFromObj("objects/diamond.obj")
    const diamondVbo = vboSetup(gl, diamondVertices)
    
    gl.useProgram(program)

    // fragment uniforms for Material and Light
    var lightPositon = new Float32Array(4);
    lightPositon[0] = 0.0;
    lightPositon[1] = 2.0;
    lightPositon[2] = 2.0;
    lightPositon[3] = 1.0;

    var lightAmbient = new Float32Array(4)
    lightAmbient[0] = 0.3;
    lightAmbient[1] = 0.3;
    lightAmbient[2] = 0.4;
    lightAmbient[3] = 1.0;

    var lightDiffuse = new Float32Array(4)
    lightDiffuse[0] = 1.0;
    lightDiffuse[1] = 1.0;
    lightDiffuse[2] = 1.0;
    lightDiffuse[3] = 1.0;

    var lightSpecular = new Float32Array(4)
    lightSpecular[0] = 1.0;
    lightSpecular[1] = 1.0;
    lightSpecular[2] = 1.0;
    lightSpecular[3] = 1.0;

    var lightHalfVector = new Float32Array(3)
    lightHalfVector[0] = 0.0;
    lightHalfVector[1] = 0.0;
    lightHalfVector[2] = 0.0;

    var materialEmission = new Float32Array(4)
    materialEmission[0] = 0.0;
    materialEmission[1] = 0.0;
    materialEmission[2] = 0.0;
    materialEmission[3] = 0.0;

    var materialAmbient = new Float32Array(4)
    materialAmbient[0] = 0.25;
    materialAmbient[1] = 0.25;
    materialAmbient[2] = 0.25;
    materialAmbient[3] = 1.0;

    var materialDiffuse = new Float32Array(4)
    materialDiffuse[0] = 0.4;
    materialDiffuse[1] = 0.4;
    materialDiffuse[2] = 0.4;
    materialDiffuse[3] = 1.0;

    var materialSpecular = new Float32Array(4)
    materialSpecular[0] = 0.77;
    materialSpecular[1] = 0.77;
    materialSpecular[2] = 0.77;
    materialSpecular[3] = 1.0;

    var materialShininess = 76.6
    
    var viewMatrix = new Float32Array(16)
    var projectionMatrix = new Float32Array(16)
    lookAt(viewMatrix, [5,7,5], [0,5,0], [0,1,0]) // first is Eye -> cam pos; second is Look -> point to look at; third is Up -> vertical from cam
    perspective(projectionMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0)
    
    var worldViewMatrix = new Float32Array(16)
    var worldMatrix = new Float32Array(16)
    identity(worldMatrix)
    multiply(worldViewMatrix, viewMatrix, worldMatrix) 

    // pedestal transforms
    var pedestalWorldMatrix = new Float32Array(16)
    var pedestalNormalMatrix = new Float32Array(9)
    identity(pedestalWorldMatrix)
    normalMatrixFrom(pedestalNormalMatrix, pedestalWorldMatrix, viewMatrix)
    
    // skull transforms
    var skullWorldMatrix = new Float32Array(16)
    var skullNormalMatrix = new Float32Array(9)
    identity(skullWorldMatrix)
    skullWorldMatrix[13] = 4.705 // nach y verschieben
    skullWorldMatrix[14] = -0.2  // nach z verschieben 
    normalMatrixFrom(skullNormalMatrix, skullWorldMatrix, viewMatrix)

    // diamond transforms
    var diamondWorldMatrix = new Float32Array(16)
    var diamondNormalMatrix = new Float32Array(9)

    identity(diamondWorldMatrix)
    normalMatrixFrom(diamondNormalMatrix, diamondWorldMatrix, viewMatrix)
    
    // Texture for skull and pedestal
    var baseColorTextureUniformLocation = gl.getUniformLocation(program, "baseColorTexture")
    gl.uniform1i(baseColorTextureUniformLocation, 0)
    gl.activeTexture(gl.TEXTURE1)
    await loadTexture(gl, "objects/pedestal_tex.png")

    gl.activeTexture(gl.TEXTURE3)
    await loadTexture(gl, "objects/skull_tex.jpg")

    setLightUniforms(gl, program, lightPositon, lightAmbient, lightDiffuse, lightSpecular, lightHalfVector)
    setMaterialUniforms(gl, program, materialAmbient, materialDiffuse, materialSpecular, materialEmission, materialShininess)

    const useToonShaderLocation = gl.getUniformLocation(program, 'useToonshader')

    // fog 
    const fogColor = new Float32Array(4)
    fogColor[0] = 0.0
    fogColor[1] = 0.0
    fogColor[2] = 0.02
    fogColor[3] = 1.0

    const fogNearLocation = gl.getUniformLocation(program, 'fogNear')
    const fogFarLocation = gl.getUniformLocation(program, 'fogFar')
    const fogColorLocation = gl.getUniformLocation(program, 'fogColor')
    gl.uniform1f(fogNearLocation, 5)
    gl.uniform1f(fogFarLocation, 8)
    gl.uniform4fv(fogColorLocation, fogColor)

    // reflection
    const reflectionVecLocation = gl.getUniformLocation(program, 'reflectionVec')
    const skyTextureLocation = gl.getUniformLocation(program, 'skyTexture')
    const reflectsSkyBoxLocation = gl.getUniformLocation(program, 'reflectsSkybox')

    var dirToCam = new Float32Array(3)
    var viewMatrix3x3 = new Float32Array(9)
    viewMatrix3x3[0] = viewMatrix[0]
    viewMatrix3x3[1] = viewMatrix[1]
    viewMatrix3x3[2] = viewMatrix[2]
    viewMatrix3x3[3] = viewMatrix[4]
    viewMatrix3x3[4] = viewMatrix[5]
    viewMatrix3x3[5] = viewMatrix[6]
    viewMatrix3x3[6] = viewMatrix[8]
    viewMatrix3x3[7] = viewMatrix[9]
    viewMatrix3x3[8] = viewMatrix[10]
    viewMatrix3x3 = inverse3x3(viewMatrix3x3, viewMatrix3x3)
    dirToCam[2] = viewMatrix3x3[6] + viewMatrix3x3[7] + viewMatrix3x3[8] 

    gl.uniform3fv(reflectionVecLocation, dirToCam)
    gl.uniform1i(skyTextureLocation, 2)
    gl.uniform1i(reflectsSkyBoxLocation, 0)

    // Texture for diamonds
    gl.activeTexture(gl.TEXTURE0)
    await loadTexture(gl, "objects/diamond_tex_50.png")
  
    // Animation and camera stuff
    let skullHoverBaseValue = skullWorldMatrix[13]+0.35;
    let skullAnimationState = true;
    let skullAnimationFirstRun = true;
    let skullHeight = skullWorldMatrix[13]
    const lookOffset = 0.45

    const numOfDiamonds = 10
    let yRotMatrixDiamonds = new Float32Array(16)
    let identityMatrix = new Float32Array(16)
    identity(identityMatrix)

    let translateVecDiamonds = new Float32Array(3)
    translateVecDiamonds[0] = 0.6  // radius
    translateVecDiamonds[1] = 4.75 // height
    translateVecDiamonds[2] = 0

    let translateVecMainDiamond = new Float32Array(3)
    translateVecMainDiamond[1] = translateVecDiamonds[1]
    translateVecMainDiamond[2] = 0.2

    let scaleVecMainDiamond = new Float32Array(3)
    scaleVecMainDiamond[0] = 0.05
    scaleVecMainDiamond[1] = 0.05
    scaleVecMainDiamond[2] = 0.05

    let randomYRotationDiamonds = new Float32Array(numOfDiamonds)
    for (let i = 0; i < numOfDiamonds; i++) {
        randomYRotationDiamonds[i] = Math.random() * Math.PI 
    }

    let scaleVec = new Float32Array(3)
    let randomScaleDiamonds = new Float32Array(numOfDiamonds)
    for (let i = 0; i < numOfDiamonds; i++) {
        randomScaleDiamonds[i] = Math.random() * 0.03
        if (randomScaleDiamonds[i] < 0.01) randomScaleDiamonds[i] = 0.01
    }

    gl.activeTexture(gl.TEXTURE2)
    let skyboxData = await makeSkybox(gl, worldViewMatrix, projectionMatrix, 2)

    async function draw() {
        gl.disable(gl.BLEND)
        gl.depthMask(true)
        skullAnimation(skullWorldMatrix)
        gl.clearColor(fogColor[0], fogColor[1], fogColor[2], fogColor[3])
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        
        skullHeight = skullWorldMatrix[13]

        lightPositon[0] = Math.sin(mouseDeltaX) * cameraDistance
        lightPositon[1] = cameraDistance + 3.1
        lightPositon[2] = Math.cos(mouseDeltaX) * cameraDistance
        
        lookAt(viewMatrix, [lightPositon[0], lightPositon[1], lightPositon[2]], [0,skullHeight+lookOffset,0], [0,1,0])

        // skybox
        gl.useProgram(skyboxData[0])
        gl.bindBuffer(gl.ARRAY_BUFFER, skyboxData[1])

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
        gl.cullFace(gl.FRONT)

        gl.drawElements(gl.TRIANGLES, skyboxData[2], gl.UNSIGNED_SHORT, 0)

        // objects
        gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        setLightUniforms(gl, program, lightPositon, lightAmbient, lightDiffuse, lightSpecular, lightHalfVector)
        gl.cullFace(gl.BACK)

        if (useToonshader) {
            gl.uniform1i(useToonShaderLocation, 1)
        } else {
            gl.uniform1i(useToonShaderLocation, 0)
        }

        objectSetup(gl, pedestalVbo, program)
        gl.uniform1i(reflectsSkyBoxLocation, 0)
        gl.uniform1i(baseColorTextureUniformLocation, 1)
        normalMatrixFrom(pedestalNormalMatrix, pedestalWorldMatrix, viewMatrix)
        setTransformUniforms(gl, program, pedestalWorldMatrix, viewMatrix, projectionMatrix, pedestalNormalMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, pedestalVertices.length / 8) 
        
        objectSetup(gl, skullVbo, program)
        if (isReflecting) {
            gl.uniform1i(reflectsSkyBoxLocation, 1)
        } 
        gl.uniform1i(baseColorTextureUniformLocation, 3)
        normalMatrixFrom(skullNormalMatrix, skullWorldMatrix, viewMatrix)
        setTransformUniforms(gl, program, skullWorldMatrix, viewMatrix, projectionMatrix, skullNormalMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, skullVertices.length / 8)
        
        // diamonds 
        gl.enable(gl.BLEND)
        gl.blendFuncSeparate(gl.SRC_COLOR, gl.DST_COLOR, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_SUBTRACT);
        gl.depthMask(false)
        
        objectSetup(gl, diamondVbo, program)
        gl.uniform1i(baseColorTextureUniformLocation, 0)
        gl.uniform1i(reflectsSkyBoxLocation, 0)
        normalMatrixFrom(diamondNormalMatrix, diamondWorldMatrix, viewMatrix)

        for (let i = 0; i < numOfDiamonds; i++) {
            rotateY(yRotMatrixDiamonds, identityMatrix, randomYRotationDiamonds[i])
            multiply(diamondWorldMatrix, yRotMatrixDiamonds, identityMatrix)
            
            translate(diamondWorldMatrix, diamondWorldMatrix, translateVecDiamonds)
            
            scaleVec[0] = scaleVec[1] = scaleVec[2] = randomScaleDiamonds[i]
            scale(diamondWorldMatrix, diamondWorldMatrix, scaleVec)

            setTransformUniforms(gl, program, diamondWorldMatrix, viewMatrix, projectionMatrix, diamondNormalMatrix)
            gl.drawArrays(gl.TRIANGLES, 0, diamondVertices.length / 8)
        }

        identity(diamondWorldMatrix)
        translate(diamondWorldMatrix, diamondWorldMatrix, translateVecMainDiamond)
        scale(diamondWorldMatrix, diamondWorldMatrix, scaleVecMainDiamond)
        setTransformUniforms(gl, program, diamondWorldMatrix, viewMatrix, projectionMatrix, diamondNormalMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, diamondVertices.length / 8)
        requestAnimationFrame(draw)
    }

    requestAnimationFrame(draw)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    function skullAnimation(skullWorldMatrix) {
        if (triggerSkullAnimation) {
            switch (skullAnimationState) {
                case true:
                    skullWorldMatrix[13] = skullWorldMatrix[13] + 0.002

                    if (skullAnimationFirstRun) {
                        rotateX(skullWorldMatrix, skullWorldMatrix, 0.0008)
                    }

                    if (skullWorldMatrix[13] >= skullHoverBaseValue + 0.60) {
                        skullAnimationState = false
                    }

                    break
                case false:
                    skullWorldMatrix[13] = skullWorldMatrix[13] - 0.0022
                    if (skullWorldMatrix[13] <= skullHoverBaseValue) {
                        skullAnimationState = true
                    }

                    skullAnimationFirstRun = false
                    break
            }
        }
    }
}

window.onload = init

// Event Listener
let mouseIsDown = false
let startingTouchX = 0
let startingTouchY = 0

document.body.onkeyup = function(e){
    if(e.keyCode == 32){            // pressed space
      triggerSkullAnimation = !triggerSkullAnimation
    } else if (e.keyCode == 82) {   // pressed R
        isReflecting = !isReflecting
    } else if (e.keyCode == 84) {   // pressed T
        useToonshader = !useToonshader
    }
}

document.addEventListener('mousedown', function(event) { 
    mouseIsDown = true
}, true)

document.addEventListener('mouseup', function(event) {
    mouseIsDown = false
}, true)

document.addEventListener('mousemove', function(event) {
    if (mouseIsDown) {
        mouseDeltaX += -1 * event.movementX * yRotSpeed / 100
        mouseDeltaY += -1 * event.movementY * yRotSpeed / 100
    }
}, true)


document.addEventListener('wheel', function(event) {
    var delta = event.deltaY
    addCameraDistance(delta/100)
})

// mobile event listener
document.addEventListener('touchstart', function(event) {
    if (event.touches.length == 2) { // two fingers
        triggerSkullAnimation = !triggerSkullAnimation
    }
    startingTouchX = event.touches[0].pageX
    startingTouchY = event.touches[0].pageY
}, true)

document.addEventListener('touchmove', function(event) {
    let currentX = event.touches[0].pageX
    mouseDeltaX += -1 * (currentX - startingTouchX) / 200   
    startingTouchX = currentX

    let currentY = event.touches[0].pageY
    addCameraDistance((currentY - startingTouchY) / 100)
    startingTouchY = currentY
})

function addCameraDistance(newDistance) {
    cameraDistance += newDistance
    if (cameraDistance < minCameraDistance) {
        cameraDistance = minCameraDistance
    }
    else if (cameraDistance > maxCameraDistance) {
    cameraDistance = maxCameraDistance
    }
}
