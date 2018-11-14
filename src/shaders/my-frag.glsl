varying float noise;
varying float react;
uniform sampler2D image;



void main() {
	vec4 color = texture2D( image, vec2(1, react));
	gl_FragColor = vec4( color.rgb, 1.0 );

}