/**
 * Module-level mutable drag state.
 * Updated every frame by DragController — no React reactivity needed.
 * Nodes read it inside useFrame to avoid per-frame re-renders.
 */
export const dragState = {
  candidate: null,   // { id, type } | null  — set on pointerDown
  activated: false,  // true once mouse moves past DRAG_THRESHOLD
  moved: false,      // true if activated + moved (suppresses the click)
  needsInit: true,   // true until the first valid raycast after pointerDown

  // The ground-plane hit on the very first frame (threshold reference)
  startHit: [0, 0],

  // Pick offset: node's base position minus the first ground hit
  // Keeps the node "stuck" to where you grabbed it (no jump to cursor)
  offsetX: 0,
  offsetZ: 0,

  // Node's base x/z set on pointerDown (used to compute the pick offset)
  nodeBaseX: 0,
  nodeBaseZ: 0,

  // The node's original y — preserved when saving so it never sinks underground
  originalY: 0.5,

  // Current computed group position [x, 0, z] (offset already applied)
  pos: [0, 0, 0],
};
