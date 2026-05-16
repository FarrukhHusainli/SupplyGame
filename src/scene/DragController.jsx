import { useThree, useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import useGameStore from '../store/useGameStore';
import { dragState } from './dragState';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit   = new THREE.Vector3();

// How far (in world units on the ground plane) the mouse must travel
// from the initial click before the drag activates.
const DRAG_THRESHOLD = 0.18;

/**
 * Lives inside the Canvas.
 * - Each frame: if a drag candidate exists, raycasts mouse against the ground plane.
 * - First frame: computes the pick offset so the node doesn't jump to the cursor.
 * - Activates drag once mouse moves past DRAG_THRESHOLD.
 * - On pointerup: saves the final position (preserving original y) to the game store.
 */
export default function DragController() {
  const { raycaster, camera, pointer, gl } = useThree();
  const updateNodePosition = useGameStore((s) => s.updateNodePosition);

  useFrame(() => {
    if (!dragState.candidate) return;

    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(GROUND, _hit)) return;

    // ── First frame after pointerDown: establish pick offset ──
    if (dragState.needsInit) {
      // The difference between the node's stored base and the ground hit
      // under the cursor. This keeps the grab point fixed so the node
      // doesn't snap to the cursor center.
      dragState.offsetX  = dragState.nodeBaseX - _hit.x;
      dragState.offsetZ  = dragState.nodeBaseZ - _hit.z;
      dragState.startHit = [_hit.x, _hit.z];
      dragState.needsInit = false;
      // Don't move yet — wait for actual mouse movement
      return;
    }

    // ── Compute where the group should sit (offset keeps grab point steady) ──
    dragState.pos = [_hit.x + dragState.offsetX, 0, _hit.z + dragState.offsetZ];

    // ── Activate once the mouse has moved far enough from the initial hit ──
    if (!dragState.activated) {
      const dx = _hit.x - dragState.startHit[0];
      const dz = _hit.z - dragState.startHit[1];
      if (Math.sqrt(dx * dx + dz * dz) > DRAG_THRESHOLD) {
        dragState.activated = true;
        gl.domElement.style.cursor = 'grabbing';
      }
    }

    if (dragState.activated) dragState.moved = true;
  });

  useEffect(() => {
    const canvas = gl.domElement;

    const commit = () => {
      if (dragState.candidate && dragState.moved) {
        // Preserve the original y so the node never sinks into the ground
        updateNodePosition(
          dragState.candidate.id,
          dragState.candidate.type,
          [dragState.pos[0], dragState.originalY, dragState.pos[2]],
        );
      }
      // Reset everything
      dragState.candidate  = null;
      dragState.activated  = false;
      dragState.moved      = false;
      dragState.needsInit  = true;
      dragState.startHit   = [0, 0];
      dragState.offsetX    = 0;
      dragState.offsetZ    = 0;
      canvas.style.cursor  = '';
    };

    canvas.addEventListener('pointerup',     commit);
    canvas.addEventListener('pointercancel', commit);
    return () => {
      canvas.removeEventListener('pointerup',     commit);
      canvas.removeEventListener('pointercancel', commit);
    };
  }, [gl, updateNodePosition]);

  return null;
}
