import { gsap, Observer } from "./gsap";

export interface VisualFlowOptions {
  root: HTMLElement; // [data-visual-flow]
  reduced: boolean;
  onOpen(): void; // pausar el nav principal
  onClose(): void; // reanudar el nav principal
}

export interface VisualFlow {
  openBySlug(slug: string): void;
  openAt(index: number): void;
  close(): void;
  readonly isOpen: boolean;
}

// Flujo a pantalla completa de los proyectos visuales: cada notch de scroll pasa al
// siguiente, el fondo se inunda del color de identidad del proyecto. Observer propio
// (el del nav principal queda en pausa mientras está abierto).
export function createVisualFlow(opts: VisualFlowOptions): VisualFlow {
  const { root, reduced, onOpen, onClose } = opts;
  const slides = [...root.querySelectorAll<HTMLElement>("[data-flow-slide]")];
  const counter = root.querySelector<HTMLElement>("[data-flow-counter]");
  const total = slides.length;
  const indexBySlug = new Map(slides.map((s, i) => [s.dataset.slug ?? "", i]));

  let index = 0;
  let open = false;
  let animating = false;

  const content = (slide: HTMLElement) => slide.querySelector<HTMLElement>("[data-flow-content]");

  function paintColor(i: number, animate: boolean) {
    const c = slides[i].dataset.color || "#111";
    root.style.setProperty("--flow-ink", slides[i].dataset.ink || "#fff");
    if (animate && !reduced) gsap.to(root, { backgroundColor: c, duration: 0.7, ease: "power3.inOut" });
    else gsap.set(root, { backgroundColor: c });
  }

  function paintCounter(i: number) {
    if (counter) counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }

  function transitionTo(next: number, dir: 1 | -1) {
    if (animating || next < 0 || next >= total || next === index) return;
    animating = true;
    paintColor(next, true);
    paintCounter(next);

    const cur = slides[index];
    const nxt = slides[next];

    if (reduced) {
      gsap.set(cur, { autoAlpha: 0 });
      gsap.set(nxt, { autoAlpha: 1 });
      index = next;
      animating = false;
      return;
    }

    const curC = content(cur);
    const nxtC = content(nxt);
    gsap.set(nxt, { autoAlpha: 1 });
    gsap.set(nxtC, { yPercent: 14 * dir, autoAlpha: 0 });

    gsap
      .timeline({ onComplete: () => { index = next; animating = false; } })
      .to(curC, { yPercent: -14 * dir, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0)
      .set(cur, { autoAlpha: 0 }, 0.5)
      .to(nxtC, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" }, 0.32);
  }

  const advance = (dir: 1 | -1) => transitionTo(index + dir, dir);

  const observer = Observer.create({
    target: root,
    type: "wheel,touch,pointer",
    wheelSpeed: -1,
    tolerance: 60,
    dragMinimum: 10,
    preventDefault: true,
    onUp: () => advance(1),
    onDown: () => advance(-1),
  });
  observer.disable();

  function onKey(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); advance(1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); advance(-1); }
  }
  window.addEventListener("keydown", onKey);

  function openAt(i: number) {
    if (open || i < 0 || i >= total) return;
    index = i;
    open = true;
    slides.forEach((s, k) => {
      gsap.set(s, { autoAlpha: k === i ? 1 : 0 });
      const c = content(s);
      if (c) gsap.set(c, { yPercent: 0, autoAlpha: 1 });
    });
    paintColor(i, false);
    paintCounter(i);
    root.setAttribute("aria-hidden", "false");
    onOpen();
    observer.enable();
    gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.5, ease: "power3.out" });
    root.focus();
  }

  function openBySlug(slug: string) {
    const i = indexBySlug.get(slug);
    if (i !== undefined) openAt(i);
  }

  function close() {
    if (!open) return;
    open = false;
    observer.disable();
    gsap.to(root, {
      autoAlpha: 0,
      duration: reduced ? 0.15 : 0.4,
      ease: "power3.in",
      onComplete: () => {
        root.setAttribute("aria-hidden", "true");
        onClose();
      },
    });
  }

  root.querySelector<HTMLElement>("[data-flow-close]")?.addEventListener("click", close);

  return {
    openBySlug,
    openAt,
    close,
    get isOpen() { return open; },
  };
}
