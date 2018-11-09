
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

var currTime = 0;
var mouse;

var input = {
  amplitude: 40.0,
  mouse_interactivity: false
};

var myMaterial = new THREE.ShaderMaterial({
  uniforms: {
      image: { // Check the Three.JS documentation for the different allowed types and values
        type: "t", 
        value: THREE.ImageUtils.loadTexture('./colors.jpg')
      },
      time: {
        type: "float",
        value: currTime
      },
      persistence: {
        type: "float",
        value: 0.59
      },
      amplitude: {
        type: "float",
        value: 40.0
      },
      inclination: {
        type: "v3",
        value: new THREE.Vector3(0, 0, 0)
      },
      reaction: {
        type: "fv1",
        value: []
      }
    },
    vertexShader: require('./shaders/my-vert.glsl'),
    fragmentShader: require('./shaders/my-frag.glsl')
  });

var grid;
var next;

var dA = 0.8;
var dB = 0.2;
var feed = 0.055;
var k = 0.065;

var width = 10;
var height = 10;
var iterations = 25;

// called after the scene loads
function onLoad(framework) {
  var {scene, camera, renderer, gui, stats} = framework;

  // create geometry and add it to the scene
  var geom_icosa = new THREE.IcosahedronBufferGeometry(65, 5);
  myMaterial.uniforms.reaction.value = react();
  var myIcosa = new THREE.Mesh(geom_icosa, myMaterial);
  scene.add(myIcosa);

  // set camera position
  camera.position.set(15, 15, 180);
  camera.lookAt(new THREE.Vector3(0,0,0));



  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  // add a slider to let user change *radius* of icosahedron
  gui.add(myIcosa.geometry.parameters, 'radius', 0, 100).onChange(function(newVal) {
    var detail = myIcosa.geometry.parameters.detail;
    scene.remove(myIcosa);
    myIcosa = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(newVal, detail), myMaterial);
    scene.add(myIcosa);
    renderer.render(scene, camera);
  });

  // add a slider to let user change *detail* of icosahedron 
  gui.add(myIcosa.geometry.parameters, 'detail', 0, 8).step(1).onChange(function(newVal) {
    var radius = myIcosa.geometry.parameters.radius;
    scene.remove(myIcosa);
    myIcosa = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(radius, newVal), myMaterial);
    scene.add(myIcosa);
    renderer.render(scene, camera);
  });

  // add a slider to let user change *persistence* of noise 
  gui.add(input, 'amplitude', 0, 50).onChange(function(newVal) {
    myMaterial.uniforms.amplitude.value = input.amplitude;
    renderer.render(scene, camera);
  });
  
}

function react() {
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

  for (var i = width / 2 - 1; i < width / 2 + 1; i++) {
    for (var j = height / 2 - 1; j < height / 2 + 1; j++) {
      if (withinBounds(i, j) && 
        Math.pow(i - width / 2, 2) + Math.pow(j - height / 2, 2) < 25 && 
        grid[i][j] != undefined) {
        grid[i][j][1] = 1;
      }
    }
  }

  var result = []

  for (var t = 0; t < iterations; t++) {
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

        var c = Math.floor((next[x][y][0] - next[x][y][1]) * 255);
        result[(x * width) + y] = constrain(c, 0, 255);
      }
    }
    swap();
  }
  console.log(result);
  return result;
}

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
function onUpdate(framework) {
  //currTime += 0.2;
  //myMaterial.uniforms.time.value = currTime;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);