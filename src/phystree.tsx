import { AdaptiveDpr, AdaptiveEvents, Box, Cone, Cylinder, OrbitControls, Sky, Sphere, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Debug, Physics, RigidBody, Vector3Array } from '@react-three/rapier';
import niceColors from 'nice-color-palettes';
import { Perf, usePerf } from 'r3f-perf';
import React, { forwardRef, Ref, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, Color, CylinderBufferGeometry, Euler, Material, Matrix4, Mesh, MeshPhysicalMaterial, MirroredRepeatWrapping, Object3D, Quaternion, Raycaster, Texture, TextureLoader, Vector3 } from 'three';
import { mergeBufferGeometries, SimplexNoise } from 'three-stdlib';
import * as uuid from 'uuid';
import groundTextureUrl from './assets/TexturesCom_Grass0095_M.jpg';

import woodAlbedoUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_albedo.jpg';
import woodAOurl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_ao.jpg';
import woodHeightUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_height.jpg';
import woodNormalUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_normal.jpg';
import woodRoughnessUrl from './assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_roughness.jpg';
import { Ground } from './Ground';


const halfpi = Math.PI / 2
const angsize = Math.PI / 1.5

function angle() {
    return Math.random() * angsize - angsize / 2;
}

const matLeaf = new MeshPhysicalMaterial({ color: 'green' })

interface TreeNode {
    geometry: BufferGeometry,
    isLeaf: boolean
}

function createBranchGeometry(level: number): TreeNode[] {
    const rotx = level == 1 ? 0 : angle()
    const roty = level == 1 ? 0 : angle()
    const rotz = level == 1 ? 0 : angle()
    const len = 1 / Math.pow(level, 0.5)
    const radius = 0.05 / level
    const radius2 = 0.05 / (level + 1)

    const numChildren = [2, 3, 4, 4, 10, 0][level]

    const rotation = new Quaternion().setFromEuler(new Euler(rotx, roty, rotz))
    let nodes: TreeNode[] = [{
        isLeaf: level == 5,
        geometry: new CylinderBufferGeometry(radius2, radius, len)
            .translate(0, len / 2, 0)
            .applyQuaternion(rotation)
    }]
    for (let i = 0; i < numChildren; i++) {
        nodes = nodes.concat(
            createBranchGeometry(level + 1).map(g => ({
                isLeaf: g.isLeaf,
                geometry: g.geometry.translate(0, len, 0).applyQuaternion(rotation)
            })))

    }
    return nodes
}


function useWood(): Material {
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
    return new MeshPhysicalMaterial({ ...woodmaps, displacementScale: 0.02 })
}

function Tree2(props: { position: Vector3Array }) {
    const wood = useWood()
    const nodes = createBranchGeometry(1)
    const materials = [
        wood,
        new MeshPhysicalMaterial({ color: new Color('green') }),
    ]
    const nonLeaf = mergeBufferGeometries(nodes.filter(x => !x.isLeaf).map(x => x.geometry), false)!
    const leaf = mergeBufferGeometries(nodes.filter(x => x.isLeaf).map(x => x.geometry), false)!
    const geometry = mergeBufferGeometries([nonLeaf, leaf], true)!.translate(...props.position)
    geometry.groups[1].materialIndex = 1
    return <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={geometry} material={materials} castShadow receiveShadow />
    </RigidBody>
}

const rndz = (multiplier: number) => (Math.random() - 0.5) * multiplier

function Snowflake(props: { position: Vector3Array }) {
    const radius = 0.1
    const rbottom = 0.05
    const vel: Vector3Array = [rndz(2), rndz(2), rndz(2)]
    const avel: Vector3Array = [rndz(2), rndz(2), rndz(2)]
    const material = <meshPhysicalMaterial transmission={0.9} ior={0.5} color={niceColors[0][Math.floor(Math.random() * 5)]} />

    const fcone = (position: Vector3Array, rotation: Vector3Array) =>
        <Cone position={position} args={[rbottom, radius]} rotation={rotation} castShadow receiveShadow>{material}</Cone>

    return <RigidBody position={props.position} linearDamping={2} linearVelocity={vel} angularVelocity={avel}>
        {fcone([0, radius / 2, 0], [0, 0, 0])}
        {fcone([0, 0, radius / 2], [halfpi, 0, 0])}
        {fcone([0, -radius / 2, 0], [Math.PI, 0, 0])}
        {fcone([0, 0, -radius / 2], [-halfpi, 0, 0])}
        {fcone([-radius / 2, 0, 0], [0, 0, halfpi])}
        {fcone([radius / 2, 0, 0], [0, 0, -halfpi])}
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

function WoodTree(props: { position: Vector3Array, groundRef: RefObject<Mesh> }) {

    const [position, setPosition] = useState<Vector3Array>()
    const countDownRef = useRef<number>(1)
    const groundRef = props.groundRef
    useFrame(() => {
        if (!position) {
            if (countDownRef.current > 0) {
                countDownRef.current--
                return
            }
            const [x, _, z] = props.position
            const yhits = []
            for (let x1 = -0.1; x1 <= 0.1; x1 += 0.1) {
                for (let z1 = -0.1; z1 <= 0.1; z1 += 0.1) {
                    const ray = new Raycaster(new Vector3(x + x1, 100, z + z1), new Vector3(0, -1, 0))
                    const intersect = ray.intersectObject(groundRef.current as Object3D)
                    if (intersect.length == 1) {
                        yhits.push(intersect[0].point.y)
                    }
                }
            }
            if (yhits.length > 0) {
                const y = yhits[Math.floor(yhits.length / 2)]
                setPosition([x, y, z])
            }
        }
    })

    if (!position) {
        return <></>
    }

    return <Tree2 position={position} />
}

const noise = new SimplexNoise()
function heightFunction(x: number, z: number) {
    let y = 1 * noise.noise(x / 20, z / 20)
    y += 0.2 * noise.noise(x, z)
    // y += 2 * noise.noise(x / 10, z / 10)
    return y;
}

const GroundWithTexture = forwardRef((_props, ref: Ref<Mesh>) => {
    const colorMap = useLoader(TextureLoader, groundTextureUrl)
    colorMap.repeat.set(5, 5)
    colorMap.wrapS = MirroredRepeatWrapping
    colorMap.wrapT = MirroredRepeatWrapping
    return <Ground ref={ref} heightFunction={heightFunction} width={30} height={30} widthSegments={30} heightSegments={30}>
        <meshPhysicalMaterial map={colorMap} />
    </Ground>
})

function Forest(props: { groundRef: RefObject<Mesh> }) {
    return <>
        <WoodTree position={[-5, 5, -5]} groundRef={props.groundRef} />
        <WoodTree position={[-5, 5, 5]} groundRef={props.groundRef} />
        <WoodTree position={[5, 5, -5]} groundRef={props.groundRef} />
        <WoodTree position={[5, 5, 5]} groundRef={props.groundRef} />
        <WoodTree position={[5, 5, 5]} groundRef={props.groundRef} />
        <WoodTree position={[-5, 5, 0]} groundRef={props.groundRef} />
        <WoodTree position={[5, 5, 0]} groundRef={props.groundRef} />
        <WoodTree position={[0, 5, -5]} groundRef={props.groundRef} />
        <WoodTree position={[0, 5, 5]} groundRef={props.groundRef} />
        <WoodTree position={[0, 0, 0]} groundRef={props.groundRef} />
    </>
}

export function Physicstree() {
    const groundRef = useRef<Mesh>(null)
    return <Canvas performance={{ min: 0.5 }} camera={{ position: [0, 2, 4] }} shadows>
        <pointLight position={[10, 10, 6]} castShadow />
        <Physics gravity={[0, -1, 0]}  >
            <ambientLight intensity={0.3} />
            <GroundWithTexture ref={groundRef} />
            <Forest groundRef={groundRef} />
            <Snow />
            {/* 
            <WoodTree position={[0, 0, 0]} groundRef={groundRef} /> 
            <Forest groundRef={groundRef} />
            <Snow />
            <Debug />
            */}
            <Perf headless />
            <Sky />
            <Stars />
        </Physics>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <OrbitControls target={[0, 1, 0]} />
    </Canvas >;
}


