import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import useUIStore from '../store/useUIStore';
import { dragState } from './dragState';

const COLOR_DEFAULT  = new THREE.Color(0x4db8ff);
const COLOR_SELECTED = new THREE.Color(0x00d4ff);
const COLOR_TARGET   = new THREE.Color(0x22c55e);
const COLOR_DEFAULT_EMI  = new THREE.Color(0x0a2240);
const COLOR_SELECTED_EMI = new THREE.Color(0x0055aa);
const COLOR_LOCKED_RING  = new THREE.Color(0xf59e0b);

export default function WarehouseNode({ name, position, currentStock, locked = false }) {
  const groupRef = useRef();
  const meshRef  = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef(null);

  const hoverIn = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  }, []);

  const hoverOut = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setIsHovered(false), 120);
  }, []);

  const {
    selectedId, selectedType, select, clearSelection,
    pipeDrawing, startPipeDrawing, cancelPipeDrawing, setPendingPipe,
  } = useUIStore();

  const isSelected = selectedId === name && selectedType === 'warehouse';
  const isDrawing  = !!pipeDrawing;
  const isSource   = pipeDrawing?.fromId === name;
  const isTarget   = isDrawing && !isSource && isHovered;

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    // ── Drag: check live dragState (not stale render-scope value) ──
    if (
      dragState.candidate?.id === name &&
      dragState.candidate?.type === 'warehouse' &&
      dragState.activated
    ) {
      groupRef.current.position.x = dragState.pos[0];
      groupRef.current.position.z = dragState.pos[2];
    }

    // ── Float animation on selection ──
    if (isSelected) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.06 + 0.06;
    } else {
      meshRef.current.position.y = position[1];
    }

    // ── Color lerp ──
    const targetColor = isTarget ? COLOR_TARGET : isSelected ? COLOR_SELECTED : COLOR_DEFAULT;
    const targetEmi   = isSelected ? COLOR_SELECTED_EMI : COLOR_DEFAULT_EMI;
    meshRef.current.material.color.lerp(targetColor, 0.15);
    meshRef.current.material.emissive.lerp(targetEmi, 0.1);
  });

  const handlePointerDown = (e) => {
    if (locked || isDrawing) return;
    e.stopPropagation();
    dragState.candidate = { id: name, type: 'warehouse' };
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
    // Suppress click if this was actually a drag
    if (dragState.moved) return;
    if (isDrawing) {
      if (!isSource) setPendingPipe(pipeDrawing.fromId, name);
      return;
    }
    if (isSelected) clearSelection();
    else select(name, 'warehouse');
  };

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Invisible expanded hitbox for easier hover */}
      <mesh
        position={[0.35, position[1] + 0.35, 0]}
        onPointerEnter={(e) => { e.stopPropagation(); hoverIn(); }}
        onPointerLeave={hoverOut}
      >
        <boxGeometry args={[3.0, 2.8, 2.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Main cube */}
      <mesh
        ref={meshRef}
        position={[0, position[1], 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerEnter={(e) => { e.stopPropagation(); if (!locked) e.target.style && (document.body.style.cursor = 'grab'); }}
        onPointerLeave={() => { if (!dragState.activated) document.body.style.cursor = ''; }}
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

      {/* Target ring when in drawing mode */}
      {isTarget && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.18, 32]} />
          <meshBasicMaterial color={0x22c55e} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Lock indicator ring */}
      {locked && (
        <mesh position={[0, position[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.14, 1.24, 32]} />
          <meshBasicMaterial color={0xf59e0b} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* "+" connect button */}
      {!isDrawing && (
        <Html position={[0.9, position[1] + 0.9, 0]} center style={{ pointerEvents: 'none' }}>
          <button
            onMouseEnter={hoverIn}
            onMouseMove={hoverIn}
            onMouseLeave={hoverOut}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); startPipeDrawing(name, position); }}
            style={{
              width: 22, height: 22,
              borderRadius: '50%',
              background: '#4db8ff',
              color: 'white',
              border: '2px solid #2196f3',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              lineHeight: '18px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(77,184,255,0.6)',
              userSelect: 'none',
              pointerEvents: isHovered ? 'auto' : 'none',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.12s ease',
            }}
            title="Connect to another node"
          >
            +
          </button>
        </Html>
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
        {name}{locked ? ' 🔒' : ''}
      </Text>

      {/* Stock indicator */}
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
