import {
  AmbientLight, DirectionalLight,
  MathUtils, Mesh, MeshLambertMaterial, OrthographicCamera, PlaneGeometry,
  Scene, ShaderMaterial, RepeatWrapping, SphereGeometry, SRGBColorSpace, TextureLoader,
  WebGLRenderer,
} from 'three';

export const globeTexture = '/white-dust-blue-marble.webp';

export async function createEarth(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const texture = await new TextureLoader().loadAsync(globeTexture);
  if (signal.aborted) {
    texture.dispose();
    signal.throwIfAborted();
  }
  texture.colorSpace = SRGBColorSpace;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    texture.dispose();
    throw error;
  }

  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  texture.wrapS = RepeatWrapping;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 20);
  camera.position.set(0, 5 * Math.sin(MathUtils.degToRad(22)), 5 * Math.cos(MathUtils.degToRad(22)));
  camera.lookAt(0, 0, 0);

  const globeGeometry = new SphereGeometry(1, 96, 64);
  const globeMaterial = new MeshLambertMaterial({ map: texture });
  const globe = new Mesh(globeGeometry, globeMaterial);
  scene.add(globe, new AmbientLight(0xffffff, 1.25));

  const key = new DirectionalLight(0xffffff, 1.55);
  key.position.set(-2, 3, 4);
  scene.add(key);

  // One camera-facing pass. Mask the center before evaluating the noise.
  const hazeGeometry = new PlaneGeometry(2.4, 2.4);
  const hazeMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec2 positionOnPlane;
      void main() {
        positionOnPlane = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 positionOnPlane;
      uniform float time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(cell), hash(cell + vec2(1, 0)), f.x),
                   mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1, 1)), f.x), f.y);
      }

      void main() {
        vec2 p = positionOnPlane;
        float radius = length(p);
        if (radius < 0.77 || abs(p.x) > 1.19 || abs(p.y) > 1.19) discard;

        float sides = smoothstep(0.17, 0.83, abs(p.x));
        float pockets = max(sides * (1.0 - smoothstep(0.1, 0.66, p.y)),
                            0.65 * (1.0 - smoothstep(-0.98, -0.46, p.y)));
        float edge = 1.0 - smoothstep(1.08, 1.19, max(abs(p.x), abs(p.y)));
        float drift = time * 0.035;
        vec2 broad = p * vec2(3.6, 8.0) + vec2(drift, -0.25 * drift);
        float warp = noise(broad * 0.48);
        float billow = 0.72 * noise(broad + vec2(warp, -warp * 2.0))
                     + 0.28 * noise(broad * 2.1 - vec2(drift * 0.7, 0.0));
        float fine = noise(p * vec2(6.5, 13.0) + vec2(-drift * 0.9, drift * 0.27 + warp));
        float inner = smoothstep(0.77, 1.02, radius) * (1.0 - smoothstep(1.04, 1.20, radius));
        float outer = smoothstep(0.98, 1.14, radius) * (1.0 - smoothstep(1.17, 1.37, radius));
        float light = inner * smoothstep(0.24, 0.78, billow) * 0.50;
        float shade = outer * smoothstep(0.23, 0.76, fine) * 0.29;
        vec3 color = mix(vec3(0.61, 0.62, 0.63), vec3(0.97), light / max(light + shade, 0.001));
        gl_FragColor = vec4(color, (light + shade) * pockets * edge);
      }
    `,
  });
  const haze = new Mesh(hazeGeometry, hazeMaterial);
  haze.quaternion.copy(camera.quaternion);
  haze.renderOrder = 1;
  scene.add(haze);

  return {
    resize(size: number, pixelRatio: number) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size, size, false);
    },
    render(seconds: number, yaw: number, pitch: number) {
      globe.rotation.set(pitch, MathUtils.degToRad(-136) + yaw, 0, 'XYZ');
      hazeMaterial.uniforms.time.value = seconds;
      renderer.render(scene, camera);
    },
    dispose() {
      globeGeometry.dispose();
      globeMaterial.dispose();
      hazeGeometry.dispose();
      hazeMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
