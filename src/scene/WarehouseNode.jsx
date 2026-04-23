import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';

const COLOR_DEFAULT = new THREE.Color(0x4db8ff);
const COLOR_SELECTED = new THREE.Color(0x00d4ff);
const COLOR_DEFAULT_EMI = new THREE.Color(0x0a2240);
const COLOR_SELECTED_EMI = new THREE.Color(0x0055aa);

/**
 * A warehouse node: blue box with a label, clickable for selection.
 */
export default function WarehouseNode({ name, position, currentStock }) {
  const meshRef = useRef();
  const { selectedId, selectedType, select, clearSelection } = useUIStore();
  const isSelected = selectedId === name && selectedType === 'warehouse';

  // Animate hover float
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.06 + 0.06;
    } else {
      meshRef.current.position.y = position[1];
    }
    // Smooth color transition
    meshRef.current.material.color.lerp(isSelected ? COLOR_SELECTED : COLOR_DEFAULT, 0.1);
    meshRef.current.material.emissive.lerp(isSelected ? COLOR_SELECTED_EMI : COLOR_DEFAULT_EMI, 0.1);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSelected) clearSelection();
    else select(name, 'warehouse');
  };

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Main cube */}
      <mesh
        ref={meshRef}
        position={[0, position[1], 0]}
        onClick={handleClick}
        castShadow
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshPhongMaterial
          color={COLOR_DEFAULT}
          emissive={COLOR_DEFAULT_EMI}
          shininess={60}
          transparent
          opacity={isSelected ? 0.92 : 0.75}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.12, 32]} />
          <meshBasicMaterial color={0x00d4ff} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, position[1] + 1.2, 0]}
        fontSize={0.45}
        color={isSelected ? '#00d4ff' : '#a0c4e8'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#0a0f1e"
      >
        {name}
      </Text>

      {/* Stock indicator text */}
      <Text
        position={[0, position[1] - 0.88, 0]}
        fontSize={0.28}
        color={currentStock < 0 ? '#ef4444' : '#60a5fa'}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.03}
        outlineColor="#0a0f1e"
      >
        {Math.floor(currentStock).toLocaleString()}
      </Text>
    </group>
  );
}
