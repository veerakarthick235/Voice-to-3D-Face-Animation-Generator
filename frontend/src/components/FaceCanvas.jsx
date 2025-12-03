import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Animated 3D Face with blendshapes
const AnimatedFace = ({ blendshapes }) => {
  const meshRef = useRef();
  const targetBlendshapes = useRef({
    jawOpen: 0,
    mouthClose: 0,
    mouthPucker: 0,
    mouthSmile: 0,
    mouthFunnel: 0
  });
  const currentBlendshapes = useRef({ ...targetBlendshapes.current });

  // Update target blendshapes when prop changes
  useEffect(() => {
    if (blendshapes) {
      targetBlendshapes.current = { ...blendshapes };
    } else {
      targetBlendshapes.current = {
        jawOpen: 0,
        mouthClose: 0,
        mouthPucker: 0,
        mouthSmile: 0,
        mouthFunnel: 0
      };
    }
  }, [blendshapes]);

  // Smooth interpolation
  useFrame(() => {
    if (!meshRef.current) return;

    const lerp = (start, end, factor) => start + (end - start) * factor;
    const smoothFactor = 0.2;

    // Smoothly interpolate to target values
    Object.keys(currentBlendshapes.current).forEach(key => {
      currentBlendshapes.current[key] = lerp(
        currentBlendshapes.current[key],
        targetBlendshapes.current[key] || 0,
        smoothFactor
      );
    });

    // Apply transformations to geometry
    const bs = currentBlendshapes.current;
    
    // Update face geometry based on blendshapes
    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const basePositions = geometry.userData.basePositions;

    if (!basePositions) {
      geometry.userData.basePositions = Float32Array.from(positions);
      return;
    }

    // Reset to base positions
    for (let i = 0; i < positions.length; i++) {
      positions[i] = basePositions[i];
    }

    // Apply blendshapes to vertices
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const z = positions[i + 2];

      // Jaw open - lower face moves down
      if (y < -0.2) {
        positions[i + 1] -= bs.jawOpen * 0.3;
      }

      // Mouth close - compress mouth area
      if (y > -0.5 && y < 0.1 && z > 0.3) {
        positions[i + 2] -= bs.mouthClose * 0.2;
      }

      // Mouth pucker - narrow and extend
      if (y > -0.5 && y < 0.1 && z > 0.3) {
        const xDist = Math.abs(positions[i]);
        positions[i] *= 1 - bs.mouthPucker * 0.3;
        positions[i + 2] += bs.mouthPucker * 0.15;
      }

      // Mouth smile - corners move up and out
      if (y > -0.4 && y < -0.1 && z > 0.2) {
        const xSign = Math.sign(positions[i]);
        positions[i] += xSign * bs.mouthSmile * 0.1;
        positions[i + 1] += bs.mouthSmile * 0.15;
      }

      // Mouth funnel - create O shape
      if (y > -0.5 && y < 0.1 && z > 0.3) {
        positions[i + 2] += bs.mouthFunnel * 0.1;
        positions[i + 1] -= bs.mouthFunnel * 0.1;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
      <meshStandardMaterial
        color="#ffdbac"
        roughness={0.6}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Eyes
const Eyes = () => {
  return (
    <>
      {/* Left eye */}
      <mesh position={[-0.3, 0.2, 0.7]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[-0.3, 0.2, 0.78]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.3, 0.2, 0.7]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.3, 0.2, 0.78]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
    </>
  );
};

// Nose
const Nose = () => {
  return (
    <mesh position={[0, -0.1, 0.9]} castShadow>
      <coneGeometry args={[0.08, 0.25, 8]} />
      <meshStandardMaterial color="#ffdbac" roughness={0.6} />
    </mesh>
  );
};

const FaceCanvas = ({ blendshapes }) => {
  return (
    <Canvas shadows style={{ width: '100%', height: '100%' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={50} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 0, 5]} intensity={0.4} color="#63b3ed" />
      <pointLight position={[5, 0, 5]} intensity={0.4} color="#4fd1c5" />

      {/* 3D Face components */}
      <AnimatedFace blendshapes={blendshapes} />
      <Eyes />
      <Nose />

      {/* Background */}
      <mesh position={[0, 0, -3]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0e27" roughness={1} />
      </mesh>
    </Canvas>
  );
};

export default FaceCanvas;
