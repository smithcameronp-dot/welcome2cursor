import { createParkView } from "./render";

const canvas = document.querySelector("#view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("missing #view canvas");
}

createParkView(canvas);
