import {
  AmbientLight, BufferGeometry, DirectionalLight, Float32BufferAttribute,
  Group, MathUtils, Mesh, MeshLambertMaterial, OrthographicCamera,
  Points, PointsMaterial, Scene, SphereGeometry, SRGBColorSpace, TextureLoader,
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

  const scene = new Scene();
  const camera = new OrthographicCamera(-1.08, 1.08, 1.08, -1.08, 0.1, 20);
  camera.position.set(0, 5 * Math.sin(MathUtils.degToRad(22)), 5 * Math.cos(MathUtils.degToRad(22)));
  camera.lookAt(0, 0, 0);

  const globeGeometry = new SphereGeometry(1, 48, 32);
  const globeMaterial = new MeshLambertMaterial({ map: texture });
  const globe = new Mesh(globeGeometry, globeMaterial);
  globe.rotation.y = MathUtils.degToRad(-46 - 90);
  scene.add(globe, new AmbientLight(0xffffff, 1.25));

  const key = new DirectionalLight(0xffffff, 1.55);
  key.position.set(-2, 3, 4);
  scene.add(key);

  // One point cloud, with fixed placement so the composition is repeatable.
  const dustPositions = Array.from({ length: 30 }, (_, i) => {
    const angle = i * 2.39996;
    const radius = 1.015 + (i % 5) * 0.012;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
  }).flat();
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute('position', new Float32BufferAttribute(dustPositions, 3));
  const dustMaterial = new PointsMaterial({ color: 0x8c9092, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.22, depthWrite: false });
  const dustPlane = new Group();
  dustPlane.quaternion.copy(camera.quaternion);
  const dust = new Points(dustGeometry, dustMaterial);
  dustPlane.add(dust);
  scene.add(dustPlane);

  return {
    resize(size: number, pixelRatio: number) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size, size, false);
    },
    render(seconds: number) {
      globe.rotation.y = MathUtils.degToRad(-46 - 90) + seconds * (2 * Math.PI / 150);
      dust.rotation.z = seconds * 0.024;
      renderer.render(scene, camera);
    },
    dispose() {
      globeGeometry.dispose();
      globeMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
