const THREE = require('three');
import Framework from './framework'
import Planet from './planet'

var currTime = 0;
var background_texture = new THREE.TextureLoader().load('space.jpg');
var scene, camera, renderer, gui;

var earth = new Planet.Planet();

// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  camera = framework.camera;
  renderer = framework.renderer;
  gui = framework.gui;

  // add earth at position (0, 0, 0)
  earth.addPlanet(scene, new THREE.Vector3(0, 0, 0));

  // set camera position
  camera.position.set(0, 0, 200);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // set scene background
  scene.background = background_texture;

  // add controls for earth
  earth.addControls(scene, camera, renderer, gui);

  renderer.render(scene, camera);
}

// called on frame updates
function onUpdate() {
  currTime += 0.03;
  earth.updateTime(currTime);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);