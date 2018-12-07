const THREE = require('three');
import Reaction from './reaction'
import Gradient from './gradient'

function Planet(mass, radius, position, velocity, scale, numPlanets) {
    var planet = this;

    planet.mass = mass;
    planet.radius = radius;
    planet.position = new THREE.Vector3(0, 0, 0);
    planet.velocity = new THREE.Vector3(0, 0, 0);
    planet.name = "planet" + numPlanets;
    planet.orbitPos = position;
    planet.orbitVel = velocity;

    planet.input = {
        cloud_visibility: true,
        amplitude: radius / 20.0 * 0.25,
        radius: radius / 20.0,
        cloud_density: 0.43,
        cloud_speed: .3,
        cloud_color: '#ffffff',
        color1: '#130c8c',
        color2: '#0d1faa',
        color3: '#0d6823', //'#19680e',
        color4: '#5f691a', //'#a79300',
        color5: '#503e06', //'#caa62f',
        preset: 'earth'
    };

    planet.reaction_texture = Reaction.getTexture();
    planet.reaction_texture.needsUpdate = true;

    planet.getColors = function () {
        return [new THREE.Color(planet.input.color1),
        new THREE.Color(planet.input.color2),
        new THREE.Color(planet.input.color3),
        new THREE.Color(planet.input.color4),
        new THREE.Color(planet.input.color5)];
    }

    planet.getAmplitude = function () {
        return planet.input.amplitude > planet.input.radius * 0.5 ? planet.input.radius * 0.5 : planet.input.amplitude;
    }

    planet.getCloudRadius = function () {
        return planet.input.radius + planet.getAmplitude() * 0.35;
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


    
    planet.updatePosition = function () {
        position = planet.position;
        planet.planet_mesh.position.set(
            position.x / scale,
            position.y / scale,
            position.z / scale);
        planet.cloud_mesh.position.set(
            position.x / scale,
            position.y / scale,
            position.z / scale);
    }

    planet.addPlanet = function (scene) {
        planet.updatePosition();
        scene.add(planet.planet_mesh);
        if (planet.input.cloud_visibility) {
            scene.add(planet.cloud_mesh);
        }
    }



    planet.rlow = planet.input.radius * 0.9;
    planet.rhigh = planet.input.radius * 1.1;

    planet.alow = 0;
    planet.ahigh = planet.input.amplitude * 1.5;

    planet.addControls = function (scene, camera, renderer, gui, orbiting) {
        // PLANET CONTROLS
        var planetFolder = gui.addFolder(planet.name);

        planetFolder.add(planet.input, 'radius', planet.rlow, planet.rhigh).onChange(function (newVal) {
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
            planet.updatePosition();
            renderer.render(scene, camera);
        });

        planetFolder.add(planet.input, 'amplitude', planet.alow, planet.ahigh).onChange(function () {
            planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
            var detail = planet.cloud_mesh.geometry.parameters.detail;

            scene.remove(planet.cloud_mesh);
            planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), detail), planet.cloudMaterial);
            if (planet.input.cloud_visibility) {
                scene.add(planet.cloud_mesh);
            }
            planet.updatePosition();
            renderer.render(scene, camera);
        });

       

        // COLOR CONTROLS
        var gradientFolder = planetFolder.addFolder(planet.name + '_gradient');

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
        var cloudsFolder = planetFolder.addFolder(planet.name + '_clouds');

        // add a checkbox to toggle cloud visibility
        cloudsFolder.add(planet.input, 'cloud_visibility').onChange(function () {
            planet.updatePosition();
            planet.input.cloud_visibility ? scene.add(planet.cloud_mesh) : scene.remove(planet.cloud_mesh);
        });

        cloudsFolder.add(planet.input, 'cloud_density', 0, .6).onChange(function () {
            planet.cloudMaterial.uniforms.cloud_density.value = planet.input.cloud_density;
            renderer.render(scene, camera);
        });

        cloudsFolder.add(planet.input, 'cloud_speed', 0, 1).step(.1).onChange(function () {
            planet.cloudMaterial.uniforms.cloud_speed.value = planet.input.cloud_speed;
            renderer.render(scene, camera);
        });

        cloudsFolder.addColor(planet.input, 'cloud_color').onChange(function () {
            planet.cloudMaterial.uniforms.cloud_color.value = new THREE.Color(planet.input.cloud_color);
            renderer.render(scene, camera);
        });

        



        //presets
        var presetFolder = planetFolder.addFolder(planet.name + '_presets');

        presetFolder.add(planet.input, 'preset', ['earth', 'gas_giant', 'terrestrial']).onChange(function (val) {
            if(!orbiting) {
                if(val == 'earth') {
                    //medium atmosphere
                    planet.input.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_density.value = .43;
                    planet.input.cloud_density = .43;
                    planet.cloudMaterial.uniforms.cloud_speed.value = .3;
                    planet.input.cloud_speed = .3;

                    //medium radius
                    planet.input.radius = 300;
                    scene.remove(planet.planet_mesh);
                    var mesh_detail = planet.planet_mesh.geometry.parameters.detail;
                    planet.planet_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.input.radius, mesh_detail), planet.planetMaterial);
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    scene.add(planet.planet_mesh);

                    //medium amplitude
                    planet.input.amplitude = 90;
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    var cloud_detail = planet.cloud_mesh.geometry.parameters.detail;
                    scene.remove(planet.cloud_mesh);
                    planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), cloud_detail), planet.cloudMaterial);
                    if (planet.input.cloud_visibility) {
                        scene.add(planet.cloud_mesh);
                    }
                    planet.updatePosition();
                
                    //blue/green/brown color
                    planet.input.color1 = '#130c8c';
                    planet.input.color2 = '#0d1faa';
                    planet.input.color3 = '#0d6823';
                    planet.input.color4 = '#5f691a';
                    planet.input.color5 = '#503e06';
                    planet.gradient_texture = Gradient.getTexture(planet.getColors());
                    planet.gradient_texture.needsUpdate = true;
                    planet.planetMaterial.uniforms.gradient.value = planet.gradient_texture;

                     //cloud color
                     planet.input.cloud_color = '#ffffff'
                     planet.cloudMaterial.uniforms.cloud_color.value = new THREE.Color(planet.input.cloud_color);


                    //medium distance from sun
                    planet.orbitPos = new THREE.Vector3(1.496e11, 0, 0); 
                    planet.orbitVel = new THREE.Vector3(0, 1.490e04, 0);
                    planet.mass = 5.974e24;
                    planet.radius = 6.371e3;
                }

                //densest atmosphere, far from sun, blue in color, largest radius, low amplitude
                if(val == 'gas_giant') {
                    //dense atmosphere
                    planet.input.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_density.value = .6;
                    planet.input.cloud_density = .7;
                    planet.cloudMaterial.uniforms.cloud_speed.value = 1;
                    planet.input.cloud_speed = 1;

                    //big radius
                    planet.input.radius = 350;
                    scene.remove(planet.planet_mesh);
                    var mesh_detail = planet.planet_mesh.geometry.parameters.detail;
                    planet.planet_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.input.radius, mesh_detail), planet.planetMaterial);
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    scene.add(planet.planet_mesh);
        
                    //low amplitude
                    planet.input.amplitude = 0;
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    var cloud_detail = planet.cloud_mesh.geometry.parameters.detail;
                    scene.remove(planet.cloud_mesh);
                    planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), cloud_detail), planet.cloudMaterial);
                    if (planet.input.cloud_visibility) {
                        scene.add(planet.cloud_mesh);
                    }
                    planet.updatePosition();

                    //blue color
                    planet.input.color1 = '#130c8c';
                    planet.input.color2 = '#0d1faa';
                    planet.input.color3 = '#281ec3';
                    planet.input.color4 = '#0f0975';
                    planet.input.color5 = '#2e41ca';
                    planet.gradient_texture = Gradient.getTexture(planet.getColors());
                    planet.gradient_texture.needsUpdate = true;
                    planet.planetMaterial.uniforms.gradient.value = planet.gradient_texture;

                    //cloud color
                    planet.input.cloud_color = '#78c7ff'
                    planet.cloudMaterial.uniforms.cloud_color.value = new THREE.Color(planet.input.cloud_color);
                

                    //far from sun
                    planet.orbitPos = new THREE.Vector3(3.279e11, 0, 0); 
                    planet.orbitVel = new THREE.Vector3(0, 1.205e04, 0);
                    planet.mass = 6.419e23;
                    planet.radius = 7.390e3;
                }

                //no atmosphere, closest to sun, red in color, smallest radius, high amplitude
                else if(val == "terrestrial") {
                    //no atmosphere
                    planet.input.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_visibility = true;
                    planet.cloudMaterial.uniforms.cloud_density.value = 0;
                    planet.input.cloud_density = 0;

                    //small radius
                    planet.input.radius = 250;
                    scene.remove(planet.planet_mesh);
                    var mesh_detail = planet.planet_mesh.geometry.parameters.detail;
                    planet.planet_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.input.radius, mesh_detail), planet.planetMaterial);
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    scene.add(planet.planet_mesh);

                    //high amplitude
                    planet.input.amplitude = 120;
                    planet.planetMaterial.uniforms.amplitude.value = planet.getAmplitude();
                    var cloud_detail = planet.cloud_mesh.geometry.parameters.detail;
                    scene.remove(planet.cloud_mesh);
                    planet.cloud_mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(planet.getCloudRadius(), cloud_detail), planet.cloudMaterial);
                    if (planet.input.cloud_visibility) {
                        scene.add(planet.cloud_mesh);
                    }
                    planet.updatePosition();

                    //red color
                    planet.input.color1 = '#72290b';
                    planet.input.color2 = '#b64c20';
                    planet.input.color3 = '#723409';
                    planet.input.color4 = '#521d00';
                    planet.input.color5 = '#4a0501';
                    planet.gradient_texture = Gradient.getTexture(planet.getColors());
                    planet.gradient_texture.needsUpdate = true;
                    planet.planetMaterial.uniforms.gradient.value = planet.gradient_texture;

                     //cloud color
                     planet.input.cloud_color = '#ffffff'
                     planet.cloudMaterial.uniforms.cloud_color.value = new THREE.Color(planet.input.cloud_color);

                    //close to sun
                    planet.orbitPos = new THREE.Vector3(5.790e10, 0, 0); 
                    planet.orbitVel = new THREE.Vector3(0, 2.395e04, 0);
                    planet.mass = 3.302e23;
                    planet.radius = 2.240e3;
                }
                renderer.render(scene, camera);
            }
        });


    }

    planet.removeControls = function (gui) {
        gui.removeFolder("planet");
        gui.removeFolder("clouds");
    }



    planet.updateTime = function (time) {
        planet.cloudMaterial.uniforms.time.value = time;
    }

    planet.distanceToVector = function (b) {
        return new THREE.Vector3(
            b.position.x - planet.position.x,
            b.position.y - planet.position.y,
            b.position.z - planet.position.z);
    }

    planet.distanceToValue = function (b) {
        return planet.distanceToVector(b).length();
    }

    planet.forceValue = function (b) {
        var dist = planet.distanceToValue(b);
        if (dist == 0.0) {
            return new THREE.Vector3();
        }
        return (6.67e-11 * planet.mass * b.mass) / (dist * dist);
    }

    planet.forceVector = function (b) {
        return planet.distanceToVector(b).multiplyScalar(
            planet.forceValue(b) / planet.distanceToValue(b));
    }

    planet.incrementPosition = function (dt) {
        planet.position.add(new THREE.Vector3(
            planet.velocity.x * dt,
            planet.velocity.y * dt,
            planet.velocity.z * dt));
        planet.updatePosition();
    }

    planet.getAffectedBy = function (b, dt) {
        planet.velocity.add(planet.forceVector(b).multiplyScalar(dt / planet.mass));
    }

    return this;
}

export default {
    Planet: Planet
}