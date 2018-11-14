varying float noise;
uniform sampler2D image;
varying vec4 f_position;
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
	vec4 color = vec4(1, 1, 1, 1);//texture2D( image, vec2(1, noise));
    
    
    // terrain noise calculation
    float summedNoise = 0.0;
    float amplitude = 40.0;//u_mountainHeight;
    float val;
    
    for ( int i = 2; i <= 64; i += 2 ) {
    
        vec3 pos = vec3(f_position) *.05 * float(i);
        val = trilinearInterpolation(pos);
        summedNoise += val * amplitude;
        amplitude *= .5;
        
    }
  

    val =  summedNoise  * .3;
    vec4 offsetPos = vec4(val * f_position.rgb, 0.0);
    float offset = val;

    // water noise calculation (add in time later)
    vec3 cloudPos = vec3(f_position * .05) * 16.0 * ((sin(time * .002) + 2.0)/4.0);
    float cloudNoise = trilinearInterpolation(cloudPos * .1);
    
    
    
	gl_FragColor = vec4( color.rgb + noise, cloudNoise + .2);
    //gl_FragColor = vec4(cloudNoise, 0, 1, 1);
}