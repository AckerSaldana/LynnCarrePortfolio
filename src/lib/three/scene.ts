import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export interface SceneHandle {
  add(obj: THREE.Object3D): void;
  remove(obj: THREE.Object3D): void;
  frameObject(obj: THREE.Object3D, fill?: number): void;
  setActive(active: boolean): void;
  dispose(): void;
}

// Una sola escena WebGL persistente. El renderer solo dibuja cuando hay un modelo
// visible (setActive), así no gasta frames detrás de los frames opacos.
export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);

  // Entorno suave para reflejos PBR, pero con baja intensidad para que no quede plano/quemado;
  // un key direccional da forma y un rim tenue separa del fondo.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.45;

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2.5, 3.5, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.3);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(rim);

  // Encuadre: el modelo se coloca a la izquierda en pantallas anchas (la derecha queda
  // para el título), y centrado en móvil. Se recalcula en resize.
  let frameDist = 0;
  function applyView() {
    if (!frameDist) return;
    const ndcX = window.innerWidth > 820 ? -0.42 : 0;
    const halfW = frameDist * Math.tan((Math.PI * camera.fov) / 360) * camera.aspect;
    const cx = -ndcX * halfW;
    camera.position.set(cx, 0, frameDist);
    camera.lookAt(cx, 0, 0);
  }

  const render = () => renderer.render(scene, camera);

  let active = false;
  function setActive(a: boolean) {
    if (a === active) return;
    active = a;
    renderer.setAnimationLoop(a ? render : null);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    applyView();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (!active) render(); // refrescar una vez si está pausado
  }
  window.addEventListener("resize", onResize);

  // Centra el objeto en el origen y fija la distancia de cámara para un encuadre
  // consistente sin importar la escala del .glb.
  function frameObject(obj: THREE.Object3D, fill = 1.6) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.userData.span = maxDim; // para el swap (distancia para salir de cuadro)
    obj.userData.homeY = obj.position.y; // posición de reposo
    frameDist = (maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360))) * fill;
    camera.near = frameDist / 100;
    camera.far = frameDist * 100;
    applyView();
    camera.updateProjectionMatrix();
  }

  return {
    add: (o) => scene.add(o),
    remove: (o) => scene.remove(o),
    frameObject,
    setActive,
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
