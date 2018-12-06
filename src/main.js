const THREE = require('three');
import Framework from './framework'
import Space from './planet_simulator'

var currTime = 0;
var background_texture = new THREE.TextureLoader().load('space.jpg');
var scene, camera, renderer, gui;
var orbiting = false;

var space = new Space.Space();

var input = {
  orbiting: false,
  
  addPlanet: function() {space.addNewPlanet(scene, camera, renderer, gui)}

}
// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  camera = framework.camera;
  renderer = framework.renderer;
  gui = framework.gui;

  //main controls
  var mainFolder = gui.addFolder('main');

  mainFolder.add(input, 'orbiting').onChange(function () {
    orbiting = !orbiting;

    space.bodies[1].position = new THREE.Vector3(1.496e11, 0.000e00, 0.000e00);
    space.bodies[1].velocity = new THREE.Vector3(0.000e00, 1.490e04, 0.000e00);

    if(orbiting) {
      camera.position.set(500, 0, 8000);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    else {
      camera.position.set(7000, 0, 0);
      camera.lookAt(space.bodies[1].position);
    }

  });

  mainFolder.add(input, 'addPlanet');

  var planet_geom = new THREE.IcosahedronBufferGeometry(100, 5);
    var mesh = new THREE.Mesh(planet_geom);
    scene.add(mesh);


  space.initializePlanets(scene, camera, renderer, gui);

  // set camera position
  //camera.position.set(space.bodies[1].x, space.bodies[1].y + 15.0, 400.0);
  
  camera.position.set(7000, 0, 0);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  

  // set scene background
  scene.background = background_texture;

  
  renderer.render(scene, camera);
}

// called on frame updates
function onUpdate() {
  currTime += 0.03;
  space.updateTime(currTime);
  if(camera != null) {
    space.simulate(orbiting, camera);
    //console.log(camera.position);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);