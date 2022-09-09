import { RigidBodyType } from "@dimforge/rapier3d-compat";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Box,
  Cone,
  Cylinder,
  OrbitControls,
  Sky,
  Sphere,
  Stars,
  useTexture
} from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  CylinderCollider,
  Debug,
  Physics,
  RigidBody,
  RigidBodyApi,
  useSphericalJoint,
  Vector3Array
} from "@react-three/rapier";
import { Perf, usePerf } from "r3f-perf";
import React, {
  forwardRef,
  MutableRefObject,
  Ref,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderBufferGeometry,
  Euler,
  IcosahedronBufferGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PointLightShadow,
  Quaternion,
  Raycaster,
  SphereBufferGeometry,
  Texture,
  TextureLoader,
  Vector3
} from "three";
import { mergeBufferGeometries, SimplexNoise } from "three-stdlib";

const angsize = Math.PI / 1.5;

const rndz = (multiplier: number) => (Math.random() - 0.5) * multiplier;

interface TreeNode {
  length: number;
  radius: number;
  rotation: Euler;
  parent?: TreeNode;
  children: TreeNode[];
  color: number;
}

function createTreeNode(
  level: number,
  parent?: TreeNode,
  startingPosition?: Vector3Array
): TreeNode {
  const len = 1 / Math.pow(level + 1, 0.5);
  const radius = 0.05 / (level + 1);
  const numChildren = [3, 4, 0, 0, 0][level];
  const rotation =
    level == 0
      ? new Euler(0, 0, 0)
      : new Euler(rndz(angsize), rndz(angsize), rndz(angsize));

  const node: TreeNode = {
    length: len,
    radius: radius,
    rotation: rotation,
    color: Math.floor(Math.random() * 0xffffff),
    parent: parent,
    children: []
  };
  for (let i = 0; i < numChildren; i++) {
    node.children.push(createTreeNode(level + 1, node));
  }
  return node;
}

function Tree(props: {
  position: Vector3Array;
  parent?: RefObject<RigidBodyApi>;
  node?: TreeNode;
}) {
  const node = props.node ?? createTreeNode(0, undefined, props.position);
  const body = useRef<RigidBodyApi>(null);
  if (props.parent) {
    useSphericalJoint(props.parent, body, [
      [0, node.parent!.length, 0],
      [0, 0, 0]
    ]);
  }
  const childPos: Vector3Array = [0, node.length, 0];
  const children = node.children.map((childnode, i) => (
    <Tree key={i} position={childPos} parent={body} node={childnode} />
  ));
  return (
    <>
      <group position={props.position} rotation={node.rotation} castShadow>
        <RigidBody
          type={props.parent ? "dynamic" : "fixed"}
          colliders="trimesh"
          ref={body}
        >
          <mesh position={[0, node.length / 2, 0]}>
            <cylinderGeometry
              args={[node.radius, node.radius, node.length - node.radius / 10]}
            />
            <meshPhysicalMaterial color={node.color} />
          </mesh>
        </RigidBody>
        {children}
      </group>
    </>
  );
}

export function Jointstree() {
  return (
    <Canvas performance={{ min: 0.5 }} camera={{ position: [0, 3, 2] }} shadows>
      <pointLight
        shadow-mapSize-height={3000}
        shadow-mapSize-width={3000}
        position={[10, 10, 6]}
        castShadow
      />
      <Physics gravity={[0, -1, 0]}>
        <ambientLight intensity={0.3} />
        <Tree position={[0, 0, 0]} />
        <Perf />
      </Physics>
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <OrbitControls target={[0, 1, 0]} />
    </Canvas>
  );
}
