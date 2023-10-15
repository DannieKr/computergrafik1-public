function identity(out) {
    for (var i = 0; i < 16; i++) {
        out[i] = 0
    }

    out[0] = 1
    out[5] = 1
    out[10] = 1
    out[15] = 1

    return out
}

function translate(out, inMat, v) {  // different in glMatrix  
    var x = v[0]
    var y = v[1]
    var z = v[2]

    out[12] = x*inMat[0] + y*inMat[4] + z*inMat[8] + inMat[12]
    out[13] = x*inMat[1] + y*inMat[5] + z*inMat[9] + inMat[13]
    out[14] = x*inMat[2] + y*inMat[6] + z*inMat[10] + inMat[14]
    out[15] = x*inMat[3] + y*inMat[7] + z*inMat[11] + inMat [15]

    return out
}

function scale(out, inMat, v) { // multiply each column with corresponding vector coordinate. WebGL works in columns  
    var x = v[0]
    var y = v[1]
    var z = v[2]

    out[0] = inMat[0] * x
    out[1] = inMat[1] * x
    out[2] = inMat[2] * x
    out[3] = inMat[3] * x
    out[4] = inMat[4] * y
    out[5] = inMat[5] * y
    out[6] = inMat[6] * y
    out[7] = inMat[7] * y
    out[8] = inMat[8] * z
    out[9] = inMat[9] * z
    out[10] = inMat[10] * z
    out[11] = inMat[11] * z
    out[12] = inMat[12] 
    out[13] = inMat[13]
    out[14] = inMat[14]
    out[15] = inMat[15]

    return out
}

function rotateY(out, inMat, rad) {
    var sin = Math.sin(rad)
    var cos = Math.cos(rad)

    out[0] = inMat[0]*cos - inMat[8]*sin
    out[1] = inMat[1]*cos - inMat[9]*sin
    out[2] = inMat[2]*cos - inMat[10]*sin
    out[3] = inMat[3]*cos - inMat[11]*sin

    out[4] = inMat[4]
    out[5] = inMat[5]
    out[6] = inMat[6]
    out[7] = inMat[7]
    
    out[8] = inMat[0]*sin + inMat[8]*cos
    out[9] = inMat[1]*sin + inMat[9]*cos
    out[10] = inMat[2]*sin + inMat[10]*cos
    out[11] = inMat[3]*sin + inMat[11]*cos

    out[12] = inMat[12]
    out[13] = inMat[13]
    out[14] = inMat[14]
    out[15] = inMat[15]

    return out
}

function rotateX(out, inMat, rad) {
    var sin = Math.sin(rad)
    var cos = Math.cos(rad)

    out[0] = inMat[0]
    out[1] = inMat[1]
    out[2] = inMat[2]
    out[3] = inMat[3]

    out[4] = inMat[4]*cos + inMat[8]*sin
    out[5] = inMat[5]*cos + inMat[9]*sin
    out[6] = inMat[6]*cos + inMat[10]*sin
    out[7] = inMat[7]*cos + inMat[11]*sin
    
    out[8] = inMat[8]*cos - inMat[4]*sin
    out[9] = inMat[9]*cos - inMat[5]*sin
    out[10] = inMat[10]*cos - inMat[6]*sin
    out[11] = inMat[11]*cos - inMat[7]*sin

    out[12] = inMat[12]
    out[13] = inMat[13]
    out[14] = inMat[14]
    out[15] = inMat[15]
}

function lookAt(out, eye, look, up) {
    // rotation matrix
    var n = new Float32Array(3)
    n[0] = eye[0] - look[0]
    n[1] = eye[1] - look[1]
    n[2] = eye[2] - look[2]
    normalize(n, n)

    var u = new Float32Array(3) 
    crossProductOf(u, up, n)
    normalize(u, u)

    var v = new Float32Array(3) 
    crossProductOf(v, n, u)
    normalize(v, v)

    out[0] = u[0]
    out[1] = v[0]
    out[2] = n[0]
    out[3] = 0

    out[4] = u[1]
    out[5] = v[1]
    out[6] = n[1]
    out[7] = 0

    out[8] = u[2]
    out[9] = v[2]
    out[10] = n[2]
    out[11] = 0

    // transaltion
    out[12] = -(u[0]*eye[0] + u[1]*eye[1] + u[2]*eye[2])
    out[13] = -(v[0]*eye[0] + v[1]*eye[1] + v[2]*eye[2])
    out[14] = -(n[0]*eye[0] + n[1]*eye[1] + n[2]*eye[2])
    out[15] = 1

    return out
}

function perspective(out, fovy, aspect, near, far) { // fovy is vertical field of view in radians
    var f = 1.0 / Math.tan(fovy / 2)
    out[0] = f / aspect
    out[1] = 0
    out[2] = 0
    out[3] = 0

    out[4] = 0
    out[5] = f
    out[6] = 0
    out[7] = 0

    out[8] = 0
    out[9] = 0
    out[11] = -1

    out[12] = 0
    out[13] = 0
    out[15] = 0

    if (far != null && far != Infinity) {
        var nf = 1 / (near - far)
        out[10] = (far + near) * nf
        out[14] = 2 * far * near * nf
    } else {
        out[10] = -1
        out[14] = -2 * near
    }

    return out
}

function crossProductOf(out, first, second) { 
    out[0] = first[1]*second[2] - first[2]*second[1]
    out[1] = first[2]*second[0] - first[0]*second[2]
    out[2] = first[0]*second[1] - first[1]*second[0]
    return out;
}

function normalize(out, inVec) {
    const factor = 1/Math.hypot(inVec[0], inVec[1], inVec[2])
    out[0] = factor * inVec[0]
    out[1] = factor * inVec[1]
    out[2] = factor * inVec[2]
    return inVec 
}

function multiply(out, a, b) {
    const a00 = a[0]
    const a01 = a[4]
    const a02 = a[8]
    const a03 = a[12]

    const a10 = a[1]
    const a11 = a[5]
    const a12 = a[9]
    const a13 = a[13]

    const a20 = a[2]
    const a21 = a[6]
    const a22 = a[10]
    const a23 = a[14]

    const a30 = a[3]
    const a31 = a[7]
    const a32 = a[11]
    const a33 = a[15]

    const b00 = b[0]
    const b01 = b[4]
    const b02 = b[8]
    const b03 = b[12]

    const b10 = b[1]
    const b11 = b[5]
    const b12 = b[9]
    const b13 = b[13]

    const b20 = b[2]
    const b21 = b[6]
    const b22 = b[10]
    const b23 = b[14]

    const b30 = b[3]
    const b31 = b[7]
    const b32 = b[11]
    const b33 = b[15]

    out[0] = a00*b00 + a01*b10 + a02*b20 + a03*b30
    out[1] = a10*b00 + a11*b10 + a12*b20 + a13*b30
    out[2] = a20*b00 + a21*b10 + a22*b20 + a23*b30
    out[3] = a30*b00 + a31*b10 + a32*b20 + a33*b30

    out[4] = a00*b01 + a01*b11 + a02*b21 + a03*b31
    out[5] = a10*b01 + a11*b11 + a12*b21 + a13*b31
    out[6] = a20*b01 + a21*b11 + a22*b21 + a23*b31
    out[7] = a30*b01 + a31*b11 + a32*b21 + a33*b31

    out[8] = a00*b02 + a01*b12 + a02*b22 + a03*b32
    out[9] = a10*b02 + a11*b12 + a12*b22 + a13*b32
    out[10] = a20*b02 + a21*b12 + a22*b22 + a23*b32
    out[11] = a30*b02 + a31*b12 + a32*b22 + a33*b32

    out[12] = a00*b03 + a01*b13 + a02*b23 + a03*b33
    out[13] = a10*b03 + a11*b13 + a12*b23 + a13*b33
    out[14] = a20*b03 + a21*b13 + a22*b23 + a23*b33
    out[15] = a30*b03 + a31*b13 + a32*b23 + a33*b33

    return out
}


// 00, 01, 02
// 03, 04, 05
// 06, 07, 08
function inverse3x3(out, inMat) {
    let in00 = inMat[0]
    let in01 = inMat[3]
    let in02 = inMat[6]
    let in03 = inMat[1]
    let in04 = inMat[4]
    let in05 = inMat[7]
    let in06 = inMat[2]
    let in07 = inMat[5]
    let in08 = inMat[8]

    let d00 = in04*in08 - in05*in07
    let d01 = -1.0*(in03*in08 - in05*in06) 
    let d02 = in03*in07 - in04*in06
    let d03 = -1.0*(in01*in08 - in02*in07)
    let d04 = in00*in08 - in02*in06
    let d05 = -1.0*(in00*in07 - in01*in06)
    let d06 = in01*in05 - in02*in04
    let d07 = -1.0*(in00*in05 - in02*in03)
    let d08 = in00*in04 - in01*in03

    let d = 1.0/(in00*d00 + in01*d01 + in02*d02)

    out[0] = d*d00
    out[1] = d*d01
    out[2] = d*d02
    out[3] = d*d03
    out[4] = d*d04
    out[5] = d*d05
    out[6] = d*d06
    out[7] = d*d07
    out[8] = d*d08
     
    return out
}

function transpose(out, inMat){
    out[0] = inMat[0]
    out[1] = inMat[3]
    out[2] = inMat[6]
    out[3] = inMat[1]
    out[4] = inMat[4]
    out[5] = inMat[7]
    out[6] = inMat[2]
    out[7] = inMat[5]
    out[8] = inMat[8]

    return out
}

function normalMatrixFrom(out, worldMatrix, viewMatrix) {
    let modelViewMatrix = new Float32Array(16)
    multiply(modelViewMatrix, worldMatrix, viewMatrix) 
    
    out[0] = modelViewMatrix[0]
    out[1] = modelViewMatrix[1]
    out[2] = modelViewMatrix[2]
    out[3] = modelViewMatrix[4]
    out[4] = modelViewMatrix[5]
    out[5] = modelViewMatrix[6]
    out[6] = modelViewMatrix[8]
    out[7] = modelViewMatrix[9]
    out[8] = modelViewMatrix[10]
    
    inverse3x3(out, out)
    transpose(out, out)
}