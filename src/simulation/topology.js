/**
 * Topological sort of warehouse names by their pipe connections.
 * Sources (no incoming pipes) come first; sinks last.
 * @param {string[]} whNames
 * @param {Array<{from,to}>} pipes
 * @returns {string[]}
 */
export function sortWarehousesTopological(whNames, pipes) {
  const sorted = [];
  const visited = new Set();

  const visit = (name) => {
    if (visited.has(name)) return;
    pipes
      .filter((c) => c.to === name && whNames.includes(c.from))
      .forEach((c) => visit(c.from));
    visited.add(name);
    sorted.push(name);
  };

  whNames.forEach(visit);
  return sorted;
}
