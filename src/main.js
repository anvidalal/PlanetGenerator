
const THREE = require('three');
import Framework from './framework'

var currTime = 0;

var grid;
var next;

var dA = 0.8;
var dB = 0.2;
var feed = 0.055;
var k = 0.065;

var width = 200;
var height = 200;
var iterations = 400;

var reaction_texture = new THREE.DataTexture(react(), width, height, THREE.RGBFormat);
reaction_texture.needsUpdate = true;

var background_texture = new THREE.TextureLoader().load( 'space.jpg' );

var input = {
  amplitude: 40.0,
  cloud_visibility: true
};

var myMaterial = new THREE.ShaderMaterial({
  uniforms: {
    image: {
      type: "t",
      value: THREE.ImageUtils.loadTexture('./colors.jpg')
    },
    reaction: {
      type: "t",
      value: reaction_texture
    },
    amplitude: {
      type: "float",
      value: 40.0
    }
  },
  vertexShader: require('./shaders/my-vert.glsl'),
  fragmentShader: require('./shaders/my-frag.glsl'),
  lights: false
});

var cloudMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inclination: {
      type: "v3",
      value: new THREE.Vector3(0, 0, 0)
    },
    time: {
      type: "float",
      value: currTime
    }
  },
  vertexShader: require('./shaders/cloud-vert.glsl'),
  fragmentShader: require('./shaders/cloud-frag.glsl'),
  transparent: true,
  lights: false
});

// called after the scene loads
function onLoad(framework) {
  var { scene, camera, renderer, gui } = framework;

  // create geometry and add it to the scene
  var geom_icosa = new THREE.IcosahedronBufferGeometry(30, 5);
  var myIcosa = new THREE.Mesh(geom_icosa, myMaterial);
  scene.add(myIcosa);

  //create cloud geometry and add to scene
  var cloud_geom = new THREE.IcosahedronBufferGeometry(50, 5);
  var cloud_mesh = new THREE.Mesh(cloud_geom, cloudMaterial);
  if (input.cloud_visibility) {
    scene.add(cloud_mesh);
  }

  // set camera position
  camera.position.set(15, 15, 200);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // set scene background
  scene.background = background_texture;

  // add a slider to let user change radius of icosahedron
  gui.add(myIcosa.geometry.parameters, 'radius', 0, 100).onChange(function (newVal) {
    var detail = myIcosa.geometry.parameters.detail;
    scene.remove(myIcosa);
    myIcosa = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(newVal / 100 * 10 + 20, detail), myMaterial);
    scene.add(myIcosa);
    renderer.render(scene, camera);
  });

  // add a slider to let user change amplitude of noise 
  gui.add(input, 'amplitude', 0, 50).onChange(function () {
    myMaterial.uniforms.amplitude.value = input.amplitude;
    renderer.render(scene, camera);
  });

  // add a checkbox to toggle cloud visibility
  gui.add(input, "cloud_visibility").onChange(function () {
    input.cloud_visibility ? scene.add(cloud_mesh) : scene.remove(cloud_mesh);
  });

  renderer.render(scene, camera);
}

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

  // create texture image
  return getReactionData();
}

function iterateReaction(numIterations) {
  // randomly add craters
  for (var t = 0; t < numIterations; t++) {
    if (Math.random() < 0.1) {
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

// called on frame updates
function onUpdate() {
  currTime += 0.03;
  cloudMaterial.uniforms.time.value = currTime;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);