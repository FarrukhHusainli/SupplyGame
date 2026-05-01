import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export default function DraftPipe({ fromPos }) {
  const { raycaster, pointer, camera, gl } = useThree();
  const cancelPipeDrawing = useUIStore((s) => s.cancelPipeDrawing);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array([
      fromPos[0], fromPos[1] + 0.6, fromPos[2],
      fromPos[0], fromPos[1] + 0.6, fromPos[2],
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [fromPos]);

  // Crosshair cursor
  useEffect(() => {
    gl.domElement.style.cursor = 'crosshair';
    return () => { gl.domElement.style.cursor = 'auto'; };
  }, [gl]);

  // Escape to cancel
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelPipeDrawing(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelPipeDrawing]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(GROUND, hit)) {
      const attr = lineGeo.attributes.position;
      attr.setXYZ(0, fromPos[0], fromPos[1] + 0.6, fromPos[2]);
      attr.setXYZ(1, hit.x, 0.6, hit.z);
      attr.needsUpdate = true;
      lineGeo.computeBoundingSphere();
    }
  });

  return (
    <line geometry={lineGeo}>
      <lineBasicMaterial color={0xe8c97a} transparent opacity={0.9} />
    </line>
  );
}
