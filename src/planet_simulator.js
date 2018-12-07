const THREE = require('three');
import Planet from './planet'

function Space() {
    var space = this;
    var numPlanets = 0;

    space.scale = 2.50e+7;
    space.timeStep = 25000.0;//2500.0;

    //  name                          mass    radius                position                                      velocity                              scale
    var sun     = new Planet.Planet(1.989e30, 6.950e5, new THREE.Vector3(0.000e00, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 0.000e00, 0.000e00), space.scale, 0);
    //var mercury = new Planet.Planet(3.302e23, 2.440e3, new THREE.Vector3(5.790e10, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 2.395e04, 0.000e00), space.scale);
    //var venus   = new Planet.Planet(4.869e24, 6.052e3, new THREE.Vector3(1.082e11, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 1.750e04, 0.000e00), space.scale);
    var earth   = new Planet.Planet(5.974e24, 6.371e3, new THREE.Vector3(1.496e11, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 1.490e04, 0.000e00), space.scale, 1);
    
    
    //var mars    = new Planet.Planet(6.419e23, 3.390e3, new THREE.Vector3(2.279e11, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 1.205e04, 0.000e00), space.scale);

    space.bodies = []; 

    space.initializePlanets = function (scene, camera, renderer, gui, orbiting) {
        space.bodies[0] = sun;
        space.bodies[1] = earth;
        numPlanets = 2;

        for (var i = 1; i < space.bodies.length; i++) { 
            space.bodies[i].addPlanet(scene);

            // add controls for planet
            space.bodies[i].addControls(scene, camera, renderer, gui, orbiting);
        }
    }

    space.addNewPlanet = function (scene, camera, renderer, gui, orbiting) {
        if(numPlanets < 5) {
            var newPlanet = new Planet.Planet(4.869e24, 6.052e3, new THREE.Vector3(1.082e11, 0.000e00, 0.000e00), new THREE.Vector3(0.000e00, 1.750e04, 0.000e00), space.scale, numPlanets);
            space.bodies[numPlanets] = newPlanet;

            space.bodies[numPlanets].addPlanet(scene);

            //controls
            space.bodies[numPlanets].addControls(scene, camera, renderer, gui, orbiting);

            numPlanets++;
        }

    }

  

    space.updateTime = function (time) {
        for (var i = 0; i < space.bodies.length; i++) {
            if(space.bodies[i]) {
                space.bodies[i].updateTime(time);
            }
        }
    }

    space.simulate = function (orbiting, camera) {
        if(orbiting) {
            for (var i = 0; i < space.bodies.length; i++) {
                for (var j = 0; j < space.bodies.length; j++) {
                    if (i == j) {
                        continue;
                    }
                    space.bodies[i].getAffectedBy(space.bodies[j], space.timeStep);
                }
            }
            for (var i = 0; i < space.bodies.length; i++) {
                space.bodies[i].incrementPosition(space.timeStep);
            }
        }
        
        
    }
}

export default {
    Space: Space
}