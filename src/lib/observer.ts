import { gsap, Observer } from "./gsap";

export interface FrameRef {
  el: HTMLElement;
  steps: number;
}

type TransitionFactory = (
  from: HTMLElement,
  to: HTMLElement,
  dir: 1 | -1,
) => gsap.core.Timeline;

type RotateFactory = (
  frame: FrameRef,
  from: number,
  to: number,
  dir: 1 | -1,
) => gsap.core.Timeline;

export interface FrameNavigatorOptions {
  frames: FrameRef[];
  transition: TransitionFactory;
  rotate?: RotateFactory;
  onChange?: (index: number, step: number) => void;
  start?: number;
}

export interface FrameNavigator {
  advance(dir: 1 | -1): void;
  goTo(target: number): void;
  jumpTo(target: number): void;
  enable(): void;
  disable(): void;
  destroy(): void;
  readonly index: number;
  readonly step: number;
}

const COOLDOWN = 0.12; // pausa corta tras cada transición para no encadenar gestos de inercia

export function createFrameNavigator(opts: FrameNavigatorOptions): FrameNavigator {
  const { frames, transition, rotate, onChange } = opts;
  let index = opts.start ?? 0;
  let step = 0;
  let animating = false;
  let enabled = true; // el menú lo apaga para que ni wheel ni teclado naveguen detrás del overlay

  const emit = () => onChange?.(index, step);

  function run(timeline: gsap.core.Timeline, done: () => void) {
    animating = true;
    timeline.eventCallback("onComplete", () => {
      done();
      emit();
      gsap.delayedCall(COOLDOWN, () => {
        animating = false;
      });
    });
  }

  // Devuelve true solo si hubo un avance real (para no candar el scroll en los extremos).
  function advance(dir: 1 | -1): boolean {
    if (animating) return false;
    const frame = frames[index];

    // ¿queda sub-paso de ruleta en esta dirección dentro del frame? (p. ej. modelos del carrusel)
    const nextStep = step + dir;
    if (rotate && nextStep >= 0 && nextStep <= frame.steps) {
      run(rotate(frame, step, nextStep, dir), () => {
        step = nextStep;
      });
      return true;
    }

    // Sub-pasos agotados: el scroll NO cambia de sección. Cada frame es su propia página; el salto
    // entre secciones es solo por el header / las categorías (goTo). Así "Producto" no entra a "Visual".
    return false;
  }

  function goTo(target: number) {
    if (animating || target === index || target < 0 || target >= frames.length) return;
    const dir: 1 | -1 = target > index ? 1 : -1;
    run(transition(frames[index].el, frames[target].el, dir), () => {
      index = target;
      step = 0;
    });
  }

  // Salto INSTANTÁNEO (sin flip): muestra el frame destino de golpe y notifica. Se usa al salir de
  // la portada para que la sección aparezca directa (no se vea el flip desde el selector).
  function jumpTo(target: number) {
    if (target < 0 || target >= frames.length) return;
    frames.forEach((f, i) => gsap.set(f.el, { autoAlpha: i === target ? 1 : 0, yPercent: 0 }));
    index = target;
    step = 0;
    animating = false;
    emit();
  }

  function onKey(e: KeyboardEvent) {
    if (!enabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
      case " ":
        e.preventDefault();
        advance(1);
        break;
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        advance(-1);
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(frames.length - 1);
        break;
    }
  }

  // Navegación por evento: el wheelSpeed -1 hace que un scroll hacia abajo dispare
  // onUp (siguiente) y hacia arriba dispare onDown (anterior) — config de la demo oficial.
  // Un gesto = un paso SIN bloquear el scroll: tras un avance real candamos la cola de inercia y
  // soltamos el candado al detenerse (onStop, ágil para scroll intermitente) O tras LOCK_MS (red de
  // seguridad para que el scroll continuo/rápido nunca se quede trabado).
  const LOCK_MS = 900;
  let momentumLock = false;
  let lockTO = 0;
  const releaseLock = () => { momentumLock = false; window.clearTimeout(lockTO); };
  const armLock = () => {
    momentumLock = true;
    window.clearTimeout(lockTO);
    lockTO = window.setTimeout(releaseLock, LOCK_MS);
  };
  const observer = Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    wheelSpeed: -1,
    tolerance: 50,
    dragMinimum: 10,
    preventDefault: true,
    onUp: () => { if (!momentumLock && advance(1)) armLock(); },
    onDown: () => { if (!momentumLock && advance(-1)) armLock(); },
    onStop: () => releaseLock(),
  });

  window.addEventListener("keydown", onKey);
  emit();

  return {
    advance,
    goTo,
    jumpTo,
    enable: () => {
      enabled = true;
      observer.enable();
    },
    disable: () => {
      enabled = false;
      observer.disable();
    },
    destroy() {
      observer.kill();
      window.removeEventListener("keydown", onKey);
    },
    get index() {
      return index;
    },
    get step() {
      return step;
    },
  };
}
