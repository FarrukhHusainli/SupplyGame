import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';

import useGameStore from './store/useGameStore';
import useUIStore from './store/useUIStore';
import { loadFromDB } from './db/indexedDB';

// Scene
import SceneBackground from './scene/SceneBackground';
import CameraController from './scene/CameraController';
import WarehouseNode from './scene/WarehouseNode';
import CustomerNode from './scene/CustomerNode';
import PipeConnection from './scene/PipeConnection';

// UI
import Toolbar from './components/Toolbar';
import InfoPanel from './components/InfoPanel';
import Timeline from './components/Timeline';
import Modal from './components/Modal';
import WarehouseManager from './components/managers/WarehouseManager';
import CustomerManager from './components/managers/CustomerManager';
import SupplyManager from './components/managers/SupplyManager';
import StockManager from './components/managers/StockManager';

/** Render the correct manager based on openModal */
function ManagerContent() {
  const openModal = useUIStore((s) => s.openModal);
  if (openModal === 'warehouses') return <WarehouseManager />;
  if (openModal === 'customers') return <CustomerManager />;
  if (openModal === 'supply') return <SupplyManager />;
  if (openModal === 'stock') return <StockManager />;
  return null;
}

/** 3D scene content (runs inside <Canvas>) */
function SceneContent() {
  const warehouses = useGameStore((s) => s.warehouses);
  const customers = useGameStore((s) => s.customers);
  const pipes = useGameStore((s) => s.pipes);
  const clearSelection = useUIStore((s) => s.clearSelection);

  return (
    <>
      <SceneBackground />
      <CameraController />

      {/* Click on empty space → deselect */}
      <mesh
        position={[0, -0.09, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={clearSelection}
        visible={false}
      >
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial />
      </mesh>

      {/* Warehouses */}
      {Object.entries(warehouses).map(([name, wh]) => (
        <WarehouseNode
          key={name}
          name={name}
          position={wh.position}
          currentStock={wh.currentStock}
        />
      ))}

      {/* Customers */}
      {Object.entries(customers).map(([name, c]) => (
        <CustomerNode
          key={name}
          name={name}
          position={c.position}
        />
      ))}

      {/* Pipes */}
      {pipes.map((pipe) => {
        const fromNode = warehouses[pipe.from] || customers[pipe.from];
        const toNode = warehouses[pipe.to] || customers[pipe.to];
        if (!fromNode || !toNode) return null;
        return (
          <PipeConnection
            key={pipe.id}
            pipe={pipe}
            fromPos={fromNode.position}
            toPos={toNode.position}
          />
        );
      })}
    </>
  );
}

export default function App() {
  const hydrate = useGameStore((s) => s.hydrate);
  const setLastWeekTime = useGameStore((s) => s.setLastWeekTime);

  // Load from IndexedDB on mount
  useEffect(() => {
    loadFromDB().then((saved) => {
      if (saved) {
        const { key, ...data } = saved;
        hydrate(data);
      }
      setLastWeekTime(performance.now());
    });
  }, [hydrate, setLastWeekTime]);

  return (
    <div className="w-full h-full relative" style={{ background: '#0a0f1e' }}>
      {/* ── 3D Canvas (full screen) ── */}
      <Canvas
        className="absolute inset-0"
        camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 8, 18] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0f1e' }}
      >
        <color attach="background" args={['#0a0f1e']} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* ── HTML Overlays ── */}
      <Toolbar />
      <InfoPanel />
      <Timeline />

      {/* Modal (renders nothing if openModal is null) */}
      <Modal>
        <ManagerContent />
      </Modal>
    </div>
  );
}
