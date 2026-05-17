import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';

import useGameStore from './store/useGameStore';
import useUIStore from './store/useUIStore';
import { loadFromDB } from './db/firebase';

// Scene
import SceneBackground from './scene/SceneBackground';
import CameraController from './scene/CameraController';
import WarehouseNode from './scene/WarehouseNode';
import CustomerNode from './scene/CustomerNode';
import VendorNode from './scene/VendorNode';
import PipeConnection from './scene/PipeConnection';
import DraftPipe from './scene/DraftPipe';
import DragController from './scene/DragController';
import WorldMap from './scene/WorldMap';

// UI
import Toolbar from './components/Toolbar';
import InfoPanel from './components/InfoPanel';
import Timeline from './components/Timeline';
import Modal from './components/Modal';
import WarehouseManager from './components/managers/WarehouseManager';
import LeadTimePopup from './components/LeadTimePopup';
import CustomerManager from './components/managers/CustomerManager';
import VendorManager from './components/managers/VendorManager';
import SupplyManager from './components/managers/SupplyManager';
import StockManager from './components/managers/StockManager';
import GlobeControls from './components/GlobeControls';
import StateControls from './components/StateControls';

/** Render the correct manager based on openModal */
function ManagerContent() {
  const openModal = useUIStore((s) => s.openModal);
  if (openModal === 'warehouses') return <WarehouseManager />;
  if (openModal === 'customers') return <CustomerManager />;
  if (openModal === 'vendors') return <VendorManager />;
  if (openModal === 'supply') return <SupplyManager />;
  if (openModal === 'stock') return <StockManager />;
  return null;
}

/** 3D scene content (runs inside <Canvas>) */
function SceneContent() {
  const warehouses    = useGameStore((s) => s.warehouses);
  const customers     = useGameStore((s) => s.customers);
  const vendors       = useGameStore((s) => s.vendors);
  const pipes         = useGameStore((s) => s.pipes);
  const currentPeriod = useGameStore((s) => s.currentPeriod);
  const clearSelection   = useUIStore((s) => s.clearSelection);
  const lightMode        = useUIStore((s) => s.lightMode);
  const pipeDrawing      = useUIStore((s) => s.pipeDrawing);
  const cancelPipeDrawing = useUIStore((s) => s.cancelPipeDrawing);

  const visWarehouses = Object.fromEntries(Object.entries(warehouses).filter(([, wh]) => (wh.createdAtPeriod ?? 1) <= currentPeriod));
  const visCustomers  = Object.fromEntries(Object.entries(customers).filter(([, c])  => (c.createdAtPeriod  ?? 1) <= currentPeriod));
  const visVendors    = Object.fromEntries(Object.entries(vendors).filter(([, v])    => (v.createdAtPeriod  ?? 1) <= currentPeriod));
  const visPipes      = pipes.filter(p => (p.createdAtPeriod ?? 1) <= currentPeriod);

  return (
    <>
      <color attach="background" args={[lightMode ? '#f0f4f8' : '#060d1f']} />
      <SceneBackground lightMode={lightMode} />
      <WorldMap />
      <CameraController />

      {/* Drag controller — raycasts mouse to ground, commits position on drop */}
      <DragController />

      {/* Draft pipe arrow follows mouse */}
      {pipeDrawing && <DraftPipe fromPos={pipeDrawing.fromPos} />}

      {/* Click on empty space → deselect or cancel drawing */}
      <mesh
        position={[0, -0.09, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => pipeDrawing ? cancelPipeDrawing() : clearSelection()}
        visible={false}
      >
        <planeGeometry args={[800, 800]} />
        <meshBasicMaterial />
      </mesh>

      {/* Warehouses */}
      {Object.entries(visWarehouses).map(([name, wh]) => (
        <WarehouseNode
          key={name}
          name={name}
          position={wh.position}
          currentStock={wh.currentStock}
          locked={wh.locked ?? false}
        />
      ))}

      {/* Customers */}
      {Object.entries(visCustomers).map(([name, c]) => (
        <CustomerNode
          key={name}
          name={name}
          position={c.position}
          locked={c.locked ?? false}
        />
      ))}

      {/* Vendors */}
      {Object.entries(visVendors).map(([name, v]) => (
        <VendorNode
          key={name}
          name={name}
          position={v.position}
          locked={v.locked ?? false}
        />
      ))}

      {/* Pipes */}
      {visPipes.map((pipe) => {
        const fromNode = visWarehouses[pipe.from] || visCustomers[pipe.from] || visVendors[pipe.from];
        const toNode   = visWarehouses[pipe.to]   || visCustomers[pipe.to]   || visVendors[pipe.to];
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
  const setLastPeriodTime = useGameStore((s) => s.setLastPeriodTime);
  const lightMode = useUIStore((s) => s.lightMode);

  // Load from Firebase on mount
  useEffect(() => {
    loadFromDB().then((saved) => {
      if (saved) {
        const { key, ...data } = saved;
        hydrate(data);
      }
      setLastPeriodTime(performance.now());
    });
  }, [hydrate, setLastPeriodTime]);

  // Global Ctrl+Z / Cmd+Z → undo (skip when typing in an input)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        useGameStore.getState().undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      data-theme={lightMode ? 'light' : 'dark'}
      className="w-full h-full relative"
      style={{ background: lightMode ? '#f0f4f8' : '#060d1f' }}
    >
      {/* ── 3D Canvas (full screen) ── */}
      <Canvas
        className="absolute inset-0"
        camera={{ fov: 50, near: 0.1, far: 2000, position: [0, 220, 110] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#060d1f' }}
      >
        <color attach="background" args={['#060d1f']} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* ── HTML Overlays ── */}
      <StateControls />
      <Toolbar />
      <InfoPanel />
      <Timeline />

      <LeadTimePopup />

      {/* Globe zoom controls (bottom-left) */}
      <GlobeControls />

      {/* Modal (renders nothing if openModal is null) */}
      <Modal>
        <ManagerContent />
      </Modal>
    </div>
  );
}
