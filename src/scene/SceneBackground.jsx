/**
 * Scene lighting and ground plane.
 */
export default function SceneBackground() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight color={0xffffff} intensity={0.5} />

      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.9}
        color={0xffffff}
      />

      {/* Subtle fill light from opposite side */}
      <directionalLight
        position={[-8, 10, -10]}
        intensity={0.25}
        color={0x8eb4ff}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color={0x0d1627} />
      </mesh>

      {/* Subtle grid helper */}
      <gridHelper args={[200, 50, 0x1e2d4a, 0x172035]} position={[0, -0.1, 0]} />
    </>
  );
}
