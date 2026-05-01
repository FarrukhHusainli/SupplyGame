export default function SceneBackground({ lightMode }) {
  return (
    <>
      <ambientLight color={0xffffff} intensity={lightMode ? 1.2 : 0.5} />
      <directionalLight position={[10, 20, 10]} intensity={lightMode ? 1.2 : 0.9} color={0xffffff} />
      <directionalLight position={[-8, 10, -10]} intensity={0.25} color={lightMode ? 0xffffff : 0x8eb4ff} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshLambertMaterial color={lightMode ? 0xf8fafc : 0x0d1627} />
      </mesh>

      {/* Grid */}
      <gridHelper
        args={[200, 50, lightMode ? 0x000000 : 0x1e2d4a, lightMode ? 0x333333 : 0x172035]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}
