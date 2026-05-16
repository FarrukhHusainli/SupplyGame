import { useEffect, useMemo, useState, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { MAP_W, MAP_H } from '../utils/geo';

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ── Bump map (grayscale: ocean dark, land light) ───────────────────────────

function buildBumpTexture(countries, W = 1024, H = 512) {
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#141414';   // ocean = low
  ctx.fillRect(0, 0, W, H);

  for (const f of countries.features) {
    ctx.beginPath();
    const drawRings = (rings) => {
      for (const ring of rings) {
        let first = true;
        for (const [lon, lat] of ring) {
          const x = (lon + 180) / 360 * W;
          const y = (90  - lat) / 180 * H;
          if (first) { ctx.moveTo(x, y); first = false; }
          else         ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
    };
    const g = f.geometry;
    if (g.type === 'Polygon')      drawRings(g.coordinates);
    if (g.type === 'MultiPolygon') g.coordinates.forEach(p => drawRings(p));
    ctx.fillStyle = '#5a5a5a';   // land = medium height
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// ── 3D border line-segments ────────────────────────────────────────────────

function buildBorderGeometry(countries) {
  const verts  = [];
  const BORDER_Y = 0.15;
  const sx = MAP_W / 360;
  const sz = MAP_H / 180;

  const addRing = (ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lon1, lat1] = ring[i];
      const [lon2, lat2] = ring[i + 1];
      verts.push(
         lon1 * sx, BORDER_Y, -lat1 * sz,
         lon2 * sx, BORDER_Y, -lat2 * sz,
      );
    }
  };

  for (const f of countries.features) {
    const g = f.geometry;
    if (g.type === 'Polygon')      g.coordinates.forEach(addRing);
    if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(addRing));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

// ── The textured plane (suspends until the texture file is ready) ──────────

function MapPlane({ bumpTex }) {
  const colorTex = useLoader(TextureLoader, '/textures/world_map.jpg');
  colorTex.colorSpace = THREE.SRGBColorSpace;
  // Prevent the texture repeating at the date-line / poles
  colorTex.wrapS = THREE.ClampToEdgeWrapping;
  colorTex.wrapT = THREE.ClampToEdgeWrapping;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.12, 0]}
      receiveShadow
    >
      {/*
        256×128 segments = enough geometry for the bump light to create
        visible relief on the mountain ranges.
      */}
      <planeGeometry args={[MAP_W, MAP_H, 256, 128]} />
      <meshStandardMaterial
        map={colorTex}
        bumpMap={bumpTex ?? null}
        bumpScale={bumpTex ? 2.5 : 0}
        roughness={0.88}
        metalness={0.0}
      />
    </mesh>
  );
}

// ── Loading placeholder shown while the jpg is fetching ───────────────────

function MapPlaceholder() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
      <planeGeometry args={[MAP_W, MAP_H]} />
      <meshLambertMaterial color={0x0a1828} />
    </mesh>
  );
}

// ── Root component ─────────────────────────────────────────────────────────

export default function WorldMap() {
  const [countries, setCountries] = useState(null);

  // Fetch world atlas TopoJSON (country outlines) once
  useEffect(() => {
    fetch(TOPO_URL)
      .then(r => r.json())
      .then(topo => setCountries(topojson.feature(topo, topo.objects.countries)))
      .catch(console.error);
  }, []);

  // Build bump texture + border LineSegments when TopoJSON arrives
  const assets = useMemo(() => {
    if (!countries) return null;
    const bumpTex   = buildBumpTexture(countries);
    const borderGeo = buildBorderGeometry(countries);
    const borderMat = new THREE.LineBasicMaterial({
      color:       0xffffff,
      transparent: true,
      opacity:     0.28,
    });
    return {
      bumpTex,
      borders: new THREE.LineSegments(borderGeo, borderMat),
    };
  }, [countries]);

  return (
    <group>
      {/* Real topographic texture — suspense shows placeholder while loading */}
      <Suspense fallback={<MapPlaceholder />}>
        <MapPlane bumpTex={assets?.bumpTex ?? null} />
      </Suspense>

      {/* Crisp 3D border lines, appear once TopoJSON is parsed */}
      {assets && <primitive object={assets.borders} />}
    </group>
  );
}
