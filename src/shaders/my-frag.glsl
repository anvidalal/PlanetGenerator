varying float height;
uniform sampler2D image;

void main() {
	gl_FragColor = texture2D(image, vec2(1, height));
}