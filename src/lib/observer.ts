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

  function advance(dir: 1 | -1) {
    if (animating) return;
    const frame = frames[index];

    // ¿queda sub-paso de ruleta en esta dirección dentro del frame?
    const nextStep = step + dir;
    if (rotate && nextStep >= 0 && nextStep <= frame.steps) {
      run(rotate(frame, step, nextStep, dir), () => {
        step = nextStep;
      });
      return;
    }

    // sub-pasos agotados: cambiamos de frame
    const next = index + dir;
    if (next < 0 || next >= frames.length) return;
    run(transition(frame.el, frames[next].el, dir), () => {
      index = next;
      step = dir === 1 ? 0 : frames[next].steps;
    });
  }

  function goTo(target: number) {
    if (animating || target === index || target < 0 || target >= frames.length) return;
    const dir: 1 | -1 = target > index ? 1 : -1;
    run(transition(frames[index].el, frames[target].el, dir), () => {
      index = target;
      step = 0;
    });
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
  const observer = Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    wheelSpeed: -1,
    tolerance: 50,
    dragMinimum: 10,
    preventDefault: true,
    onUp: () => advance(1),
    onDown: () => advance(-1),
  });

  window.addEventListener("keydown", onKey);
  emit();

  return {
    advance,
    goTo,
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
