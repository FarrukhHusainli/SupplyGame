import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';
import { dragState } from './dragState';

const COLOR_DEFAULT  = new THREE.Color(0xa855f7);
const COLOR_SELECTED = new THREE.Color(0xc084fc);
const COLOR_DEFAULT_EMI  = new THREE.Color(0x2e1065);
const COLOR_SELECTED_EMI = new THREE.Color(0x6b21a8);

export default function VendorNode({ name, position, locked = false }) {
  const groupRef = useRef();
  const meshRef  = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const { selectedId, selectedType, select, clearSelection, pipeDrawing, setPendingPipe } = useUIStore();

  const isSelected  = selectedId === name && selectedType === 'vendor';
  const isDrawing   = !!pipeDrawing;
  const isTarget    = isDrawing && isHovered;

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    // ── Drag: check live dragState ──
    if (
      dragState.candidate?.id === name &&
      dragState.candidate?.type === 'vendor' &&
      dragState.activated
    ) {
      groupRef.current.position.x = dragState.pos[0];
      groupRef.current.position.z = dragState.pos[2];
    }

    // ── Float animation ──
    if (isSelected) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.4) * 0.06 + 0.06;
    } else {
      meshRef.current.position.y = position[1];
    }

    const targetColor = isTarget ? new THREE.Color(0x22c55e) : isSelected ? COLOR_SELECTED : COLOR_DEFAULT;
    const targetEmi   = isSelected ? COLOR_SELECTED_EMI : COLOR_DEFAULT_EMI;
    meshRef.current.material.color.lerp(targetColor, 0.15);
    meshRef.current.material.emissive.lerp(targetEmi, 0.1);
  });

  const handlePointerDown = (e) => {
    if (locked || isDrawing) return;
    e.stopPropagation();
    dragState.candidate = { id: name, type: 'vendor' };
    dragState.nodeBaseX = position[0];
    dragState.nodeBaseZ = position[2];
    dragState.originalY = position[1];
    dragState.pos       = [position[0], 0, position[2]];
    dragState.activated = false;
    dragState.moved     = false;
    dragState.needsInit = true;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (dragState.moved) return;
    if (isDrawing) {
      setPendingPipe(pipeDrawing.fromId, name);
      return;
    }
    if (isSelected) clearSelection();
    else select(name, 'vendor');
  };

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Octahedron shape */}
      <mesh
        ref={meshRef}
        position={[0, position[1], 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerEnter={(e) => { e.stopPropagation(); setIsHovered(true); }}
        onPointerLeave={() => setIsHovered(false)}
        castShadow
      >
        <octahedronGeometry args={[0.7, 0]} />
        <meshPhongMaterial
          color={COLOR_DEFAULT}
          emissive={COLOR_DEFAULT_EMI}
          shininess={50}
          transparent
          opacity={isSelected ? 0.92 : 0.78}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.94, 32]} />
          <meshBasicMaterial color={0xc084fc} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Target ring when in drawing mode */}
      {isTarget && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.96, 32]} />
          <meshBasicMaterial color={0x22c55e} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Lock indicator ring */}
      {locked && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.98, 1.08, 32]} />
          <meshBasicMaterial color={0xf59e0b} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, position[1] + 0.95, 0]}
        fontSize={0.38}
        color={isSelected ? '#c084fc' : '#d8b4fe'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#0a0f1e"
      >
        {name}{locked ? ' 🔒' : ''}
      </Text>

      {/* Vendor badge */}
      <Text
        position={[0, position[1] - 0.78, 0]}
        fontSize={0.22}
        color="#7c3aed"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.02}
        outlineColor="#0a0f1e"
      >
        VENDOR
      </Text>
    </group>
  );
}
