varying float height;
uniform float amplitude;

uniform sampler2D reaction;
float M_PI = 3.14159265359;

float noise_gen(vec3 pos)
{
  return fract(sin(dot(pos, vec3(12.9898, 78.233, 39.73))) * 43758.545);
}

float lerp(float a, float b, float t)
{
  return a * (1.0 - t) + b * t;
}

float cerp(float a, float b, float t) {
  float cos_t = (1.0 - cos(t * M_PI)) * 0.5;
  return a * (1.0 - cos_t) + b * cos_t;
}

float smooth(vec3 pos, float fq)
{
	float r = 1.0 / fq;
	return (noise_gen(pos + vec3(r, r, r)) + noise_gen(pos + vec3(- r, r, r))
		+ noise_gen(pos + vec3(r,- r, r)) + noise_gen(pos + vec3(- r,- r, r))
		+ noise_gen(pos + vec3(r, r,- r)) + noise_gen(pos + vec3(- r, r,- r))
		+ noise_gen(pos + vec3(r, - r,- r)) + noise_gen(pos + vec3(- r,- r,- r))) / 8.0;
}

float noise_interpolate(vec3 pos, float fq)
{
  pos *= 0.2;

  vec3 a = vec3(floor(pos.x), ceil(pos.y), ceil(pos.z));
  vec3 b = vec3(ceil(pos.x), ceil(pos.y), ceil(pos.z));
  vec3 c = vec3(floor(pos.x), floor(pos.y), ceil(pos.z));
  vec3 d = vec3(ceil(pos.x), floor(pos.y), ceil(pos.z));

  vec3 e = vec3(floor(pos.x), ceil(pos.y), floor(pos.z));
  vec3 f = vec3(ceil(pos.x), ceil(pos.y), floor(pos.z));
  vec3 g = vec3(floor(pos.x), floor(pos.y), floor(pos.z));
  vec3 h = vec3(ceil(pos.x), floor(pos.y), floor(pos.z));

  float ab = cerp(smooth(a, fq), smooth(b, fq), fract(pos.x));
  float cd = cerp(smooth(c, fq), smooth(d, fq), fract(pos.x));
  float abcd = cerp(cd, ab, fract(pos.y));

  float ef = cerp(smooth(e, fq), smooth(f, fq), fract(pos.x));
  float gh = cerp(smooth(g, fq), smooth(h, fq), fract(pos.x));
  float efgh = cerp(gh, ef, fract(pos.y));

  return cerp(efgh, abcd, fract(pos.z));
}

float pnoise(vec3 pos)
{
	float total = 0.0;

	for (int i = 0; i < 16; ++i)
	{
		float fq = pow(2.0, float(i));
		float a = pow(0.61, float(i));

		total += noise_interpolate(pos, fq) * a;
	}
	return total;
}

void main() {
	float noise = clamp((pnoise(position) - 1.1) * 2.5, 0.0, 1.0);
  float react = clamp((texture2D( reaction, uv)).r - 0.2, 0.0, 1.0);
  float moisture = noise * react;

  float noise_contribution = 0.4;

  // preventing stitch
  if (uv.x < 0.05 || uv.x > 0.95 || uv.y < 0.05 || uv.y > 0.95) {
    float m = (max(abs(uv.x - 0.5), abs(uv.y - 0.5)) - 0.45) / 0.05;
    noise_contribution += (1.0 - noise_contribution) * m;
	}
  if (uv.x < 0.01 || uv.x > 0.99 || uv.y < 0.01 || uv.y > 0.99) {
    noise_contribution = 1.0;
	}

  if (react < 0.3) {
    noise_contribution = 0.1;
  }

  height = lerp(react, noise, noise_contribution);
  float elevation = height / 2.0;

  if (height < 0.8) {
    elevation *= 0.7;
  }
  if (height < 0.3) {
    elevation = 0.2;
  }
  if (moisture < 0.3) {
    height = lerp(height, moisture, 0.3);
  }

  vec3 p = position + amplitude * elevation * normalize(normal);
  height = clamp(height + 0.1, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
}