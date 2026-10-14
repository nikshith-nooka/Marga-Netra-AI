import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Layers,
  Sparkles,
  GitFork,
  Radio,
  Eye,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Compass,
  Box,
  Building,
  Flame,
  CloudRain,
  Sun,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Clock,
  Gauge
} from 'lucide-react';
import type { RoadSegment, JunctionNode } from '../../types/neurax';

interface Network3DDigitalTwinProps {
  nodes: JunctionNode[];
  segments: RoadSegment[];
  onSelectRoad?: (segment: RoadSegment) => void;
  onTraceSpillback?: (segmentId: string) => void;
  onForecast?: (segmentId: string) => void;
  onPlanDiversion?: (segmentId: string) => void;
}

// Iconic Hyderabad Metropolitan Landmarks mapped to coordinate space
const METRO_LANDMARKS = [
  { name: 'HITEC Cyber Towers', x: 6, y: 5, height: 28, type: 'landmark' },
  { name: 'Gachibowli Financial Hub', x: 3, y: 7, height: 34, type: 'financial' },
  { name: 'Outer Ring Interchange', x: 10, y: 9, height: 22, type: 'interchange' },
  { name: 'Mindspace IT Park', x: 4, y: 4, height: 25, type: 'tech' },
  { name: 'Durgam Cable Bridge Link', x: 7, y: 3, height: 18, type: 'bridge' },
  { name: 'Madhapur Metro Hub', x: 8, y: 6, height: 20, type: 'transit' }
];

export const Network3DDigitalTwin: React.FC<Network3DDigitalTwinProps> = ({
  nodes,
  segments,
  onSelectRoad,
  onTraceSpillback,
  onForecast,
  onPlanDiversion
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // States
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<RoadSegment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingParticles, setIsPlayingParticles] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'topdown' | 'elevation' | 'flythrough'>('isometric');
  const [elevationMode, setElevationMode] = useState(false);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showBeacons, setShowBeacons] = useState(true);
  const [weatherMode, setWeatherMode] = useState<'neon' | 'sunset' | 'rain'>('neon');
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [shockwaveSegment, setShockwaveSegment] = useState<string | null>(null);

  // Node coordinate lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, JunctionNode>();
    nodes.forEach((n) => map.set(n.node_id, n));
    return map;
  }, [nodes]);

  // Normalization bounds to scale node coords into 3D world [-150, 150]
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });
    return { minX, maxX, minY, maxY };
  }, [nodes]);

  // World coordinate projection
  const toWorld = useCallback((x: number, y: number): [number, number] => {
    const rangeX = bounds.maxX - bounds.minX || 1;
    const rangeY = bounds.maxY - bounds.minY || 1;
    const wx = ((x - bounds.minX) / rangeX - 0.5) * 260;
    const wz = ((y - bounds.minY) / rangeY - 0.5) * 200;
    return [wx, wz];
  }, [bounds]);

  // Critical segments
  const criticalSegments = useMemo(() => {
    return segments.filter((s) => s.ai_risk_level === 'CRITICAL');
  }, [segments]);

  // References for Three.js engine
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roadMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const roadLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<{ positions: Float32Array; velocities: number[]; segIndices: number[]; tValues: number[] } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const buildingsGroupRef = useRef<THREE.Group | null>(null);
  const beaconsGroupRef = useRef<THREE.Group | null>(null);
  const shockwaveRingsRef = useRef<THREE.Mesh[]>([]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Background Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // slate-950
    scene.fog = new THREE.FogExp2(0x030712, 0.0035);
    sceneRef.current = scene;

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
    camera.position.set(0, 220, 260);
    cameraRef.current = camera;

    // 3. Renderer with Antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going beneath ground
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Ground Plane with Holographic Matrix Grid
    const groundSize = 400;
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Sub-ground reflective surface
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070d1a,
      roughness: 0.65,
      metalness: 0.8
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(0x818cf8, 2, 300);
    accentLight.position.set(0, 80, 0);
    scene.add(accentLight);

    // 7. Render 3D Road Conduits (Ribbons / Cylinders)
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    roadMeshesRef.current.clear();
    roadLinesRef.current.clear();

    segments.forEach((seg) => {
      const u = nodeMap.get(seg.source_node);
      const v = nodeMap.get(seg.target_node);
      if (!u || !v) return;

      const [x1, z1] = toWorld(u.x, u.y);
      const [x2, z2] = toWorld(v.x, v.y);

      // Height elevation based on congestion
      const elev = elevationMode
        ? (seg.ai_risk_level === 'CRITICAL' ? 22 : seg.ai_risk_level === 'ELEVATED' ? 12 : 2)
        : 0;

      const p1 = new THREE.Vector3(x1, elev, z1);
      const p2 = new THREE.Vector3(x2, elev, z2);

      // Color coding
      let colorHex = 0x334155; // default slate
      let emissiveHex = 0x0f172a;
      let emissiveIntensity = 0.4;
      let tubeRadius = 0.55;

      if (seg.ai_risk_level === 'CRITICAL') {
        colorHex = 0xf43f5e; // rose neon
        emissiveHex = 0xe11d48;
        emissiveIntensity = 1.6;
        tubeRadius = 1.1;
      } else if (seg.ai_risk_level === 'ELEVATED') {
        colorHex = 0xf59e0b; // amber neon
        emissiveHex = 0xd97706;
        emissiveIntensity = 1.1;
        tubeRadius = 0.85;
      } else if (seg.speed_ratio > 0.75) {
        colorHex = 0x10b981; // emerald flow
        emissiveHex = 0x059669;
        emissiveIntensity = 0.8;
        tubeRadius = 0.65;
      }

      // 3D Tube Geometry
      const path = new THREE.LineCurve3(p1, p2);
      const tubeGeo = new THREE.TubeGeometry(path, 4, tubeRadius, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.3,
        metalness: 0.6
      });

      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.userData = { segment: seg, originalColor: colorHex };
      mesh.castShadow = true;
      roadGroup.add(mesh);
      roadMeshesRef.current.set(seg.segment_id, mesh);
    });

    // 8. Junction Towers / Signal Beacons
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    nodes.forEach((n) => {
      const [wx, wz] = toWorld(n.x, n.y);
      const isSignal = n.is_signalized;

      // Base cylinder
      const baseGeo = new THREE.CylinderGeometry(isSignal ? 1.6 : 0.9, isSignal ? 1.8 : 1.0, 1.2, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: isSignal ? 0x0284c7 : 0x475569,
        emissive: isSignal ? 0x38bdf8 : 0x1e293b,
        emissiveIntensity: isSignal ? 1.2 : 0.3
      });
      const nodeMesh = new THREE.Mesh(baseGeo, baseMat);
      nodeMesh.position.set(wx, 0.6, wz);
      nodesGroup.add(nodeMesh);

      // Halo ring for signalized junctions
      if (isSignal) {
        const ringGeo = new THREE.RingGeometry(2.0, 2.4, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(wx, 0.1, wz);
        nodesGroup.add(ringMesh);
      }
    });

    // 9. Procedural 3D City Skyline / Holographic Buildings
    const buildingsGroup = new THREE.Group();
    buildingsGroupRef.current = buildingsGroup;
    scene.add(buildingsGroup);

    // Create Cyber City Architecture Blocks
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingEdges = new THREE.EdgesGeometry(buildingGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.7 });

    // Seeded procedural buildings around the grid junctions
    for (let bx = bounds.minX; bx <= bounds.maxX; bx += 1.8) {
      for (let by = bounds.minY; by <= bounds.maxY; by += 1.8) {
        const [wx, wz] = toWorld(bx + (Math.sin(bx * 7 + by) * 0.4), by + (Math.cos(by * 5) * 0.4));
        // Avoid placing on road centers
        const isNearCenter = Math.abs(wx) < 15 && Math.abs(wz) < 15;
        const bHeight = isNearCenter ? 26 + (Math.sin(wx) * 14) : 8 + ((bx * 3 + by * 7) % 24);
        const bWidth = 6 + ((bx + by) % 4);
        const bDepth = 6 + ((bx * 2) % 4);

        const bMat = new THREE.MeshStandardMaterial({
          color: 0x09101f,
          roughness: 0.8,
          metalness: 0.3,
          transparent: true,
          opacity: 0.85
        });

        const bMesh = new THREE.Mesh(buildingGeo, bMat);
        bMesh.scale.set(bWidth, bHeight, bDepth);
        bMesh.position.set(wx + 4, bHeight / 2, wz + 4);
        bMesh.castShadow = true;
        buildingsGroup.add(bMesh);

        // Neon roof edge highlight
        const wireframe = new THREE.LineSegments(buildingEdges, lineMat);
        wireframe.scale.set(bWidth, bHeight, bDepth);
        wireframe.position.copy(bMesh.position);
        buildingsGroup.add(wireframe);
      }
    }

    // Iconic Landmarks
    METRO_LANDMARKS.forEach((lm) => {
      const [lx, lz] = toWorld(lm.x, lm.y);
      const lmGeo = new THREE.CylinderGeometry(2, 4.5, lm.height, 6);
      const lmMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x6366f1,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8
      });
      const lmMesh = new THREE.Mesh(lmGeo, lmMat);
      lmMesh.position.set(lx - 2, lm.height / 2, lz - 2);
      buildingsGroup.add(lmMesh);

      // Floating landmark crown ring
      const crownGeo = new THREE.TorusGeometry(3.5, 0.4, 8, 24);
      const crownMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true });
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.set(lx - 2, lm.height + 1, lz - 2);
      crownMesh.rotation.x = Math.PI / 2;
      buildingsGroup.add(crownMesh);
    });

    // 10. Critical Bottleneck Holographic Laser Beacons & Shockwave Discs
    const beaconsGroup = new THREE.Group();
    beaconsGroupRef.current = beaconsGroup;
    scene.add(beaconsGroup);

    criticalSegments.slice(0, 5).forEach((seg) => {
      const u = nodeMap.get(seg.source_node);
      if (!u) return;
      const [bx, bz] = toWorld(u.x, u.y);

      // Vertical laser beam
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.8, 80, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.65
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(bx, 40, bz);
      beaconsGroup.add(beam);

      // Ground shockwave pulsating disk
      const diskGeo = new THREE.RingGeometry(1, 8, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.rotation.x = -Math.PI / 2;
      disk.position.set(bx, 0.3, bz);
      beaconsGroup.add(disk);
      shockwaveRingsRef.current.push(disk);
    });

    // 11. 3D Particle Vehicle Flow System (Hundreds of animated light packets)
    const particleCount = 1400;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];
    const segIndices: number[] = [];
    const tValues: number[] = [];

    const activeSegArray = segments.filter((s) => s.flow_vph > 0);

    for (let i = 0; i < particleCount; i++) {
      const segIndex = Math.floor(Math.random() * activeSegArray.length);
      const seg = activeSegArray[segIndex];
      const t = Math.random();

      const u = nodeMap.get(seg.source_node);
      const v = nodeMap.get(seg.target_node);
      if (u && v) {
        const [x1, z1] = toWorld(u.x, u.y);
        const [x2, z2] = toWorld(v.x, v.y);
        particlePositions[i * 3] = x1 + (x2 - x1) * t;
        particlePositions[i * 3 + 1] = 0.8;
        particlePositions[i * 3 + 2] = z1 + (z2 - z1) * t;
      }

      // Color by speed ratio
      const color = new THREE.Color(
        seg.ai_risk_level === 'CRITICAL' ? 0xf43f5e : seg.ai_risk_level === 'ELEVATED' ? 0xf59e0b : 0x38bdf8
      );
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;

      // Speed proportional to corridor flow velocity
      particleVelocities.push(0.003 + (seg.speed_kmh / 70) * 0.012);
      segIndices.push(segIndex);
      tValues.push(t);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;
    particleDataRef.current = { positions: particlePositions, velocities: particleVelocities, segIndices, tValues };

    // 12. Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      controls.update();

      // Animate Vehicles / Particles
      if (isPlayingParticles && particleDataRef.current && particlesRef.current) {
        const pData = particleDataRef.current;
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          pData.tValues[i] += pData.velocities[i];
          if (pData.tValues[i] > 1.0) {
            pData.tValues[i] = 0;
          }

          const seg = activeSegArray[pData.segIndices[i]];
          const u = nodeMap.get(seg.source_node);
          const v = nodeMap.get(seg.target_node);
          if (u && v) {
            const [x1, z1] = toWorld(u.x, u.y);
            const [x2, z2] = toWorld(v.x, v.y);
            const t = pData.tValues[i];
            const elev = elevationMode
              ? (seg.ai_risk_level === 'CRITICAL' ? 22 : seg.ai_risk_level === 'ELEVATED' ? 12 : 2)
              : 0;

            posAttr.setXYZ(i, x1 + (x2 - x1) * t, elev + 0.9, z1 + (z2 - z1) * t);
          }
        }
        posAttr.needsUpdate = true;
      }

      // Animate Shockwave Rings pulsing
      shockwaveRingsRef.current.forEach((ring, idx) => {
        const s = 1 + ((elapsed * 2 + idx) % 3);
        ring.scale.set(s, s, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - (s / 4));
      });

      renderer.render(scene, camera);
    };

    animate();

    // 13. Raycasting for 3D Click & Hover Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(roadMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const seg = hit.userData.segment as RoadSegment;
        setHoveredSegment(seg);
        container.style.cursor = 'pointer';
      } else {
        setHoveredSegment(null);
        container.style.cursor = 'grab';
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // only left click
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(roadMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const seg = hit.userData.segment as RoadSegment;
        setSelectedSegment(seg);
        onSelectRoad?.(seg);

        // Smoothly orbit camera to focus on this corridor
        const u = nodeMap.get(seg.source_node);
        if (u) {
          const [tx, tz] = toWorld(u.x, u.y);
          controls.target.set(tx, 0, tz);
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onPointerDown);

    // 14. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onPointerDown);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes, segments, elevationMode, toWorld, nodeMap, isPlayingParticles, onSelectRoad, criticalSegments]);

  // Handle Camera Presets
  const applyCameraPreset = (preset: 'isometric' | 'topdown' | 'elevation' | 'flythrough') => {
    setCameraPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'isometric') {
      cam.position.set(0, 220, 240);
      ctrl.target.set(0, 0, 0);
      setElevationMode(false);
    } else if (preset === 'topdown') {
      cam.position.set(0, 360, 1);
      ctrl.target.set(0, 0, 0);
      setElevationMode(false);
    } else if (preset === 'elevation') {
      cam.position.set(-160, 180, 200);
      ctrl.target.set(0, 10, 0);
      setElevationMode(true);
    } else if (preset === 'flythrough') {
      cam.position.set(0, 35, 120);
      ctrl.target.set(0, 15, -40);
      setElevationMode(false);
    }
    ctrl.update();
  };

  // Trigger Shockwave Wave Simulation
  const triggerShockwaveScan = () => {
    setShockwaveActive(true);
    const target = criticalSegments[0]?.segment_id || 'R0435';
    setShockwaveSegment(target);

    // Camera target focus
    const seg = segments.find((s) => s.segment_id === target);
    if (seg && cameraRef.current && controlsRef.current) {
      const u = nodeMap.get(seg.source_node);
      if (u) {
        const [wx, wz] = toWorld(u.x, u.y);
        controlsRef.current.target.set(wx, 5, wz);
      }
    }

    setTimeout(() => {
      setShockwaveActive(false);
    }, 4500);
  };

  // Weather atmosphere toggles
  const applyWeather = (mode: 'neon' | 'sunset' | 'rain') => {
    setWeatherMode(mode);
    if (!sceneRef.current) return;
    if (mode === 'neon') {
      sceneRef.current.background = new THREE.Color(0x030712);
      sceneRef.current.fog = new THREE.FogExp2(0x030712, 0.0035);
    } else if (mode === 'sunset') {
      sceneRef.current.background = new THREE.Color(0x180d19);
      sceneRef.current.fog = new THREE.FogExp2(0x180d19, 0.003);
    } else if (mode === 'rain') {
      sceneRef.current.background = new THREE.Color(0x04111d);
      sceneRef.current.fog = new THREE.FogExp2(0x04111d, 0.0045);
    }
  };

  // Toggle building visibility
  useEffect(() => {
    if (buildingsGroupRef.current) {
      buildingsGroupRef.current.visible = showBuildings;
    }
  }, [showBuildings]);

  // Toggle laser beacons visibility
  useEffect(() => {
    if (beaconsGroupRef.current) {
      beaconsGroupRef.current.visible = showBeacons;
    }
  }, [showBeacons]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[620px]'}`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Glassmorphic HUD Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none flex-wrap">
        {/* Left Title & Status */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">3D Digital Twin Spatial Scope</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                WebGL 2.0 Real-Time
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{nodes.length} Nodes</span>
              <span>•</span>
              <span>{segments.length} Conduits</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">1,400 Photons Active</span>
            </div>
          </div>
        </div>

        {/* Center Camera Perspective Switcher */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-1 text-xs">
          <button
            onClick={() => applyCameraPreset('isometric')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${cameraPreset === 'isometric' ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Isometric</span>
          </button>

          <button
            onClick={() => applyCameraPreset('elevation')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${cameraPreset === 'elevation' ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3D Heat Elevation</span>
          </button>

          <button
            onClick={() => applyCameraPreset('flythrough')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${cameraPreset === 'flythrough' ? 'bg-indigo-500 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Street Slant</span>
          </button>

          <button
            onClick={() => applyCameraPreset('topdown')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${cameraPreset === 'topdown' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar Top-Down</span>
          </button>
        </div>

        {/* Right Tools & Fullscreen */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-1.5">
          {/* Shockwave Scan Button */}
          <button
            onClick={triggerShockwaveScan}
            title="Simulate 3D Backward Shockwave Pulse"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${shockwaveActive ? 'bg-rose-500 text-white animate-bounce' : 'bg-slate-800 text-rose-300 hover:bg-rose-950/60 border border-rose-500/30'}`}
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>{shockwaveActive ? 'Scanning Wave...' : 'Pulse Shockwave'}</span>
          </button>

          {/* Toggle Flow Animation */}
          <button
            onClick={() => setIsPlayingParticles(!isPlayingParticles)}
            title={isPlayingParticles ? 'Pause Traffic Stream' : 'Resume Traffic Stream'}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            {isPlayingParticles ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Atmosphere Mode */}
          <button
            onClick={() => applyWeather(weatherMode === 'neon' ? 'sunset' : weatherMode === 'sunset' ? 'rain' : 'neon')}
            title={`Cycle Lighting (${weatherMode})`}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            {weatherMode === 'neon' && <Sparkles className="w-4 h-4 text-cyan-300" />}
            {weatherMode === 'sunset' && <Sun className="w-4 h-4 text-amber-400" />}
            {weatherMode === 'rain' && <CloudRain className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Command Scope'}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Shockwave Active Floating Alert */}
      {shockwaveActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-rose-950/90 border border-rose-500/60 text-white px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-pulse pointer-events-none z-30">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <div>
            <div className="text-xs font-extrabold text-rose-200">Back-Spill Shockwave Active (w = -18.4 km/h)</div>
            <div className="text-[11px] text-rose-300">Propagating backward through upstream interchange nodes</div>
          </div>
        </div>
      )}

      {/* Bottom Floating Legend & Quick Controls */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 p-2.5 rounded-2xl flex items-center gap-4 shadow-xl pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500" />
          <span>Gridlock Choke (Extruded)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500" />
          <span>Elevated Inflow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
          <span>Green Wave Velocity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400" />
          <span>Signalized Hub</span>
        </div>

        <div className="h-3 w-px bg-slate-700 mx-1" />

        {/* 3D Layers Toggles */}
        <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={showBuildings}
            onChange={(e) => setShowBuildings(e.target.checked)}
            className="rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
          />
          <span className="text-[10px] font-medium">Skyline Blocks</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={showBeacons}
            onChange={(e) => setShowBeacons(e.target.checked)}
            className="rounded text-rose-500 focus:ring-0 bg-slate-800 border-slate-700"
          />
          <span className="text-[10px] font-medium">Laser Beams</span>
        </label>
      </div>

      {/* Selected / Hovered Segment Holographic Card */}
      {(hoveredSegment || selectedSegment) && (
        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white p-4 rounded-3xl shadow-2xl w-80 pointer-events-auto space-y-3 z-30 animate-fadeIn">
          {(() => {
            const seg = hoveredSegment || selectedSegment!;
            const isCritical = seg.ai_risk_level === 'CRITICAL';
            const isElevated = seg.ai_risk_level === 'ELEVATED';

            return (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
                      {seg.segment_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isElevated
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {seg.ai_risk_level}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {seg.road_class}
                  </span>
                </div>

                <div className="text-xs text-slate-300 mt-2 font-medium">
                  Nodes <strong className="text-white">{seg.source_node}</strong> →{' '}
                  <strong className="text-white">{seg.target_node}</strong>
                  {seg.signal_id ? ` (Signal ${seg.signal_id})` : ''}
                </div>

                {/* Telemetry Visuals */}
                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-800 text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      <span>Speed Ratio</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {seg.speed_kmh} <span className="text-[10px] text-slate-400 font-normal">/ {seg.free_flow_speed_kmh} km/h</span>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5 font-bold">
                      {Math.round(seg.speed_ratio * 100)}% Throughput
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                      <Activity className="w-3 h-3 text-rose-400" />
                      <span>Queue & Delay</span>
                    </div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">
                      {seg.queue_length_veh} <span className="text-[10px] text-slate-400 font-normal">veh</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {seg.delay_min ? `${seg.delay_min}m delay` : 'Normal'}
                    </div>
                  </div>
                </div>

                {/* Physical corridor details */}
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Length: {seg.length_km} km</span>
                  <span>Lanes: {seg.lanes} lanes</span>
                  <span>Cap: {seg.capacity_vph} vph</span>
                </div>

                {/* Instant Actions */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                  <button
                    onClick={() => onForecast?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Forecast</span>
                  </button>
                  <button
                    onClick={() => onTraceSpillback?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Spillback</span>
                  </button>
                  <button
                    onClick={() => onPlanDiversion?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <GitFork className="w-3 h-3" />
                    <span>Reroute</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
