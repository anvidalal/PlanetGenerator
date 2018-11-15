varying float noise;
uniform sampler2D image;
uniform float time;

// Return a random direction in a circle
vec3 random3(vec3 p) {
    return normalize(2.0 * fract(sin(vec3(dot(p,vec3(127.1,311.7, 217.4)),
    dot(p,vec3(269.5,183.3, 359.2)), 
    dot(p,vec3(171.1,513.3, 237.9))))*43758.5453) - 1.0);
}

// calculates the Perlin noise value for a point p given a nearby gridpoint
float perlin(vec3 p, vec3 gridPoint) {
    vec3 gradient = random3(gridPoint);
    vec3 toP = p - gridPoint;
    return dot(toP, gradient);
}

// takes in a position p, calculates the 8 grid points surrounding that position, calculates the 3D Perlin noise
// value at each of the 8 grid points, and uses trilinear interpolation to find the final Perlin noise value for p
float trilinearInterpolation(vec3 pos) {
    float tx = smoothstep(0.0, 1.0, fract(pos.x));
    float ty = smoothstep(0.0, 1.0, fract(pos.y));
    float tz = smoothstep(0.0, 1.0, fract(pos.z));

    vec3 bottomBackLeft = floor(vec3(pos));
    vec3 topBackLeft =      vec3(bottomBackLeft.x,        bottomBackLeft.y + 1.0, bottomBackLeft.z);
    vec3 topBackRight =     vec3(bottomBackLeft.x + 1.0, bottomBackLeft.y + 1.0, bottomBackLeft.z);
    vec3 bottomBackRight =  vec3(bottomBackLeft.x + 1.0, bottomBackLeft.y,        bottomBackLeft.z);
    vec3 bottomFrontLeft =  vec3(bottomBackLeft.x,        bottomBackLeft.y,        bottomBackLeft.z + 1.0);
    vec3 topFrontLeft =     vec3(bottomBackLeft.x,        bottomBackLeft.y + 1.0, bottomBackLeft.z + 1.0);
    vec3 topFrontRight =    vec3(bottomBackLeft.x + 1.0, bottomBackLeft.y + 1.0, bottomBackLeft.z + 1.0);
    vec3 bottomFrontRight = vec3(bottomBackLeft.x + 1.0, bottomBackLeft.y,        bottomBackLeft.z + 1.0);


    float bbl = perlin(vec3(pos), bottomBackLeft); 
    float tbl = perlin(vec3(pos), topBackLeft);
    float tbr = perlin(vec3(pos), topBackRight);
    float bbr = perlin(vec3(pos), bottomBackRight);
    float bfl = perlin(vec3(pos), bottomFrontLeft);
    float tfl = perlin(vec3(pos), topFrontLeft); 
    float tfr = perlin(vec3(pos), topFrontRight); 
    float bfr = perlin(vec3(pos), bottomFrontRight);

    //trilinear interpolation of 8 perlin noise values
    float tfbr = tfr * (tz) + tbr * (1.0 - tz);
    float tfbl = tbl * (1.0 - tz) + tfl * tz;
    float bfbl = bbl * (1.0 - tz) + bfl * tz;
    float bfbr = bfr * (tz) + bbr * (1.0 - tz);

    float top = tfbl * (1.0 - tx) + tfbr * tx;
    float bottom = bfbl * (1.0 - tx) + bfbr * tx;

    return top * (ty) + bottom * (1.0 - ty);
}


void main() {
	vec4 color = vec4(1, 1, 1, 1);
    
    
    float amplitude = 40.0;//u_mountainHeight;

    if(noise * amplitude > 47.0) {
        //clouds
        gl_FragColor = vec4(color.rgb, noise - .7);
    }
    else if(noise * amplitude > 45.0) {
        gl_FragColor = vec4(color.rgb, noise - .9);
    }
    else {
        //no clouds
        gl_FragColor = vec4(color.rgb, .001);
    }

}