import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbitData {
  name: string;
  type: 'planet' | 'moon' | 'comet';
  parent?: string;
  vertices: [number, number, number][];
}

export function OrbitLines({ visible }: { visible: boolean }) {
  const [orbits, setOrbits] = useState<OrbitData[]>([]);

  useEffect(() => {
    fetch('/orbits.json?v=' + Date.now())
      .then(res => res.json())
      .then(data => setOrbits(data))
      .catch(err => console.error("Failed to load orbits:", err));
  }, []);

  if (!visible || orbits.length === 0) return null;

  return (
    <group>
      {orbits.map((orbit) => (
        <OrbitLine key={orbit.name} orbit={orbit} />
      ))}
    </group>
  );
}

function OrbitLine({ orbit }: { orbit: OrbitData }) {
  const ref = useRef<any>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const points = orbit.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    geo.setFromPoints(points);
    return geo;
  }, [orbit.vertices]);
  
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
  }, []);

  useFrame(({ scene }) => {
    if (orbit.type === 'moon' && orbit.parent && ref.current) {
      const parentNode = scene.getObjectByName(orbit.parent);
      if (parentNode) {
        const pos = new THREE.Vector3();
        parentNode.getWorldPosition(pos);
        ref.current.position.copy(pos);
      }
    }
  });

  return (
    <line ref={ref} geometry={geometry} material={material} renderOrder={-1} />
  );
}
