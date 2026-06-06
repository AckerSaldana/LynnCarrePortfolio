import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (!import.meta.env.SSR) {
  gsap.registerPlugin(Observer, ScrollToPlugin, SplitText, MotionPathPlugin);
}

export { gsap, Observer, ScrollToPlugin, SplitText, MotionPathPlugin };
