const THREE = require('three');
import Framework from './framework'
import Reaction from './reaction'
import Gradient from './gradient'

var currTime = 0;
var solarSystem; 

var input = {
  cloud_visibility: true,
  noise_reaction_balance: 0.5,
  amplitude: 20.0,
  radius: 150.0,
  cloud_density: 0.5,
  cloud_speed: .3,
  cloud_color: '#ffffff',
  color1: '#130c8c',
  color2: '#0d1faa',
  color3: '#19680e',
  color4: '#a79300',
  color5: '#caa62f'
};

var reaction_texture = Reaction.getTexture();
reaction_texture.needsUpdate = true;

var gradient_texture = Gradient.getTexture(getColors());
gradient_texture.needsUpdate = true;



var background_texture = new THREE.TextureLoader().load('space.jpg');

var planetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    gradient: {
      type: "t",
      value: gradient_texture
    },
    reaction: {
      type: "t",
      value: reaction_texture
    },
    amplitude: {
      type: "float",
      value: getAmplitude()
    },
    noise_reaction_balance: {
      type: "float",
      value: input.noise_reaction_balance
    }
  },
  vertexShader: require('./shaders/planet-vert.glsl'),
  fragmentShader: require('./shaders/planet-frag.glsl'),
  lights: false
});

var cloudMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: {
      type: "float",
      value: currTime
    },
    cloud_density: {
      type: "float",
      value: input.cloud_density
    },
    cloud_speed: {
      type: "float",
      value: input.cloud_speed
    },
    cloud_color: {
      type: "v3",
      value: new THREE.Color(input.cloud_color)
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

  //solarSystem = new List();

  // create geometry and add it to the scene
  var planet_geom = new THREE.IcosahedronBufferGeometry(input.radius, 5);
  var planet_mesh = new THREE.Mesh(planet_geom, planetMaterial);
  //solarSystem.append(planet_mesh);
  scene.add(planet_mesh);

  //create cloud geometry and add to scene
  var cloud_geom = new THREE.IcosahedronBufferGeometry(getCloudRadius(), 5);
  var cloud_mesh = new THREE.Mesh(cloud_geom, cloudMaterial);
  if (input.cloud_visibility) {
    scene.add(cloud_mesh);
  }

  // set camera position
  camera.position.set(15, 15, 400);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // set scene background
  scene.background = background_texture;


  // PLANET CONTROLS
  var planetFolder = gui.addFolder('planet');

  // add a slider to let user change radius of icosahedron
  planetFolder.add(input, 'radius', 100, 200).onChange(function (newVal) {
    var detail = planet_mesh.geometry.parameters.detail;
    scene.remove(planet_mesh);
    planet_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(newVal, detail), planetMaterial);
    planetMaterial.uniforms.amplitude.value = getAmplitude();
    scene.add(planet_mesh);


    scene.remove(cloud_mesh);
    cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(getCloudRadius(), detail), cloudMaterial);
    if (input.cloud_visibility) {
      scene.add(cloud_mesh);
    }
    renderer.render(scene, camera);
  });

  // add a slider to let user change balance between noise and reaction diffusion
  planetFolder.add(input, 'noise_reaction_balance', 0, 1).onChange(function () {
    planetMaterial.uniforms.noise_reaction_balance.value = input.noise_reaction_balance;
    renderer.render(scene, camera);
  });

  // add a slider to let user change balance between noise and reaction diffusion
  planetFolder.add(input, 'amplitude', 0, 30).onChange(function () {
    // planetMaterial.uniforms.amplitude.value = getAmplitude();
    planetMaterial.uniforms.amplitude.value = getAmplitude();
    var detail = cloud_mesh.geometry.parameters.detail;

    scene.remove(cloud_mesh);
    cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(getCloudRadius(), detail), cloudMaterial);
    if (input.cloud_visibility) {
      scene.add(cloud_mesh);
    }
    renderer.render(scene, camera);
  });


  // CLOUD CONTROLS
  var cloudsFolder = gui.addFolder('clouds');

  // add a slider to let user change balance between noise and reaction diffusion
  cloudsFolder.add(input, 'cloud_density', 0, 1).onChange(function () {
    cloudMaterial.uniforms.cloud_density.value = input.cloud_density;
    renderer.render(scene, camera);
  });

  cloudsFolder.add(input, 'cloud_speed', 0, 1).step(.1).onChange(function () {
    cloudMaterial.uniforms.cloud_speed.value = input.cloud_speed;
    renderer.render(scene, camera);
  });

  cloudsFolder.addColor(input, 'cloud_color').onChange(function () {
    cloudMaterial.uniforms.cloud_color.value = new THREE.Color(input.cloud_color);
    renderer.render(scene, camera);
  });

  // add a checkbox to toggle cloud visibility
  cloudsFolder.add(input, 'cloud_visibility').onChange(function () {
    input.cloud_visibility ? scene.add(cloud_mesh) : scene.remove(cloud_mesh);
  });


  // COLOR CONTROLS
  var gradientFolder = planetFolder.addFolder('planet_gradient');

  for (var i = 1; i <= getColors().length; i++) {
    var color = "color" + i;
    gradientFolder.addColor(input, color).onChange(function () {
      gradient_texture = Gradient.getTexture(getColors());
      gradient_texture.needsUpdate = true;
      planetMaterial.uniforms.gradient.value = gradient_texture;
      renderer.render(scene, camera);
    });
  }
  renderer.render(scene, camera);
}

function getAmplitude() {
  return input.amplitude > input.radius * 0.5 ? input.radius * 0.5 : input.amplitude;
}

function getCloudRadius() {
  return input.radius + getAmplitude() * 0.65;
}

function getColors() {
  return [new THREE.Color(input.color1),
  new THREE.Color(input.color2),
  new THREE.Color(input.color3),
  new THREE.Color(input.color4),
  new THREE.Color(input.color5)];
}

// called on frame updates
function onUpdate() {
  currTime += 0.03;
  cloudMaterial.uniforms.time.value = currTime;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);