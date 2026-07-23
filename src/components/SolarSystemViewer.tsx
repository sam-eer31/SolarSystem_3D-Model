import { Suspense, useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations, Trail, useTexture } from '@react-three/drei'
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

function SpaceBackground({ onSelectBody }: { onSelectBody: (body: string | null) => void }) {
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
        const dist = Math.hypot(e.clientX - globalPointerState.x, e.clientY - globalPointerState.y);
        if (dist < 10) {
          onSelectBody(globalPointerState.body);
        }
        globalPointerState.body = null;
      }}
    >
      <sphereGeometry args={[50000, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  )
}

function CameraTracker({ selectedBody, flightTrigger }: { selectedBody: string | null, flightTrigger: number }) {
  const { scene, camera, size } = useThree()
  const controlsRef = useRef<any>(null)
  
  const targetVec = useMemo(() => new THREE.Vector3(), [])
  const prevTargetVec = useRef(new THREE.Vector3())
  const isTransitioning = useRef(false)
  const prevSelected = useRef(selectedBody)
  const prevFlightTrigger = useRef(flightTrigger)

  useEffect(() => {
    
    if (selectedBody) {
      camera.setViewOffset(size.width, size.height, -(size.width * 0.25), 0, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
  }, [selectedBody, camera, size])

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    
    // Synchronous state check to prevent 1-frame race conditions
    if (selectedBody !== prevSelected.current || flightTrigger !== prevFlightTrigger.current) {
      isTransitioning.current = true;
      if (selectedBody) {
        const node = scene.getObjectByName(selectedBody)
        if (node) node.getWorldPosition(prevTargetVec.current);
      }
      prevSelected.current = selectedBody;
      prevFlightTrigger.current = flightTrigger;
    }
    
    if (selectedBody) {
      const node = scene.getObjectByName(selectedBody)
      if (node) {
        node.getWorldPosition(targetVec)
        
        // Calculate instantaneous velocity of the planet
        const velocity = targetVec.clone().sub(prevTargetVec.current);
        
        if (isTransitioning.current) {
          // Apply planetary velocity to camera so it stays in the planet's inertial frame during flight
          controlsRef.current.target.add(velocity);
          camera.position.add(velocity);
          
          controlsRef.current.target.lerp(targetVec, 4.0 * delta);
          
          let safeDist = BODY_RADII[selectedBody] ? Math.max(BODY_RADII[selectedBody] * 4.0, 0.05) : 10.0;
          if (selectedBody === 'Sun') safeDist = 45.0;
          
          // Dynamically adjust distance based on screen aspect ratio
          // Base framing is optimized for 16:9 (1.77 aspect ratio)
          const aspect = size.width / size.height;
          const fovAdjustment = Math.min(Math.max(1.77 / aspect, 0.6), 4.0);
          safeDist *= fovAdjustment;
          
          const idealOffset = new THREE.Vector3(0, safeDist/3, safeDist);
          const currentOffset = camera.position.clone().sub(controlsRef.current.target);
          
          currentOffset.lerp(idealOffset, 4.0 * delta);
          camera.position.copy(controlsRef.current.target).add(currentOffset);
          
          // Wait for BOTH target and offset to arrive before locking
          if (controlsRef.current.target.distanceTo(targetVec) < 0.1 && currentOffset.distanceTo(idealOffset) < 1.0) {
            isTransitioning.current = false;
          }
        } else {
          // Hard lock tracking (pure translation, no orbital rotation mapping)
          camera.position.add(velocity);
          controlsRef.current.target.copy(targetVec);
        }
        
        prevTargetVec.current.copy(targetVec);
      }
    } else if (isTransitioning.current) {
      const defaultTarget = new THREE.Vector3(0, 0, 0);
      const defaultPos = new THREE.Vector3(0, 40, 150);
      
      controlsRef.current.target.lerp(defaultTarget, 2.0 * delta);
      camera.position.lerp(defaultPos, 2.0 * delta);
      
      if (controlsRef.current.target.distanceTo(defaultTarget) < 0.1 && camera.position.distanceTo(defaultPos) < 1.0) {
        isTransitioning.current = false;
      }
    }
    
    controlsRef.current.update()
  })

  return (
    <OrbitControls 
      ref={controlsRef}
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
    "Pluto", "Charon", "HalleysComet", "Comet67P"
  ];

  return (
    <group>
      <primitive object={scene} />
      <CometTail scene={scene as THREE.Group} cometName="HalleysComet" options={options} />
      <CometTail scene={scene as THREE.Group} cometName="Comet67P" options={options} />
      
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

function CometTail({ scene, cometName, options }: { scene: THREE.Group, cometName: string, options: ViewerOptions }) {
  const cometMeshRef = useRef<THREE.Object3D | null>(null)
  const targetRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const prevPosRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const [canRender, setCanRender] = useState(true)
  
  useEffect(() => {
    scene.traverse((node) => {
      if (node.name === cometName) {
        cometMeshRef.current = node
        setReady(true)
      }
    })
  }, [scene, cometName])
  
  useFrame(() => {
    if (cometMeshRef.current && targetRef.current) {
      // Force matrix update to ensure we get exact animation position
      cometMeshRef.current.updateMatrixWorld(true)
      const pos = new THREE.Vector3()
      cometMeshRef.current.getWorldPosition(pos)
      
      // Update proxy target instantly so Trail always reads correct position
      targetRef.current.position.copy(pos)
      
      if (prevPosRef.current.lengthSq() > 0) {
        const dist = pos.distanceTo(prevPosRef.current)
        if (dist > 20.0) {
          // Teleportation jump detected! Hide trail temporarily to prevent cross-system line
          setCanRender(false)
        } else if (!canRender) {
          setCanRender(true)
        }
      }
      
      prevPosRef.current.copy(pos)
    }
  })
  
  if (!ready) return null;
  
  // Calculate dynamic tail masking instead of resizing buffer
  const maxFrames = 150;
  const tailFrames = Math.min(maxFrames, Math.max(3, Math.floor(maxFrames / Math.max(0.01, options.animationSpeed))));
  const visibleRatio = tailFrames / maxFrames;
  const threshold = 1.0 - visibleRatio;

  return (
    <>
      <group ref={targetRef} />
      {options.showComets && options.showOrbits && canRender && (
        <Trail
          width={1.5}
          length={maxFrames} 
          color={new THREE.Color('#88ccff')}
          attenuation={(t) => {
            if (t <= threshold) return 0;
            const normalizedT = (t - threshold) / (1.0 - threshold);
            return normalizedT * normalizedT;
          }} 
          target={targetRef}
        />
      )}
    </>
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
        <SpaceBackground onSelectBody={onSelectBody} />
        
        {url && <Model url={url} options={options} selectedBody={selectedBody} onSelectBody={onSelectBody} onReady={onModelReady} />}
      </Suspense>

      <CameraTracker selectedBody={selectedBody} flightTrigger={flightTrigger} />
    </Canvas>
  )
}


