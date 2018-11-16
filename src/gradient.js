const THREE = require('three');

function lerp(x, y, t) {
    return x * (1 - t) + y * t;
}

function lerp_colors(color1, color2, t) {
    return new THREE.Color(lerp(color1.r, color2.r, t),
        lerp(color1.g, color2.g, t),
        lerp(color1.b, color2.b, t));
}

function createGradient(colors, width, height) {
    var data = new Uint8Array(3 * width * height);
    var i = 0;
    for (var i = 0; i < colors.length - 1; i++) {
        var lower = (i * data.length / ((colors.length - 1) * 3.0)) * 3.0;
        var upper = ((i + 1) * data.length / ((colors.length - 1) * 3.0)) * 3.0;
        for (var j = lower; j < upper; j += 3) {
            var t = (j - lower) / (upper - lower);
            var color = lerp_colors(colors[i], colors[i + 1], t);
            data[j] = color.r * 255;
            data[j + 1] = color.g * 255;
            data[j + 2] = color.b * 255;
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