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
  const camera = new OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 20);
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

  const dustPlane = new Group();
  dustPlane.quaternion.copy(camera.quaternion);
  scene.add(dustPlane);

  // Spread two small clouds along the limb, with denser pockets near the lower edges.
  const layers = [
    { count: 34, size: 1.9, opacity: 0.30, depth: -0.1, drift: 0.012 },
    { count: 18, size: 2.9, opacity: 0.44, depth: 0.14, drift: 0.021 },
  ].map(({ count, size, opacity, depth, drift }, layer) => {
    const positions = Array.from({ length: count }, (_, i) => {
      const spread = (i * 0.618034) % 1;
      const angle = (i % 2 === 0 ? -0.52 : 3.66) + (spread - 0.5) * 1.66;
      const radius = 1.02 + ((i * 0.414214 + layer * 0.28) % 1) * 0.15;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, depth];
    }).flat();
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0x65696a, size, opacity, transparent: true,
      sizeAttenuation: false, depthWrite: false,
    });
    // Feather each point in the shader without an additional texture request.
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <alphatest_fragment>',
        'diffuseColor.a *= 1.0 - smoothstep(0.13, 0.5, length(gl_PointCoord - vec2(0.5)));',
      );
    };
    const points = new Points(geometry, material);
    dustPlane.add(points);
    return { points, geometry, material, drift };
  });

  return {
    resize(size: number, pixelRatio: number) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size, size, false);
    },
    render(seconds: number) {
      globe.rotation.y = MathUtils.degToRad(-46 - 90) + seconds * (2 * Math.PI / 150);
      for (const { points, drift } of layers) {
        points.rotation.z = Math.sin(seconds * drift) * 0.14;
        points.position.x = Math.sin(seconds * drift * 1.3) * 0.043;
        points.position.y = Math.sin(seconds * drift * 0.8) * 0.033;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      globeGeometry.dispose();
      globeMaterial.dispose();
      for (const { geometry, material } of layers) {
        geometry.dispose();
        material.dispose();
      }
      texture.dispose();
      renderer.dispose();
    },
  };
}
