import {
  AmbientLight, DirectionalLight,
  MathUtils, Mesh, MeshLambertMaterial, OrthographicCamera,
  Scene, RepeatWrapping, SphereGeometry, SRGBColorSpace, TextureLoader,
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

  return {
    resize(size: number, pixelRatio: number) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size, size, false);
    },
    render(yaw: number, pitch: number) {
      globe.rotation.set(pitch, MathUtils.degToRad(-136) + yaw, 0, 'XYZ');
      renderer.render(scene, camera);
    },
    dispose() {
      globeGeometry.dispose();
      globeMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
