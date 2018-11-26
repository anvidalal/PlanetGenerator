const THREE = require('three');
import Reaction from './reaction'
import Gradient from './gradient'

function Planet() {
    var planet = this;
    
    planet.input = {
        cloud_visibility: true,
        noise_reaction_balance: 0.45,
        amplitude: 20.0,
        radius: 50.0,
        cloud_density: 0.5,
        cloud_speed: .3,
        cloud_color: '#ffffff',
        color1: '#130c8c',
        color2: '#0d1faa',
        color3: '#19680e',
        color4: '#a79300',
        color5: '#caa62f'
    };

    planet.reaction_texture = Reaction.getTexture();
    planet.reaction_texture.needsUpdate = true;

    planet.getColors = function() {
        return [new THREE.Color(planet.input.color1),
        new THREE.Color(planet.input.color2),
        new THREE.Color(planet.input.color3),
        new THREE.Color(planet.input.color4),
        new THREE.Color(planet.input.color5)];
    }

    planet.getAmplitude = function() {
        return planet.input.amplitude > planet.input.radius * 0.5 ? planet.input.radius * 0.5 : planet.input.amplitude;
    }

    planet.getCloudRadius = function() {
        return planet.input.radius + planet.getAmplitude() * 0.65;
    }

    planet.gradient_texture = Gradient.getTexture(planet.getColors());
    planet.gradient_texture.needsUpdate = true;

    planet.planetMaterial = new THREE.ShaderMaterial({
        uniforms: {
            gradient: {
                type: "t",
                value: planet.gradient_texture
            },
            reaction: {
                type: "t",
                value: planet.reaction_texture
            },
            amplitude: {
                type: "float",
                value: planet.getAmplitude()
            },
            noise_reaction_balance: {
                type: "float",
                value: planet.input.noise_reaction_balance
            }
        },
        vertexShader: require('./shaders/planet-vert.glsl'),
        fragmentShader: require('./shaders/planet-frag.glsl'),
        lights: false
    });

    planet.cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: {
                type: "float",
                value: 0
            },
            cloud_density: {
                type: "float",
                value: planet.input.cloud_density
            },
            cloud_speed: {
                type: "float",
                value: planet.input.cloud_speed
            },
            cloud_color: {
                type: "v3",
                value: new THREE.Color(planet.input.cloud_color)
            }
        },
        vertexShader: require('./shaders/cloud-vert.glsl'),
        fragmentShader: require('./shaders/cloud-frag.glsl'),
        transparent: true,
        lights: false
    });

    var planet_geom = new THREE.IcosahedronBufferGeometry(planet.input.radius, 5);
    planet.planet_mesh = new THREE.Mesh(planet_geom, planet.planetMaterial);

    var cloud_geom = new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), 5);
    planet.cloud_mesh = new THREE.Mesh(cloud_geom, planet.cloudMaterial);

    planet.setPosition = function(position) {
        planet.position = position;
        planet.planet_mesh.position.set(position.x, position.y, position.z);
        planet.cloud_mesh.position.set(position.x, position.y, position.z);
    }

    planet.addPlanet = function(scene, position) {
        planet.setPosition(position);
        scene.add(planet.planet_mesh);
        if (planet.input.cloud_visibility) {
            scene.add(planet.cloud_mesh);
        }
    }

    planet.addControls = function(scene, camera, renderer, gui) {
        // PLANET CONTROLS
        var planetFolder = gui.addFolder('planet');

        // add a slider to let user change radius of icosahedron
        planetFolder.add(planet.input, 'radius', 20, 100).onChange(function (newVal) {
            var detail = planet.planet_mesh.geometry.parameters.detail;
            scene.remove(planet.planet_mesh);
            planet.planet_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(newVal, detail), planet.planetMaterial);
            planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
            scene.add(planet.planet_mesh);


            scene.remove(planet.cloud_mesh);
            planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), detail), planet.cloudMaterial);
            if (planet.input.cloud_visibility) {
                scene.add(planet.cloud_mesh);
            }
            planet.setPosition(planet.position);
            renderer.render(scene, camera);
        });

        // add a slider to let user change balance between noise and reaction diffusion
        planetFolder.add(planet.input, 'noise_reaction_balance', 0, 1).onChange(function () {
            planet.planetMaterial.uniforms.noise_reaction_balance.value = planet.input.noise_reaction_balance;
            renderer.render(scene, camera);
        });

        // add a slider to let user change balance between noise and reaction diffusion
        planetFolder.add(planet.input, 'amplitude', 0, 30).onChange(function () {
            // planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
            planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
            var detail = planet.cloud_mesh.geometry.parameters.detail;

            scene.remove(planet.cloud_mesh);
            planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), detail), planet.cloudMaterial);
            if (planet.input.cloud_visibility) {
                scene.add(planet.cloud_mesh);
            }
            planet.setPosition(planet.position);
            renderer.render(scene, camera);
        });

        // COLOR CONTROLS
        var gradientFolder = planetFolder.addFolder('planet_gradient');

        for (var i = 1; i <= planet.getColors().length; i++) {
            var color = "color" + i;
            gradientFolder.addColor(planet.input, color).onChange(function () {
                planet.gradient_texture = Gradient.getTexture(planet.getColors());
                planet.gradient_texture.needsUpdate = true;
                planet.planetMaterial.uniforms.gradient.value = planet.gradient_texture;
                renderer.render(scene, camera);
            });
        }

        // CLOUD CONTROLS
        var cloudsFolder = gui.addFolder('clouds');

        // add a slider to let user change balance between noise and reaction diffusion
        cloudsFolder.add(planet.input, 'cloud_density', 0, 1).onChange(function () {
            planet.cloudMaterial.uniforms.cloud_density.value = planet.input.cloud_density;
            renderer.render(scene, camera);
        });

        cloudsFolder.add(planet.input, 'cloud_speed', 0, 2).onChange(function () {
            planet.cloudMaterial.uniforms.cloud_speed.value = planet.input.cloud_speed;
            renderer.render(scene, camera);
        });

        cloudsFolder.addColor(planet.input, 'cloud_color').onChange(function () {
            planet.cloudMaterial.uniforms.cloud_color.value = new THREE.Color(planet.input.cloud_color);
            renderer.render(scene, camera);
        });

        // add a checkbox to toggle cloud visibility
        cloudsFolder.add(planet.input, 'cloud_visibility').onChange(function () {
            planet.setPosition(planet.position);
            planet.input.cloud_visibility ? scene.add(planet.cloud_mesh) : scene.remove(planet.cloud_mesh);
        });
    }

    planet.removeControls = function(gui) {
        gui.removeFolder("planet");
        gui.removeFolder("clouds");
    }

    planet.updateTime = function(time) {
        planet.cloudMaterial.uniforms.time.value = time;
    }
    return this;
}

export default {
    Planet: Planet
}