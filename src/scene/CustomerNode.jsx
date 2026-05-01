import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

const COLOR_DEFAULT  = new THREE.Color(0xe8c97a);
const COLOR_SELECTED = new THREE.Color(0xffdf80);
const COLOR_TARGET   = new THREE.Color(0x22c55e);
const COLOR_DEFAULT_EMI  = new THREE.Color(0x2a1f00);
const COLOR_SELECTED_EMI = new THREE.Color(0x5a3a00);

export default function CustomerNode({ name, position }) {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const { selectedId, selectedType, select, clearSelection, pipeDrawing, setPendingPipe } = useUIStore();

  const isSelected = selectedId === name && selectedType === 'customer';
  const isDrawing  = !!pipeDrawing;
  const isTarget   = isDrawing && isHovered;

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.2) * 0.05 + 0.05;
    } else {
      meshRef.current.position.y = position[1];
    }
    const targetColor = isTarget ? COLOR_TARGET : isSelected ? COLOR_SELECTED : COLOR_DEFAULT;
    const targetEmi   = isSelected ? COLOR_SELECTED_EMI : COLOR_DEFAULT_EMI;
    meshRef.current.material.color.lerp(targetColor, 0.15);
    meshRef.current.material.emissive.lerp(targetEmi, 0.1);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDrawing) {
      setPendingPipe(pipeDrawing.fromId, name);
      return;
    }
    if (isSelected) clearSelection();
    else select(name, 'customer');
  };

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        position={[0, position[1], 0]}
        onClick={handleClick}
        onPointerEnter={(e) => { e.stopPropagation(); setIsHovered(true); }}
        onPointerLeave={() => setIsHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhongMaterial
          color={COLOR_DEFAULT}
          emissive={COLOR_DEFAULT_EMI}
          shininess={40}
          transparent
          opacity={isSelected ? 0.92 : 0.72}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.82, 32]} />
          <meshBasicMaterial color={0xffdf80} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Target ring when in drawing mode */}
      {isTarget && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.88, 32]} />
          <meshBasicMaterial color={0x22c55e} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, position[1] + 0.85, 0]}
        fontSize={0.38}
        color={isSelected ? '#ffdf80' : '#c9aa60'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#0a0f1e"
      >
        {name}
      </Text>
    </group>
  );
}
