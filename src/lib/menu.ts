import { gsap } from "./gsap";

export interface MenuOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onNavigate?: (target: number) => void;
  getActive?: () => number;
  reducedMotion?: boolean;
}

export function createMenu(opts: MenuOptions) {
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const trigger = document.querySelector<HTMLElement>("[data-menu-trigger]");
  if (!menu || !trigger) return null;

  const closeBtn = menu.querySelector<HTMLElement>("[data-menu-close]");
  const items = [...menu.querySelectorAll<HTMLElement>("[data-target]")];
  const reduced = opts.reducedMotion ?? false;

  let isOpen = false;
  let lastFocus: HTMLElement | null = null;

  const rules = menu.querySelectorAll(".menu__rule");
  const labels = menu.querySelectorAll(".menu__label-inner");
  const barItems = menu.querySelectorAll(".menu__bar > *");

  const tl = gsap.timeline({ paused: true });
  if (reduced) {
    tl.set(menu, { autoAlpha: 1 }).from(menu, { autoAlpha: 0, duration: 0.2 });
  } else {
    tl.set(menu, { autoAlpha: 1, clipPath: "inset(0 0 100% 0)" })
      .set(rules, { scaleX: 0 }, 0)
      .set(labels, { yPercent: 110 }, 0)
      .set(barItems, { autoAlpha: 0, y: -10 }, 0)
      .to(menu, { clipPath: "inset(0% 0 0% 0)", duration: 0.6, ease: "power3.inOut" }, 0)
      .to(rules, { scaleX: 1, duration: 0.5, ease: "power3.out", stagger: 0.05 }, 0.18)
      .to(labels, { yPercent: 0, duration: 0.6, ease: "power4.out", stagger: 0.06 }, 0.24)
      .to(barItems, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.08 }, 0.5);
  }

  function markActive() {
    const active = opts.getActive?.() ?? -1;
    // sección activa = el último destino cuyo target <= índice actual (una sección abarca varios frames)
    let best: HTMLElement | null = null;
    let bestTarget = -1;
    items.forEach((el) => {
      const t = Number(el.dataset.target);
      if (t <= active && t > bestTarget) {
        bestTarget = t;
        best = el;
      }
    });
    items.forEach((el) => el.classList.toggle("is-active", el === best));
  }

  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement as HTMLElement;
    markActive();
    trigger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    opts.onOpen?.();
    document.addEventListener("keydown", onKeydown);
    tl.timeScale(1).play();
    menu.focus();
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    opts.onClose?.();
    tl.eventCallback("onReverseComplete", () => {
      menu.setAttribute("aria-hidden", "true");
      gsap.set(menu, { autoAlpha: 0 }); // garantizar oculto y no interactivo tras cerrar
      tl.eventCallback("onReverseComplete", null);
    });
    tl.timeScale(reduced ? 1 : 1.7).reverse();
    lastFocus?.focus();
  }

  function navigate(target: number) {
    closeMenu();
    opts.onNavigate?.(target);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeMenu();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = [...menu.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  trigger.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);
  items.forEach((el) => el.addEventListener("click", () => navigate(Number(el.dataset.target))));

  return { open: openMenu, close: closeMenu };
}
