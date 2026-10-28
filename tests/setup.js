import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
if (typeof window !== "undefined") {
if (!window.PointerEvent) window.PointerEvent = MouseEvent;
if (!HTMLElement.prototype.hasPointerCapture) HTMLElement.prototype.hasPointerCapture = () => false;
if (!HTMLElement.prototype.setPointerCapture) HTMLElement.prototype.setPointerCapture = () => {};
if (!HTMLElement.prototype.releasePointerCapture) HTMLElement.prototype.releasePointerCapture = () => {};
if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = () => {};

}
