import { AdaptiveDpr, AdaptiveEvents, Box, Cone, Cylinder, OrbitControls, Sky, Sphere, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Debug, Physics, RigidBody, Vector3Array } from '@react-three/rapier';
import niceColors from 'nice-color-palettes';
import { Perf, usePerf } from 'r3f-perf';
import React, { forwardRef, MutableRefObject, Ref, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, CanvasTexture, Color, CylinderBufferGeometry, Euler, IcosahedronBufferGeometry, Material, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, MirroredRepeatWrapping, Object3D, PointLightShadow, Quaternion, Raycaster, SphereBufferGeometry, Texture, TextureLoader, Vector3 } from 'three';
import { mergeBufferGeometries, SimplexNoise } from 'three-stdlib';
import * as uuid from 'uuid';

import groundTextureUrl from '../assets/TexturesCom_Grass0095_M.jpg';
import woodAlbedoUrl from '../assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_albedo.jpg';
import woodAOurl from '../assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_ao.jpg';
import woodHeightUrl from '../assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_height.jpg';
import woodNormalUrl from '../assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_normal.jpg';
import woodRoughnessUrl from '../assets/TexturesCom_Wood_BarkWillow_0.3x0.6_1K_roughness.jpg';
import { Ground } from '../Ground';

const noise = new SimplexNoise()

const halfpi = Math.PI / 2
const angsize = Math.PI / 1.5

const rndz = (multiplier: number) => (Math.random() - 0.5) * multiplier
const angle = () => rndz(angsize)

interface TreeSpecNode {
    direction: Quaternion,
    length: number,
    level: number,
    children: TreeSpecNode[],
}

function createTreeSpec(level: number): TreeSpecNode {
    const angvariation = [Math.PI / 6, angsize, angsize, angsize, angsize][level]
    const rotx = rndz(angvariation)
    const roty = rndz(angvariation)
    const rotz = rndz(angvariation)
    const baselen = [1.0, 0.7, 0.6, 0.2, 0.2][level]
    const len = baselen + rndz(baselen / 5)
    const numChildren = [3, 4, 10, 0, 0][level]
    return {
        direction: new Quaternion().setFromEuler(new Euler(rotx, roty, rotz)),
        length: len,
        children: [...Array(numChildren).keys()].map(() => createTreeSpec(level + 1)),
        level: level
    }
}

interface TreeNode {
    geometry: BufferGeometry,
    isLeaf: boolean
}

function createGeometriesFromTreeSpec(spec: TreeSpecNode): TreeNode[] {
    const isLeaf = spec.children.length == 0
    const radius = 0.05 / (spec.level*3 + 1)
    const radius2 = 0.05 / (spec.level*3 + 2)

    const geo = isLeaf
        ? new SphereBufferGeometry(spec.length / 2)
            .scale(0.3, 1, 0.01)
        : new CylinderBufferGeometry(radius2, radius, spec.length)

    const nodes: TreeNode[] = [
        {
            isLeaf: isLeaf,
            geometry: geo
                .translate(0, spec.length / 2, 0)
                .applyQuaternion(spec.direction)
        }
    ]
    for (let childspec of spec.children) {
        const childnodes = createGeometriesFromTreeSpec(childspec)
        const isLeaf = childnodes[0].isLeaf
        for (let childnode of childnodes) {
            const pos = isLeaf ? Math.random() * spec.length : spec.length
            childnode.geometry
                .translate(0, pos, 0)
                .applyQuaternion(spec.direction)
            nodes.push(childnode)
        }
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

function createFunctionTexture(f: (x: number, y: number) => [r: number, g: number, z: number, a: number]) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let y = 0, p = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++, p += 4) {
            const c = f(x, y)
            imageData.data[p] = c[0]
            imageData.data[p + 1] = c[1]
            imageData.data[p + 2] = c[2]
            imageData.data[p + 3] = c[3]
        }
    }
    ctx.putImageData(imageData, 0, 0)
    return new CanvasTexture(canvas)
}

function useGreen() : Material {
    const texture = createFunctionTexture((x, y) => {
        return [40, noise.noise(x / 100, y / 100) * 40 + 80, 0, 0xff]
    })
    const bump = createFunctionTexture((x, y) => {
        const v = noise.noise(x / 100, y / 100) * 5
        return [v, v, v, v]
    })
    const material = new MeshStandardMaterial({ map: texture, bumpMap: bump })
    return material
}

const green = useGreen()

const Tree2 = forwardRef<Vector3Array>((_, refposition) => {
    const wood = useWood()
    //const green = useGreen()
    const [spec] = useState(() => createTreeSpec(0))
    const nodes = createGeometriesFromTreeSpec(spec)
    const position = (refposition as MutableRefObject<Vector3Array>)?.current
    if (!position) {
        return <></>
    }
    const nonLeaf = mergeBufferGeometries(nodes.filter(x => !x.isLeaf).map(x => x.geometry), false)!.translate(...position)
    const leaf = mergeBufferGeometries(nodes.filter(x => x.isLeaf).map(x => x.geometry), false)!.translate(...position)
    nonLeaf.computeBoundingSphere()
    leaf.computeBoundingSphere()
    return <>
        <RigidBody type="fixed" colliders="cuboid">
            <mesh geometry={nonLeaf} material={wood} castShadow receiveShadow />
        </RigidBody>
        <mesh geometry={leaf} castShadow receiveShadow material={green} />
    </>
})

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
            const pos: Vector3Array = [rndz(15), 5, rndz(15)]
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
    const position = useRef<Vector3Array>(null) as MutableRefObject<Vector3Array>
    const countDownRef = useRef<number>(1)
    const [ready, setReady] = useState<boolean>(false)
    const groundRef = props.groundRef
    useFrame(() => {
        if (!position.current) {
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
                position.current = [x, y, z]
                setReady(true)
            }
        }
    })

    return <Tree2 ref={position} />
}

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
    const d = 5
    return <>
        <WoodTree position={[-d, d, -d]} groundRef={props.groundRef} />
        <WoodTree position={[-d, d, d]} groundRef={props.groundRef} />
        <WoodTree position={[d, d, -d]} groundRef={props.groundRef} />
        <WoodTree position={[d, d, d]} groundRef={props.groundRef} />
        <WoodTree position={[d, d, d]} groundRef={props.groundRef} />
        <WoodTree position={[-d, d, 0]} groundRef={props.groundRef} />
        <WoodTree position={[d, d, 0]} groundRef={props.groundRef} />
        <WoodTree position={[0, d, -d]} groundRef={props.groundRef} />
        <WoodTree position={[0, d, d]} groundRef={props.groundRef} />
        <WoodTree position={[0, 0, 0]} groundRef={props.groundRef} />
    </>
}

export function Roundleavestree() {
    const groundRef = useRef<Mesh>(null)
    return <Canvas performance={{ min: 0.5 }} camera={{ position: [0, 3, 10] }} shadows>
        <pointLight shadow-mapSize-height={3000} shadow-mapSize-width={3000} position={[10, 10, 6]} castShadow />
        <Physics gravity={[0, -1, 0]} >
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
            <Perf />
            <Sky />
            <Stars />
        </Physics>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <OrbitControls target={[0, 1, 0]} />
    </Canvas >;
}


