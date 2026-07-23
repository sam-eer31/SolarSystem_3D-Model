import { Suspense, useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations, useTexture } from '@react-three/drei'
import * as THREE from 'three'

export type ViewerOptions = {
  showOrbits: boolean;
  showMoons: boolean;
  showAsteroids: boolean;
  showAtmospheres: boolean;
  showRings: boolean;
  showComets: boolean;
  animationSpeed: number;
};

export type ViewerProps = {
  url: string | null;
  onModelReady: () => void;
  realisticLighting: boolean;
  options: ViewerOptions;
  selectedBody: string | null;
  flightTrigger: number;
  onSelectBody: (body: string | null) => void;
};

const globalPointerState = {
  body: null as string | null,
  x: 0,
  y: 0
};

function SpaceBackground() {
  const texture = useTexture('/8k_stars_milky_way.jpg')
  return (
    <mesh 
      onPointerDown={(e) => { 
        e.stopPropagation(); 
        globalPointerState.body = null;
        globalPointerState.x = e.clientX;
        globalPointerState.y = e.clientY;
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        globalPointerState.body = null;
      }}
    >
      <sphereGeometry args={[50000, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  )
}

const PARENTS: Record<string, string> = {
  "Moon": "Earth",
  "Phobos": "Mars", "Deimos": "Mars",
  "Io": "Jupiter", "Europa": "Jupiter", "Ganymede": "Jupiter", "Callisto": "Jupiter", "Amalthea": "Jupiter", "Himalia": "Jupiter",
  "Mimas": "Saturn", "Enceladus": "Saturn", "Tethys": "Saturn", "Dione": "Saturn", "Rhea": "Saturn", "Titan": "Saturn", "Iapetus": "Saturn",
  "Miranda": "Uranus", "Ariel": "Uranus", "Umbriel": "Uranus", "Titania": "Uranus", "Oberon": "Uranus",
  "Proteus": "Neptune", "Triton": "Neptune", "Nereid": "Neptune",
  "Charon": "Pluto"
};

function CameraTracker({ selectedBody, flightTrigger }: { selectedBody: string | null, flightTrigger: number }) {
  const { scene, camera, size } = useThree()
  const controlsRef = useRef<any>(null)
  
  const targetVec = useMemo(() => new THREE.Vector3(), [])
  const prevTargetVec = useRef(new THREE.Vector3())
  const prevParentVec = useRef<THREE.Vector3 | null>(null)
  const isTransitioning = useRef(false)
  const prevSelected = useRef(selectedBody)
  const prevFlightTrigger = useRef(flightTrigger)

  useEffect(() => {
    if (selectedBody) {
      camera.setViewOffset(size.width, size.height, -(size.width * 0.25), 0, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  }, [selectedBody, camera, size])

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    
    if (selectedBody !== prevSelected.current || flightTrigger !== prevFlightTrigger.current) {
      isTransitioning.current = true;
      if (selectedBody) {
        const node = scene.getObjectByName(selectedBody)
        if (node) node.getWorldPosition(prevTargetVec.current);
      }
      prevSelected.current = selectedBody;
      prevFlightTrigger.current = flightTrigger;
      prevParentVec.current = null;
    }
    
    if (selectedBody) {
      const node = scene.getObjectByName(selectedBody)
      if (node) {
        node.getWorldPosition(targetVec)
        
        const velocity = targetVec.clone().sub(prevTargetVec.current);
        
        if (isTransitioning.current) {
          controlsRef.current.target.add(velocity);
          camera.position.add(velocity);
          
          controlsRef.current.target.lerp(targetVec, 4.0 * delta);
          
          let safeDist = BODY_RADII[selectedBody] ? Math.max(BODY_RADII[selectedBody] * 6.0, 0.4) : 10.0;
          if (selectedBody === 'Sun') safeDist = 60.0;
          if (selectedBody === 'Saturn') safeDist = 35.0; 
          
          const aspect = size.width / size.height;
          const fovAdjustment = Math.min(Math.max(1.77 / aspect, 0.6), 4.0);
          safeDist *= fovAdjustment;
          
          const idealOffset = new THREE.Vector3(0, safeDist/3, safeDist);
          const currentOffset = camera.position.clone().sub(controlsRef.current.target);
          
          currentOffset.lerp(idealOffset, 4.0 * delta);
          camera.position.copy(controlsRef.current.target).add(currentOffset);
          
          const targetThreshold = Math.max(safeDist * 0.005, 0.005);
          const offsetThreshold = Math.max(safeDist * 0.01, 0.01);
          
          if (controlsRef.current.target.distanceTo(targetVec) < targetThreshold && currentOffset.distanceTo(idealOffset) < offsetThreshold) {
            isTransitioning.current = false;
          }
        } else {
          // Orbital Tidal Lock tracking
          let revolved = false;
          const parentName = PARENTS[selectedBody] || (selectedBody === 'Sun' ? null : 'Sun');
          
          if (parentName) {
            const parentNode = scene.getObjectByName(parentName);
            if (parentNode) {
              const parentPos = new THREE.Vector3();
              parentNode.getWorldPosition(parentPos);
              
              if (prevParentVec.current) {
                const R_prev = prevTargetVec.current.clone().sub(prevParentVec.current).normalize();
                const R_curr = targetVec.clone().sub(parentPos).normalize();
                
                if (R_prev.lengthSq() > 0.1 && R_curr.lengthSq() > 0.1) {
                  // Calculate the exact angular rotation of the orbit in this frame
                  const q = new THREE.Quaternion().setFromUnitVectors(R_prev, R_curr);
                  // Apply that exact rotation to the camera so the parent stays perfectly still in the background
                  const offset = camera.position.clone().sub(prevTargetVec.current);
                  offset.applyQuaternion(q);
                  
                  camera.position.copy(targetVec).add(offset);
                  controlsRef.current.target.copy(targetVec);
                  revolved = true;
                }
              }
              prevParentVec.current = parentPos;
            }
          }
          
          if (!revolved) {
            camera.position.add(velocity);
            controlsRef.current.target.copy(targetVec);
          }
        }
        
        prevTargetVec.current.copy(targetVec);
      }
    } else if (isTransitioning.current) {
      const defaultTarget = new THREE.Vector3(0, 0, 0);
      const defaultPos = new THREE.Vector3(0, 40, 150);
      
      controlsRef.current.target.lerp(defaultTarget, 4.0 * delta);
      camera.position.lerp(defaultPos, 4.0 * delta);
      
      // Use much larger thresholds so it doesn't get stuck due to floating point errors over huge distances
      if (controlsRef.current.target.distanceTo(defaultTarget) < 1.0 && camera.position.distanceTo(defaultPos) < 2.0) {
        controlsRef.current.target.copy(defaultTarget);
        camera.position.copy(defaultPos);
        isTransitioning.current = false;
      }
    }
    
    controlsRef.current.update()
  })

  return (
    <OrbitControls 
      ref={controlsRef}
      enableDamping={false}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.01} 
      maxDistance={50000} 
      zoomSpeed={0.8}
      panSpeed={0.5}
      rotateSpeed={0.5}
      makeDefault
      onStart={() => { isTransitioning.current = false; }}
    />
  )
}

const BODY_RADII: Record<string, number> = {
  "Sun": 8.0,
  "Mercury": 0.38,
  "Venus": 0.95,
  "Earth": 1.0,
  "Moon": 0.20,
  "Mars": 0.53,
  "Phobos": 0.02,
  "Deimos": 0.02,
  "Jupiter": 3.6,
  "Amalthea": 0.02,
  "Io": 0.18,
  "Europa": 0.15,
  "Ganymede": 0.27,
  "Callisto": 0.24,
  "Himalia": 0.02,
  "Saturn": 3.0,
  "Mimas": 0.02,
  "Enceladus": 0.03,
  "Tethys": 0.05,
  "Dione": 0.05,
  "Rhea": 0.07,
  "Titan": 0.26,
  "Iapetus": 0.07,
  "Uranus": 1.6,
  "Miranda": 0.03,
  "Ariel": 0.07,
  "Umbriel": 0.07,
  "Titania": 0.10,
  "Oberon": 0.10,
  "Neptune": 1.6,
  "Proteus": 0.03,
  "Triton": 0.17,
  "Nereid": 0.02,
  "Pluto": 0.15,
  "Charon": 0.07,
  "HalleysComet": 0.08,
  "Comet67P": 0.06,
  "Ceres": 0.07,
  "Vesta": 0.04,
  "Pallas": 0.04,
  "Hygiea": 0.03,
  "Eris": 0.18,
  "Haumea": 0.12,
  "Makemake": 0.11,
  "Sedna": 0.08
};

function InteractiveBody({ name, scene, hoveredBody, selectedBody, onSelect, onHover }: any) {
  const ref = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const targetVec = useMemo(() => new THREE.Vector3(), [])
  const radius = BODY_RADII[name] || 1.0;
  const isHovered = hoveredBody === name;
  const isSelected = selectedBody === name;
  const [camDist, setCamDist] = useState(10);

  const hoverGap = Math.max(0.01, Math.min(radius * 0.05, 0.15));
  const baseThickness = Math.max(0.01, Math.min(radius * 0.05, 0.1));
  const distanceThickness = camDist * 0.004; 
  const hoverThickness = Math.max(baseThickness, distanceThickness);

  useFrame(({ camera }) => {
    const node = scene.getObjectByName(name);
    if (node && ref.current) {
      node.getWorldPosition(targetVec);
      ref.current.position.copy(targetVec);
      
      if (isHovered && !isSelected) {
        const dist = camera.position.distanceTo(targetVec);
        if (Math.abs(dist - camDist) > dist * 0.05) {
          setCamDist(dist);
        }
      }
      
      if (ringRef.current) {
        ringRef.current.position.copy(targetVec);
        ringRef.current.quaternion.copy(camera.quaternion);
      }
    }
  });

  return (
    <>
      <mesh 
        ref={ref} 
        onPointerDown={(e) => { 
          e.stopPropagation(); 
          globalPointerState.body = name;
          globalPointerState.x = e.clientX;
          globalPointerState.y = e.clientY;
        }}
        onPointerUp={(e) => { 
          e.stopPropagation(); 
          if (globalPointerState.body === name) {
            const dist = Math.hypot(e.clientX - globalPointerState.x, e.clientY - globalPointerState.y);
            if (dist < 10) onSelect(name);
          }
          globalPointerState.body = null;
        }}
        onClick={(e) => { e.stopPropagation(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(name); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      
      {isHovered && !isSelected && (
        <mesh ref={ringRef}>
          <ringGeometry args={[radius + hoverGap, radius + hoverGap + hoverThickness, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
      )}
    </>
  )
}

function Model({ url, options, selectedBody, onSelectBody, onReady }: { url: string, options: ViewerOptions, selectedBody: string | null, onSelectBody: (b: string|null) => void, onReady: () => void }) {
  const { scene, animations } = useGLTF(url)
  const { actions, mixer } = useAnimations(animations, scene)
  const [hoveredBody, setHoveredBody] = useState<string | null>(null)

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        action?.play()
      })
    }
    
    // HIGHLY IMPORTANT PERFORMANCE OPTIMIZATION
    // Disable raycasting on all complex/non-interactive meshes so the hover cursor doesn't lag the engine.
    scene.traverse((node: any) => {
      if (node.name.includes('OrbitPath') || node.name.includes('Atmosphere') || node.name.includes('Ring') || node.name.includes('Shadow')) {
        node.raycast = () => null;
      }
    });

    // Notify parent that the model has mounted and is parsing/rendering
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onReady();
      });
    });
  }, [scene, actions, onReady])
  
  useEffect(() => {
    if (mixer) {
      mixer.timeScale = options.animationSpeed;
    }
  }, [mixer, options.animationSpeed])

  useEffect(() => {
    const moonNames = [
      'Moon', 'Phobos', 'Deimos', 
      'Amalthea', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Himalia',
      'Mimas', 'Enceladus', 'Tethys', 'Dione', 'Rhea', 'Titan', 'Iapetus', 
      'Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon', 
      'Proteus', 'Triton', 'Nereid', 
      'Pluto', 'Charon'
    ];
    
    scene.traverse((node) => {
      if (node.name.includes('OrbitPath')) {
        if (node.name.includes('Comet')) {
          node.visible = options.showOrbits && options.showComets;
        } else {
          node.visible = options.showOrbits;
        }
        if ((node as any).material) {
          const mat = (node as any).material;
          mat.transparent = true;
          mat.opacity = 0.05;
          mat.depthWrite = false;
          mat.color.setHex(0xffffff);
        }
      }
      if (node.name.includes('Atmosphere') || node.name.includes('Clouds')) {
        if (node.name === 'TitanAtmosphere') {
          node.visible = options.showAtmospheres && options.showMoons;
        } else {
          node.visible = options.showAtmospheres;
        }
      }
      if (node.name.includes('AsteroidBelt') || node.name.includes('Trojan') || node.name.includes('KuiperBelt')) {
        node.visible = options.showAsteroids;
      }
      if (moonNames.includes(node.name)) {
        node.visible = options.showMoons;
      }
      if (node.name.includes('Ring') || node.name.includes('Shadow')) {
        node.visible = options.showRings;
      }
      if (node.name.includes('Comet')) {
        node.visible = options.showComets;
      }
    });
  }, [scene, options])

  const INTERACTIVE_BODIES = [
    "Sun", "Mercury", "Venus", "Earth", "Moon", "Mars", "Phobos", "Deimos",
    "Jupiter", "Amalthea", "Io", "Europa", "Ganymede", "Callisto", "Himalia",
    "Saturn", "Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Iapetus",
    "Uranus", "Miranda", "Ariel", "Umbriel", "Titania", "Oberon",
    "Neptune", "Proteus", "Triton", "Nereid",
    "Pluto", "Charon", "HalleysComet", "Comet67P",
    "Ceres", "Eris", "Haumea", "Makemake", "Sedna",
    "Vesta", "Pallas", "Hygiea"
  ];

  return (
    <group>
      <primitive object={scene} />
      
      {INTERACTIVE_BODIES.map(name => (
        <InteractiveBody 
          key={name} 
          name={name} 
          scene={scene} 
          hoveredBody={hoveredBody} 
          selectedBody={selectedBody}
          onSelect={onSelectBody} 
          onHover={setHoveredBody} 
        />
      ))}
    </group>
  )
}



export function SolarSystemViewer({ url, onModelReady, realisticLighting, options, selectedBody, flightTrigger, onSelectBody }: ViewerProps) {
  return (
    <Canvas 
      camera={{ position: [0, 40, 150], fov: 45, far: 100000 }}
      style={{ width: '100%', height: '100%', backgroundColor: '#020204', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#020204']} />
      
      {/* Lighting System */}
      {/* Realistic mode uses only the baked point light and a tiny bit of ambient light.
          Enhanced mode uses a hemisphere light to illuminate the dark sides beautifully. */}
      <ambientLight intensity={realisticLighting ? 0.02 : 0.4} />
      
      {!realisticLighting && (
        <hemisphereLight args={["#ffffff", "#222233", 1.5]} />
      )}
      
      <Suspense fallback={null}>
        <SpaceBackground />
        
        {url && <Model url={url} options={options} selectedBody={selectedBody} onSelectBody={onSelectBody} onReady={onModelReady} />}
        {url && <CameraTracker selectedBody={selectedBody} flightTrigger={flightTrigger} />}
      </Suspense>
    </Canvas>
  )
}


