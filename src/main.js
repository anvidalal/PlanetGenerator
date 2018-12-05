const THREE = require('three');
import Framework from './framework'
import Space from './planet_simulator'

var currTime = 0;
var background_texture = new THREE.TextureLoader().load('space.jpg');
var scene, camera, renderer, gui;

var space = new Space.Space();

// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  camera = framework.camera;
  renderer = framework.renderer;
  gui = framework.gui;


  // set camera position
  camera.position.set(500, 0, 8000);
  camera.lookAt(new THREE.Vector3(500, 0, 0));

  space.addPlanets(scene);

  // set scene background
  scene.background = background_texture;

  // add controls for earth
  //earth.addControls(scene, camera, renderer, gui);
  
  renderer.render(scene, camera);
}

// called on frame updates
function onUpdate() {
  currTime += 0.03;
  space.updateTime(currTime);
  space.simulate();
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);