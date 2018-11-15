const THREE = require('three');

var grid;
var next;

var dA = 0.8;
var dB = 0.2;
var feed = 0.055;
var k = 0.065;

var width = 200;
var height = 200;
var iterations = 300;

function react() {
    // initialize grid and next
    grid = [];
    next = [];
    for (var x = 0; x < width; x++) {
        grid[x] = [];
        next[x] = [];
        for (var y = 0; y < height; y++) {
            grid[x][y] = [1, 0];
            next[x][y] = [1, 0];
        }
    }

    // allow reaction to happen
    iterateReaction(iterations);

    // create texture image */
    return getReactionData();
}

function iterateReaction(numIterations) {
    // randomly add craters
    for (var t = 0; t < numIterations; t++) {
        if (Math.random() < 0.2) {
            blob(Math.floor(Math.random() * width),
                Math.floor(Math.random() * height),
                Math.floor(Math.random() * 20));
        }
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                var a = grid[x][y][0];
                var b = grid[x][y][1];
                next[x][y][0] = constrain(a +
                    (dA * laplace(x, y, 0)) -
                    (a * b * b) +
                    (feed * (1 - a)), 0, 1);
                next[x][y][1] = constrain(b +
                    (dB * laplace(x, y, 1)) +
                    (a * b * b) -
                    ((k + feed) * b), 0, 1);
            }
        }
        swap();
    }
}

function getReactionData() {
    // get current state in a 1D array
    var data = new Uint8Array(3 * width * height);
    var i = 0;

    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            var c = Math.floor((next[x][y][0] - next[x][y][1]) * 255);
            data[i] = constrain(c, 0, 255);
            data[i + 1] = constrain(c, 0, 255);
            data[i + 2] = constrain(c, 0, 255);
            i += 3;
        }
    }
    return data;
}

// add a crater at (px, py)
function blob(px, py, r) {
    for (var i = px - r; i < px + r; i++) {
        for (var j = py - r; j < py + r; j++) {
            if (withinBounds(i, j) &&
                (px - i) * (px - i) + (py - j) * (py - j) < r * r &&
                grid[i][j] != undefined) {
                grid[i][j][1] = 1;
            }
        }
    }
}

// perform laplace calculations on the reaction
function laplace(x, y, i) {
    var sum = 0;
    for (var a = -1; a <= 1; a++) {
        for (var b = -1; b <= 1; b++) {
            if (!withinBounds(x + a, y + b)) return 0;
            var m = a == 0 && b == 0 ? - 1 : a == 0 || b == 0 ? 0.2 : 0.05;
            sum += m * grid[x + a][y + b][i];
        }
    }
    return sum;
}

function withinBounds(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height;
}

function swap() {
    var temp = grid;
    grid = next;
    next = temp;
}

function constrain(a, x, y) {
    return Math.min(Math.max(a, x), y);
}

function getTexture() {
    return new THREE.DataTexture(react(), width, height, THREE.RGBFormat);
}

export default {
    getTexture: getTexture
}