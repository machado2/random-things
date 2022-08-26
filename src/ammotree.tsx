import { BodyType, Physics, ShapeType, SoftBodyType, useSoftBody, PhysicsStats, useRigidBody, SoftbodyApi, RigidbodyApi } from 'use-ammojs'
import { OrbitControls, Cylinder, Box, Sphere, Cone, Plane, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { forwardRef, useRef, useMemo, useEffect, useState, useContext, Ref, MutableRefObject } from 'react';
import niceColors from 'nice-color-palettes';
import { Perf, usePerf } from 'r3f-perf';
import * as uuid from 'uuid'
import { Mesh, Vector3 } from 'three';

const halfpi = Math.PI / 2
const angsize = Math.PI / 1.5

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
                    <Cylinder args={[radius2, radius, len]}>
                        <meshPhysicalMaterial color={props.color} />
                    </Cylinder>
                    {children}
                </mesh>
            </group>
        </mesh>

    </>
}

const rndz = (multiplier: number) => (Math.random() - 0.5) * multiplier

function PhysicalBall({ position, pressure } = {}) {
    const [ref] = useSoftBody(() => ({
      type: SoftBodyType.TRIMESH,
      pressure
    }))
  
    return (
      <Sphere args={[0.5, 16, 16]} position={position} ref={ref} castShadow>
        <meshPhysicalMaterial attach="material" color="red" />
      </Sphere>
    )
  }

function Snowflakey(props: { position: Vector3 }) {
    return <PhysicalBall position={props.position} pressure={2} />
}

function Snowflake(props: { position: Vector3 }) {
    const radius = 0.1
    const rbottom = 0.05
    const vel: Vector3 = new Vector3(rndz(2), rndz(2), rndz(2))
    const material = <meshPhysicalMaterial transmission={0.9} ior={0.5} color={niceColors[0][Math.floor(Math.random() * 5)]} />

    const [ref] = useSoftBody(() => ({
        type: SoftBodyType.TRIMESH,
        pressure : 6
      }))

      /*
    const [ref, api] = useRigidBody(() => ({
        bodyType: BodyType.DYNAMIC,
        shapeType: ShapeType.SPHERE
    })) as [Ref<Mesh>, RigidbodyApi]
    api.setLinearVelocity(vel)
*/
    return <Sphere position={props.position} ref={ref} args={[radius, 8, 8]}>{material}</Sphere>
}


function Snowflake_(props: { position: Vector3 }) {
    const radius = 0.1
    const rbottom = 0.05
    const vel: Vector3 = new Vector3(rndz(2), rndz(2), rndz(2))
    const material = <meshPhysicalMaterial transmission={0.9} ior={0.5} color={niceColors[0][Math.floor(Math.random() * 5)]} />
    const [ref, api] = useRigidBody(() => ({
        bodyType: BodyType.DYNAMIC,
        shapeType: ShapeType.BOX
    })) as [Ref<Mesh>, RigidbodyApi]
    api.setLinearVelocity(vel)

    return <mesh ref={ref}>
        {/*@ts-ignore*/}
        <Cone position={[0, radius / 2, 0]} args={[rbottom, radius]}>{material}</Cone>
        {/*@ts-ignore*/}
        <Cone position={[0, 0, radius / 2]} args={[rbottom, radius]} rotation={[halfpi, 0, 0]}>{material}</Cone>
        {/*@ts-ignore*/}
        <Cone position={[0, -radius / 2, 0]} args={[rbottom, radius]} rotation={[Math.PI, 0, 0]}>{material}</Cone>
        {/*@ts-ignore*/}
        <Cone position={[0, 0, -radius / 2]} args={[rbottom, radius]} rotation={[-halfpi, 0, 0]}>{material}</Cone>
        {/*@ts-ignore*/}
        <Cone position={[-radius / 2, 0, 0]} args={[rbottom, radius]} rotation={[0, 0, halfpi]}>{material}</Cone>
        {/*@ts-ignore*/}
        <Cone position={[radius / 2, 0, 0]} args={[rbottom, radius]} rotation={[0, 0, -halfpi]}>{material}</Cone>
    </mesh>
}

let lastfps: number[] = []
const minsnow: number = 50

function Snow(): JSX.Element {
    const [spheres, setSpheres] = useState<JSX.Element[]>([])
    const [shouldCreateNew, setShouldCreateNew] = useState<boolean>(false)

    const fps = usePerf()?.log?.fps ?? 0

    useFrame(() => {
        if (shouldCreateNew) {
            setShouldCreateNew(false)
            lastfps = lastfps.concat([fps]).slice(-5)
            const isSlow = lastfps.some(x => x < 20) && spheres.length >= minsnow
            const pos = new Vector3(rndz(2), 5, rndz(2))
            spheres.push(<Snowflake key={uuid.v4()} position={pos} />)
            setSpheres(isSlow ? spheres.slice(-minsnow) : spheres)
        }
    })

    useEffect(() => {
        const timer = setInterval(() => setShouldCreateNew(true), 100)
        return () => clearInterval(timer)
    }, [true])

    return <>{spheres}</>
}

function Ground() {
    const [groundRef] = useRigidBody(() => ({
        bodyType: BodyType.STATIC,
        shapeType: ShapeType.BOX
    }))
    return <Plane ref={groundRef} args={[1000, 1000]} position-y={-1} rotation-x={-halfpi}>
        <meshPhysicalMaterial color="red" />
    </Plane>
}

export function Ammotree() {
    /*
    return <Canvas>
        <Physics>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <pointLight position={[10, 10, -10]} />
            <group scale={10}>
                <Snowflake />
            </group>
        </Physics>
        <OrbitControls />
    </Canvas>
*/


    return <Canvas>
        <ambientLight />
        <Stars />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[10, 10, -10]} />
        <Physics>
            <Ground />
            <Branch position={[0, -1, 0]} level={1} />
            <Snow />
            <Perf />
        </Physics>
        <OrbitControls />
    </Canvas >;
}


