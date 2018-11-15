varying float height;
uniform sampler2D gradient;

void main() {
	gl_FragColor = texture2D(gradient, vec2(1, height));
}