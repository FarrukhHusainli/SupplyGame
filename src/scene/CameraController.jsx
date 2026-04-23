import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPEED = 0.12;
const ROT_SPEED = 0.018;

/**
 * Custom WASD + Q/E camera controller.
 * W/S = forward/back, A/D = strafe, Q/E = yaw, scroll = zoom.
 */
export default function CameraController() {
  const { camera } = useThree();
  const keys = useRef({});
  const yaw = useRef(0);

  useEffect(() => {
    // Initial camera position: above the scene looking toward z=0
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    const onKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e) => {
      keys.current[e.code] = false;
    };
    const onWheel = (e) => {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      camera.position.addScaledVector(dir, -e.deltaY * 0.012);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [camera]);

  useFrame(() => {
    const k = keys.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    if (k['KeyW']) camera.position.addScaledVector(dir, SPEED);
    if (k['KeyS']) camera.position.addScaledVector(dir, -SPEED);
    if (k['KeyA']) camera.position.addScaledVector(right, -SPEED);
    if (k['KeyD']) camera.position.addScaledVector(right, SPEED);

    if (k['KeyQ']) { yaw.current += ROT_SPEED; camera.rotation.y = yaw.current; }
    if (k['KeyE']) { yaw.current -= ROT_SPEED; camera.rotation.y = yaw.current; }
  });

  return null;
}
