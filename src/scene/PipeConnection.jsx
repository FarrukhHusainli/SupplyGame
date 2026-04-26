import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

/**
 * A pipe connection between two nodes: tube geometry + directional arrow.
 * Matches original look: curved tube with mid-point arrow.
 */
export default function PipeConnection({ pipe, fromPos, toPos }) {
  const pipeRef = useRef();
  const arrowRef = useRef();
  const { warehouses, pipes } = useGameStore();
  const { selectedId, selectedType, select, clearSelection } = useUIStore();
  const isSelected = selectedId === pipe.id && selectedType === 'pipe';

  const { curve, tubeGeom, arrowPos, arrowQuat } = useMemo(() => {
    const from = new THREE.Vector3(...fromPos);
    const to = new THREE.Vector3(...toPos);
    const mid = from.clone().add(to).multiplyScalar(0.5).setY(1 + pipe.leadTime);

    const dS = mid.clone().sub(from).normalize();
    const dE = mid.clone().sub(to).normalize();

    const c = new THREE.QuadraticBezierCurve3(
      from.clone().add(dS.clone().multiplyScalar(0.5)),
      mid,
      to.clone().add(dE.clone().multiplyScalar(0.5))
    );

    const tGeom = new THREE.TubeGeometry(c, 20, 0.08, 8, false);

    // Arrow position & orientation at curve midpoint
    const aPos = c.getPoint(0.5);
    const tangent = c.getTangent(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());

    return { curve: c, tubeGeom: tGeom, arrowPos: aPos, arrowQuat: q };
  }, [fromPos, toPos, pipe.leadTime]);

  // Determine color based on inbound status of the "from" node
  const { color, emissive } = useMemo(() => {
    const hasInbound = pipes.some((p) => p.to === pipe.from);
    const sourceNodeId = hasInbound ? pipe.from : pipe.to;
    const isWarehouse = !!warehouses[sourceNodeId];

    if (isWarehouse) {
      return {
        color: isSelected ? 0x00d4ff : 0x4db8ff,
        emissive: isSelected ? 0x0055aa : 0x0a2240,
      };
    }
    return {
      color: isSelected ? 0xffdf80 : 0xe8c97a,
      emissive: isSelected ? 0x5a3a00 : 0x2a1f00,
    };
  }, [pipe.from, pipe.to, pipes, warehouses, isSelected]);

  // Pulse opacity when selected
  useFrame((state) => {
    if (!pipeRef.current) return;
    const base = isSelected ? 0.65 : 0.35;
    const pulse = isSelected ? Math.sin(state.clock.elapsedTime * 3) * 0.15 : 0;
    pipeRef.current.material.opacity = base + pulse;
    if (arrowRef.current) arrowRef.current.material.opacity = (base + pulse) * 1.5;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSelected) clearSelection();
    else select(pipe.id, 'pipe');
  };

  return (
    <group>
      {/* Tube */}
      <mesh ref={pipeRef} geometry={tubeGeom} onClick={handleClick}>
        <meshPhongMaterial
          color={color}
          emissive={emissive}
          shininess={20}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Arrow cone */}
      <mesh
        ref={arrowRef}
        position={arrowPos}
        quaternion={arrowQuat}
        onClick={handleClick}
      >
        <coneGeometry args={[0.22, 0.55, 16]} />
        <meshPhongMaterial
          color={color}
          shininess={30}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
