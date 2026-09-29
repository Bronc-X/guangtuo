import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {expect, it} from 'vitest';

// Exercise real Three.js controls with DOM event targets. This is touch-logic coverage,
// not a claim of a physical mobile-device test.
class CanvasTarget extends EventTarget {
  ownerDocument = new EventTarget();
  style = {touchAction: ''};
  clientWidth = 390;
  clientHeight = 500;
  getRootNode() { return this.ownerDocument; }
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() { return {left: 0, top: 0, width: this.clientWidth, height: this.clientHeight}; }
}
const touch = (type: string, id: number, x: number, y: number) => Object.assign(new Event(type), {pointerType: 'touch', pointerId: id, pageX: x, pageY: y, clientX: x, clientY: y});

it('rotates with one touch and zooms with a two-touch pinch while panning is disabled', () => {
  const canvas = new CanvasTarget();
  const camera = new PerspectiveCamera(36, 390 / 500, .1, 100);
  camera.position.set(1.4, 2.3, 6.4);
  const controls = new OrbitControls(camera, canvas as unknown as HTMLElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minDistance = 2.2; controls.maxDistance = 9;
  const before = camera.position.clone();
  canvas.dispatchEvent(touch('pointerdown', 1, 100, 200));
  canvas.ownerDocument.dispatchEvent(touch('pointermove', 1, 180, 210));
  canvas.ownerDocument.dispatchEvent(touch('pointerup', 1, 180, 210));
  expect(camera.position.distanceTo(before)).toBeGreaterThan(.1);
  const distance = camera.position.length();
  canvas.dispatchEvent(touch('pointerdown', 2, 100, 200));
  canvas.dispatchEvent(touch('pointerdown', 3, 200, 200));
  canvas.ownerDocument.dispatchEvent(touch('pointermove', 3, 280, 200));
  expect(camera.position.length()).toBeLessThan(distance);
  expect(controls.target.toArray()).toEqual([0, 0, 0]);
  controls.dispose();
  expect(canvas.style.touchAction).toBe('');
});
