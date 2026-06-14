import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { Object3D } from "three";
import bouquetUrl from "../../assets/models/bouquet.glb?url";
import biznagaUrl from "../../assets/models/biznaga.glb?url";
import daylightsUrl from "../../assets/models/daylights.glb?url";
import bettercepilloUrl from "../../assets/models/Betterware.glb?url";
import bonaterraUrl from "../../assets/models/librero.glb?url";

type Vec3 = [number, number, number];

interface ModelConfig {
  url: string;
  rotation?: Vec3; // pose inicial
  tilt?: number; // inclinación X del pivot (radianes): asoma más la parte superior
  scale?: number;
  display?: number; // tamaño relativo en el carrusel (1 = igual que el resto), tras normalizar el span
}

// Cada frame con modelo declara su nombre (data-model). Aquí vive su .glb + pose.
const CONFIGS: Record<string, ModelConfig> = {
  bouquet: { url: bouquetUrl },
  biznaga: { url: biznagaUrl, tilt: 0.3 }, // se veía muy horizontal: lo inclinamos un poco
  daylights: { url: daylightsUrl },
  bettercepillo: { url: bettercepilloUrl, tilt: -1.0 }, // cepillo alargado: inclinado al lado contrario para que no se vea plano
  bonaterra: { url: bonaterraUrl, display: 0.82 }, // librero: se veía grande, lo achicamos un poco
};

let loader: GLTFLoader | null = null;
const cache = new Map<string, Promise<Object3D>>();

export function hasModel(name: string | null | undefined): name is string {
  return !!name && name in CONFIGS;
}

// Inclinación X del pivot por modelo (para asomar la parte superior). 0 = de frente.
export function getModelTilt(name: string | null | undefined): number {
  return (name && CONFIGS[name]?.tilt) || 0;
}

// Tamaño relativo del modelo en el carrusel (1 = mismo span que el resto). Se aplica
// DESPUÉS de normalizar el span, así que no lo borra la normalización.
export function getModelScale(name: string | null | undefined): number {
  return (name && CONFIGS[name]?.display) || 1;
}

// Carga perezosa por modelo; cachea la promesa para no traer el .glb dos veces.
export function loadModel(name: string): Promise<Object3D> | null {
  const cfg = CONFIGS[name];
  if (!cfg) return null;
  const cached = cache.get(name);
  if (cached) return cached;

  loader ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); // .glb comprimidos con EXT_meshopt_compression
  const promise = loader.loadAsync(cfg.url).then((gltf) => {
    const obj = gltf.scene;
    if (cfg.rotation) obj.rotation.set(cfg.rotation[0], cfg.rotation[1], cfg.rotation[2]);
    if (cfg.scale) obj.scale.setScalar(cfg.scale);
    return obj;
  });
  cache.set(name, promise);
  return promise;
}
