varying float noise;
uniform float cloud_density;

void main() {
    gl_FragColor = vec4(1, 1, 1, 1);
    float inv = 1.0 - cloud_density;
    gl_FragColor.a = noise > inv ? noise > inv + 0.05 ? noise : noise - 0.3 : 0.001;
}