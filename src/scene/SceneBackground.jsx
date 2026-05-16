export default function SceneBackground({ lightMode }) {
  return (
    <>
      {/* General fill — keeps the map readable without washing it out */}
      <ambientLight color={0xffffff} intensity={lightMode ? 1.6 : 0.85} />

      {/*
        Primary sun from the north-west (matches how the NASA topo texture
        was originally shaded, so the bump shadows line up with the painted
        relief on the texture).
      */}
      <directionalLight
        position={[-80, 200, -60]}
        intensity={lightMode ? 1.2 : 0.95}
        color={lightMode ? 0xfff8f0 : 0xfff0d0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Soft eastern bounce light */}
      <directionalLight
        position={[60, 100, 40]}
        intensity={0.3}
        color={lightMode ? 0xffffff : 0x88aadd}
      />

      {/* Sky / ground hemisphere */}
      <hemisphereLight args={[0x203060, 0x0a1428, lightMode ? 0.5 : 0.4]} />
    </>
  );
}
