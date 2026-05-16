import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';

const SPEED     = 0.18;
const ROT_SPEED = 0.018;
const ZOOM_LERP = 0.055; // zoom animation speed (lower = smoother but slower)
const ARRIVE_DIST = 1.5; // world units — how close = "arrived"

export default function CameraController() {
  const { camera } = useThree();
  const keys   = useRef({});
  const yaw    = useRef(0);
  // Smooth lookAt target (interpolated during zoom so camera doesn't snap)
  const lookAt = useRef(new THREE.Vector3(0, 0, -10));

  const zoomTarget      = useUIStore((s) => s.zoomTarget);
  const clearZoomTarget = useUIStore((s) => s.clearZoomTarget);
  const targetCamY      = useUIStore((s) => s.targetCamY);

  useEffect(() => {
    camera.position.set(0, 220, 110);
    camera.lookAt(0, 0, -10);
    camera.rotation.order = 'YXZ';
    yaw.current = camera.rotation.y;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      keys.current[e.code] = true;
    };
    const onKeyUp   = (e) => { keys.current[e.code] = false; };
    const onWheel   = (e) => {
      if (zoomTarget) return; // ignore scroll during zoom animation
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      camera.position.addScaledVector(dir, -e.deltaY * 0.015);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('wheel',   onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('wheel',   onWheel);
    };
  }, [camera]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    // ── Zoom animation ───────────────────────────────────────────────────
    if (zoomTarget) {
      const targetPos    = new THREE.Vector3(...zoomTarget.pos);
      const targetLookAt = new THREE.Vector3(...zoomTarget.lookAt);

      camera.position.lerp(targetPos, ZOOM_LERP);
      lookAt.current.lerp(targetLookAt, ZOOM_LERP);
      camera.lookAt(lookAt.current);

      if (camera.position.distanceTo(targetPos) < ARRIVE_DIST) {
        clearZoomTarget();
        // Sync yaw so WASD feels natural right after zoom
        yaw.current = camera.rotation.y;
      }
      return; // ← skip keyboard controls during animation
    }

    // ── Slider y-zoom (height-only, keeps x/z free for WASD) ────────────
    if (targetCamY !== null) {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.1);
    }

    // ── Block camera if typing in an input ───────────────────────────────
    const active = document.activeElement;
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable) return;

    // ── WASD + QE movement ───────────────────────────────────────────────
    const k   = keys.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    if (k['KeyW']) camera.position.addScaledVector(dir,   SPEED);
    if (k['KeyS']) camera.position.addScaledVector(dir,  -SPEED);
    if (k['KeyA']) camera.position.addScaledVector(right, -SPEED);
    if (k['KeyD']) camera.position.addScaledVector(right,  SPEED);

    if (k['KeyQ']) { yaw.current += ROT_SPEED; camera.rotation.y = yaw.current; }
    if (k['KeyE']) { yaw.current -= ROT_SPEED; camera.rotation.y = yaw.current; }
  });

  return null;
}
