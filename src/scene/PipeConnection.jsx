import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

// Color/Animation Constants mapped from Node files
const THEMES = {
  warehouse: {
    default: { col: 0x4db8ff, emi: 0x0a2240, op: 0.75 },
    selected: { col: 0x00d4ff, emi: 0x0055aa, op: 0.92 },
    float: { freq: 2, amp: 0.06 }
  },
  customer: {
    default: { col: 0xe8c97a, emi: 0x2a1f00, op: 0.72 },
    selected: { col: 0xffdf80, emi: 0x5a3a00, op: 0.92 },
    float: { freq: 2.2, amp: 0.05 }
  }
};

/**
 * A pipe connection between two nodes: tube geometry + directional arrow.
 */
export default function PipeConnection({ pipe, fromPos, toPos }) {
  const groupRef = useRef();
  const arrowRef = useRef();
  const { warehouses, pipes } = useGameStore();
  const { selectedId, selectedType, select, clearSelection } = useUIStore();
  const isSelected = selectedId === pipe.id && selectedType === 'pipe';

  const { curve, sectionGeoms, arrowPos, arrowQuat } = useMemo(() => {
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

    // Differentiate between instant (0) and delayed (1+) connections
    const isInstant = pipe.leadTime === 0;
    const numSections = isInstant ? 1 : Math.max(1, Math.ceil(pipe.leadTime));
    const geoms = [];
    
    // Instant pipes are continuous (no gaps) and thinner
    const gapFactor = isInstant ? 0 : 0.1; 
    const radius = isInstant ? 0.035 : 0.08;

    for (let i = 0; i < numSections; i++) {
      const tStart = i / numSections;
      const tEnd = (i + 1) / numSections;
      
      const subCurve = new THREE.Curve();
      subCurve.getPoint = (t) => c.getPoint(THREE.MathUtils.lerp(tStart + (gapFactor/numSections), tEnd - (gapFactor/numSections), t));
      geoms.push(new THREE.TubeGeometry(subCurve, 12, 0.08, 8, false));
    }

    // Arrow position & orientation at curve midpoint
    const aPos = c.getPoint(0.5);
    const tangent = c.getTangent(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());

    return { curve: c, sectionGeoms: geoms, arrowPos: aPos, arrowQuat: q, isInstant };
  }, [fromPos, toPos, pipe.leadTime]);

  // Determine theme based on inbound status of the "from" node
  const theme = useMemo(() => {
    const hasInbound = pipes.some((p) => p.to === pipe.from);
    const sourceNodeId = hasInbound ? pipe.from : pipe.to;
    return warehouses[sourceNodeId] ? THEMES.warehouse : THEMES.customer;
  }, [pipe.from, pipe.to, pipes, warehouses]);

  // Match Node behaviors: Floating animation + Color Lerping
  useFrame((state) => {
    if (!groupRef.current || !arrowRef.current) return;
    
    const t = state.clock.elapsedTime;
    const target = isSelected ? theme.selected : theme.default;

    // 1. Float Animation
    if (isSelected) {
      groupRef.current.position.y = Math.sin(t * theme.float.freq) * theme.float.amp + theme.float.amp;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
    }

    // 2. Color/Emissive Lerp (Tube)
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.lerp(new THREE.Color(target.col), 0.1);
        child.material.emissive.lerp(new THREE.Color(target.emi), 0.1);
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, target.op, 0.1);
      }
    });

    // 3. Sync Arrow (Special case if not part of traversal or for specific override)
    if (arrowRef.current.material) {
      arrowRef.current.material.color.lerp(new THREE.Color(target.col), 0.1);
      arrowRef.current.material.opacity = THREE.MathUtils.lerp(arrowRef.current.material.opacity, target.op, 0.1);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSelected) clearSelection();
    else select(pipe.id, 'pipe');
  };

  return (
    <group ref={groupRef}>
      {/* Segmented Tube */}
      {sectionGeoms.map((geom, i) => (
        <mesh key={i} geometry={geom} onClick={handleClick}>
          <meshPhongMaterial
            color={theme.default.col}
            emissive={theme.default.emi}
            shininess={20}
            transparent
          />
        </mesh>
      ))}

      {/* Arrow cone */}
      <mesh
        ref={arrowRef}
        position={arrowPos}
        quaternion={arrowQuat}
        onClick={handleClick}
      >
        <coneGeometry args={[arrowQuat.isInstant ? 0.16 : 0.22, arrowQuat.isInstant ? 0.4 : 0.55, 16]} />
        <meshPhongMaterial
          color={theme.default.col}
          emissive={theme.default.emi}
          shininess={30}
          transparent
        />
      </mesh>
    </group>
  );
}
