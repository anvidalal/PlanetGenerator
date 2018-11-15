const THREE = require('three');

function lerp(color1, color2, t) {
    var result = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        result[i] = color1[i] * (1 - t) + color2[i] * t;
    }
    return result;
}

function createGradient(colors, width, height) {
    var data = new Uint8Array(3 * width * height);
    var i = 0;
    for (var i = 0; i < colors.length - 1; i++) {
        var lower = (i * data.length / ((colors.length - 1) * 3.0)) * 3.0;
        var upper = ((i + 1) * data.length / ((colors.length - 1) * 3.0)) * 3.0;
        for (var j = lower; j < upper; j+= 3) {
            var c = lerp(colors[i], colors[i + 1], (j - lower) / (upper - lower));
            data[j] = c[0];
            data[j + 1] = c[1];
            data[j + 2] = c[2];
        }
    }
    return data;
}

function getTexture(colors) {
    var width = 1;
    var height = colors.length * 20;
    return new THREE.DataTexture(createGradient(colors, width, height), width, height, THREE.RGBFormat);
}

export default {
    getTexture: getTexture
}