// @ts-nocheck

import { Debug, Physics, RigidBody, InstancedRigidBodies, InstancedRigidBodyApi, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Cylinder, Box, Sphere } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { forwardRef, useRef, useMemo, useEffect, useState, useContext } from 'react';
import niceColors from 'nice-color-palettes';
import * as THREE from 'three';
import { Color } from 'three';
import { Hollowsphere } from './hollowsphere'
import { Perf } from "r3f-perf";

const angsize = Math.PI / 1.5;

function angle() {
    return Math.random() * angsize - angsize / 2;
}

function Branch(props: any) {
    const mesh = useRef(null)
    const level = props.level;

    const idmemo = props.position[0] + props.position[1] + props.position[2];

    const rotx = useMemo(() => level == 1 ? 0 : angle(), [idmemo, 1]);
    const roty = useMemo(() => level == 1 ? 0 : angle(), [idmemo, 2]);
    const rotz = useMemo(() => level == 1 ? 0 : angle(), [idmemo, 3]);
    const len = 1 / Math.pow(props.level, 0.5);
    const radius = 0.05 / props.level;
    const radius2 = 0.05 / (props.level + 1);
    const color = useMemo(() => Math.floor(Math.random() * 0xFFFFFF), [idmemo]);

    const children = [];
    if (props.level < 5) {
        for (let i = 0; i < 3; i++) {
            children.push(<Branch key={i} matprop={props.matprop} position={[0, len / 2, 0]} level={props.level + 1} color={color} />);
        }
    }
    return <>
        <mesh {...props} rotation-x={rotx} rotation-y={roty} rotation-z={rotz} scale="1" ref={mesh}>
            <group>
                <mesh position={[0, len / 2, 0]} castShadow>
                    <RigidBody type="fixed">
                        <Cylinder args={[radius2, radius, len]}>
                            <meshPhysicalMaterial color={props.color} />
                        </Cylinder>
                    </RigidBody>
                    {children}
                </mesh>
            </group>
        </mesh>

    </>
}

type InstancedGeometryProps = {
    colors: Float32Array
    number: number
    size: number
}

/*
const Spheres = ({ number, size }: InstancedGeometryProps) => {
    const [ref, { at }] = useSphere(
        () => ({
            args: [size],
            mass: 1,
            position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
        }),
        useRef<InstancedMesh>(null),
    )
    // useFrame(() => at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
    return (
        <instancedMesh receiveShadow castShadow ref={ref} args={[undefined, undefined, number]}>
            <sphereBufferGeometry args={[size, 48]} />
            <meshLambertMaterial vertexColors />
        </instancedMesh>
    )
}
*/

function InstancedSpheres({ count = 100 }) {

    const radius = 0.1

    const colors = useMemo(() => {
        const array = new Float32Array(count * 3)
        const color = new Color()
        for (let i = 0; i < count; i++)
            color
                .set(niceColors[0][Math.floor(Math.random() * 5)])
                .convertSRGBToLinear()
                .toArray(array, i * 3)
        return array
    }, [count])

    const api = useRef<InstancedRigidBodyApi>(null);

    return (
        <group>
            <InstancedRigidBodies
                ref={api}
                positions={Array.from({ length: count }, () => [
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                ])}
            >
                <instancedMesh castShadow receiveShadow args={[undefined, undefined, count]}>
                    <sphereBufferGeometry args={[radius]}>
                        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
                    </sphereBufferGeometry>
                    <meshLambertMaterial vertexColors />
                </instancedMesh>
            </InstancedRigidBodies>
        </group>
    )
}

function Plane(props: any) {
    const euler = new THREE.Euler(props.rotation[0], props.rotation[1], props.rotation[2]);
    const position = new THREE.Vector3(0, 0, 2).applyEuler(euler).toArray();

    return (
        <mesh position={position} rotation={props.rotation} receiveShadow>
            <boxGeometry args={[8, 8, 0.1]} />
            <meshBasicMaterial transparent opacity={0.4} />
        </mesh>
    )
}

function jail() {
    const planes = [];
    const pi4 = Math.PI / 4;
    const pi2 = pi4 * 2;
    for (let i = 0; i < 8; i++) {
        planes.push([0, i * pi4, 0])
        planes.push([pi2, i * pi4, 0])
    }
    return planes
}

function HollowBox(props: any) {
    return <group>
        <CuboidCollider args={[0.1, 2, 2]} position={[-1, 0, 0]} />
        <CuboidCollider args={[0.1, 2, 2]} position={[1, 0, 0]} />

        <CuboidCollider args={[2, 0.1, 2]} position={[0, -1, 0]} />
        <CuboidCollider args={[2, 0.1, 2]} position={[0, 1, 0]} />

        <CuboidCollider args={[2, 2, 0.1]} position={[0, 0, -1]} />
        <CuboidCollider args={[2, 2, 0.1]} position={[0, 0, 1]} />

    </group>
}


export function Physicstree() {

    const things = useRef();

    const [invertGravity, setInvertGravity] = useState(false);

    const [cameraDirection, setCameraDirection] = useState([0, 0, 0]);

    // const grav: Triplet = [cameraDirection[0], cameraDirection[1], cameraDirection[2]];

    const planes = jail().map((r, i) => <Plane key={i} rotation={r} />);

    const changeCamera: any = (e: any) => {
        setCameraDirection(e.target.object.rotation.toArray());
    }

    return <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[10, 10, -10]} />
        <Physics gravity={[0, -1, 0]}>
            <RigidBody type="fixed" colliders="cuboid">
                <mesh scale={1.8}>
                    <HollowBox />
                </mesh>
            </RigidBody>
            <Branch position={[0, -1, 0]} level={1} />
            <Sphere args={[3]}>
                <meshPhysicalMaterial transmission="0.98" ior="0.97" />
            </Sphere>
            <InstancedSpheres count={10} />
            <Perf />
        </Physics>
        <OrbitControls onChange={changeCamera} />
    </Canvas >;
}


