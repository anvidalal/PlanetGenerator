const THREE = require('three');
import Framework from './framework'
import Space from './planet_simulator'
import planet from './planet';

var currTime = 0;
var background_texture = new THREE.TextureLoader().load('space.jpg');
var scene, camera, renderer, gui, controls;
var orbiting = false;
var currView = 1;

var space = new Space.Space();

var input = {
  orbiting: false,
  addPlanet: function() {if(!orbiting) {space.addNewPlanet(scene, camera, renderer, gui, orbiting)}},
  viewPlanet: 1

}
// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  camera = framework.camera;
  renderer = framework.renderer;
  gui = framework.gui;
  controls = framework.controls;

  //main controls
  var mainFolder = gui.addFolder('main');

  mainFolder.add(input, 'orbiting').onChange(function () {
    orbiting = !orbiting;

    if(orbiting) {
      for(var i = 1; i < space.bodies.length; i++) {
        space.bodies[i].position = space.bodies[i].orbitPos; 
        space.bodies[i].velocity = space.bodies[i].orbitVel; 
        
      }

      camera.position.set(0, 0, 8000);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    }
    else {
      for(var i = 1; i < space.bodies.length; i++) {
        //if planet is the one currently being viewed, move to origin
        if(i == currView) {
          space.bodies[i].position = new THREE.Vector3(0, 0, 0); 
        }
        else {
          space.bodies[i].position = space.bodies[i].orbitPos;
        }
        space.bodies[i].updatePosition();
        space.bodies[i].velocity = new THREE.Vector3(0.000e00, 0, 0.000e00);
      }
      camera.position.set(0, 0, 1000);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
  });

  mainFolder.add(input, 'addPlanet').onChange(function() {
      //translate other planet out of way
      space.bodies[currView].position = space.bodies[currView].orbitPos;
      space.bodies[currView].updatePosition();
      currView++;
  });

  mainFolder.add(input, 'viewPlanet', [1, 2, 3, 4]).onChange(function(val) {
    if(!orbiting) {
      if(val >= space.bodies.length) {
        val = space.bodies.length - 1;
      }
      //translate planet at selected index to origin
      space.bodies[val].position = new THREE.Vector3(0, 0, 0);
      space.bodies[val].updatePosition();

      //translate other planet out of way
      if(currView != val) {
        space.bodies[currView].position = space.bodies[currView].orbitPos;
        space.bodies[currView].updatePosition();
       }
      currView = val;
    }
  });

  var sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd100,
    emissive: 0xfffe00
  });


  var planet_geom = new THREE.IcosahedronBufferGeometry(100, 5);
    var mesh = new THREE.Mesh(planet_geom, sunMaterial);
    scene.add(mesh);


  space.initializePlanets(scene, camera, renderer, gui, orbiting);

  // set camera position
  camera.position.set(0, 0, 1000);
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
  }

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);