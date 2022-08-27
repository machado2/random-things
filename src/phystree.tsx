

import { Cone, Cylinder, OrbitControls, Plane, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Physics, RigidBody, Vector3Array } from '@react-three/rapier';
import niceColors from 'nice-color-palettes';
import { Perf, usePerf } from 'r3f-perf';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MeshPhysicalMaterial, MirroredRepeatWrapping, RepeatWrapping, Texture, TextureLoader } from 'three';
import * as uuid from 'uuid';
import groundTextureUrl from './assets/TexturesCom_Grass0095_M.jpg'

import woodAlbedoUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_albedo.jpg'
import woodAOurl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_ao.jpg'
import woodHeightUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_height.jpg'
import woodNormalUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_normal.jpg'
import woodRoughnessUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_roughness.jpg'

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

    const material = level == 5 ? new MeshPhysicalMaterial({ color: 'green' }) : props.matprop

    const numChildren = [2, 3, 4, 4, 10, 0][props.level]

    const children = [...Array(numChildren).keys()]
        .map((_, i) =>
            <Branch
                key={i}
                matprop={props.matprop}
                position={[0, len / 2, 0]}
                level={props.level + 1}
                material={props.material}
                color={color} />);

    return <>
        <mesh {...props} rotation-x={rotx} rotation-y={roty} rotation-z={rotz} scale="1" ref={mesh}>
            <group>
                <mesh position={[0, len / 2, 0]} castShadow>
                    <RigidBody type="fixed">
                        <Cylinder args={[radius2, radius, len]} material={material} />
                    </RigidBody>
                    {children}
                </mesh>
            </group>
        </mesh>

    </>
}

const rndz = (multiplier: number) => (Math.random() - 0.5) * multiplier

function Snowflake(props: { position: Vector3Array }) {
    const radius = 0.1
    const rbottom = 0.05
    const vel: Vector3Array = [rndz(2), rndz(2), rndz(2)]
    const avel: Vector3Array = [rndz(2), rndz(2), rndz(2)]
    const material = <meshPhysicalMaterial transmission={0.9} ior={0.5} color={niceColors[0][Math.floor(Math.random() * 5)]} />
    return <RigidBody position={props.position} linearDamping={2} linearVelocity={vel} angularVelocity={avel}>
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
    </RigidBody>
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
            const pos: Vector3Array = [rndz(2), 5, rndz(2)]
            spheres.push(<Snowflake key={uuid.v4()} position={pos} />)
            setSpheres(isSlow ? spheres.slice(-minsnow) : spheres)
        }
    })

    useEffect(() => {
        const timer = setInterval(() => setShouldCreateNew(true), 1000)
        return () => clearInterval(timer)
    }, [true])

    return <>{spheres}</>
}

function _SnowFlakeDebug() {
    return <Canvas>
        <Physics>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <pointLight position={[10, 10, -10]} />
            <group scale={10}>
                <Snowflake position={[0, 0, 0]} />
            </group>
        </Physics>
        <OrbitControls />
    </Canvas>
}

function WoodTree() {
    const woodmaps: object = useTexture({
        map: woodAlbedoUrl,
        displacementMap: woodHeightUrl,
        normalMap: woodNormalUrl,
        roughnessMap: woodRoughnessUrl,
        aoMap: woodAOurl,
    })
    for (let txt of Object.values(woodmaps) as Texture[]) {
        txt.repeat.set(1, 1)
        txt.wrapS = MirroredRepeatWrapping
        txt.wrapT = MirroredRepeatWrapping
    }
    const wood = new MeshPhysicalMaterial({ ...woodmaps, displacementScale: 0.02 })
    return <Branch position={[0, -1, 0]} level={1} matprop={wood} />
}

export function Physicstree() {

    const colorMap = useLoader(TextureLoader, groundTextureUrl)
    colorMap.repeat.set(200, 200)
    colorMap.wrapS = MirroredRepeatWrapping
    colorMap.wrapT = MirroredRepeatWrapping

    return <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[10, 10, -10]} />
        <Physics gravity={[0, -1, 0]}>
            <RigidBody>
                <Plane args={[1000, 1000]} position-y={-1} rotation-x={-halfpi}>
                    <meshPhysicalMaterial map={colorMap} />
                </Plane>
            </RigidBody>
            <WoodTree />
            <Snow />
            <Perf headless />
            <Stars />
        </Physics>
        <OrbitControls />
    </Canvas >;
}


