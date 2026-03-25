import { Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type * as THREE from "three";

function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.12;
      meshRef.current.rotation.x =
        Math.sin(clock.getElapsedTime() * 0.07) * 0.15;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <sphereGeometry args={[1.1, 32, 32]} />
      <meshStandardMaterial
        color="#1a3a6e"
        emissive="#0d2050"
        emissiveIntensity={0.6}
        roughness={0.8}
        metalness={0.3}
      />
    </mesh>
  );
}

function FloatingCube({
  position,
  speed,
  color,
}: { position: [number, number, number]; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed;
      ref.current.rotation.x = t * 0.7;
      ref.current.rotation.y = t;
      ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.18, 0.18, 0.18]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function FloatingTetra({
  position,
  speed,
}: { position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed;
      ref.current.rotation.x = t;
      ref.current.rotation.z = t * 0.6;
      ref.current.position.x = position[0] + Math.cos(t * 0.4) * 0.25;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <tetrahedronGeometry args={[0.15]} />
      <meshStandardMaterial
        color="#c0a060"
        emissive="#a07030"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

function GlowRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * 0.08;
      ref.current.rotation.z = clock.getElapsedTime() * 0.05;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -1]}>
      <torusGeometry args={[1.6, 0.04, 8, 60]} />
      <meshStandardMaterial
        color="#4466ff"
        emissive="#2244cc"
        emissiveIntensity={1}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#aaccff" />
      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#6644ff" />
      <Stars
        radius={60}
        depth={30}
        count={800}
        factor={3}
        saturation={0.8}
        fade
        speed={0.6}
      />
      <Planet />
      <GlowRing />
      <FloatingCube position={[-2.5, 0.5, 0.5]} speed={0.5} color="#4488ff" />
      <FloatingCube position={[2.8, -0.4, 0.2]} speed={0.4} color="#aa44ff" />
      <FloatingCube position={[-1.8, -1.1, 0.8]} speed={0.6} color="#44ddaa" />
      <FloatingTetra position={[2.2, 0.8, 0.4]} speed={0.45} />
      <FloatingTetra position={[-2.8, -0.5, 0.6]} speed={0.35} />
      <FloatingTetra position={[0.5, 1.3, 0.3]} speed={0.55} />
    </>
  );
}

export function Scene3D() {
  return (
    <div
      className="relative w-full"
      style={{ height: 220, background: "#030818" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 55 }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      {/* SPB text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div className="relative">
          <h1
            className="text-6xl font-black tracking-widest select-none"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "transparent",
              backgroundImage:
                "linear-gradient(135deg, #f0c060 0%, #ffffff 40%, #8899ff 80%, #aa55ff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              textShadow: "none",
              filter:
                "drop-shadow(0 0 24px rgba(180,160,255,0.7)) drop-shadow(0 0 8px rgba(255,220,120,0.5))",
            }}
          >
            SPB
          </h1>
          <p
            className="text-center text-xs tracking-[0.3em] uppercase mt-1"
            style={{
              color: "rgba(200,210,255,0.7)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Student Day Planner
          </p>
        </div>
      </div>
    </div>
  );
}
