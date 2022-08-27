import { MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MeshBasicMaterial, MeshPhysicalMaterial } from 'three'

import { snowtick } from './snow'
import { drawtree } from './tree'


class Snowtreetexture {    
    constructor (canvas) {
        this.canvas = canvas
        this.context = canvas.getContext("2d")
        drawtree(canvas, this.context)        
        this.texture = new THREE.CanvasTexture(canvas)
    }

    tick() {
        snowtick(this.canvas, this.context)
        this.texture.needsUpdate = true
    }
}

function Sphere(props) {
    const snowTreeTexture = useRef()
    const material = useRef()
    useEffect(() => {
        snowTreeTexture.current = new Snowtreetexture(props.canvas.current)
        material.current.bumpMap = snowTreeTexture.current.texture
        material.current.map = snowTreeTexture.current.texture
    }, [true])
    useFrame((_state, _delta) => {
        snowTreeTexture.current.tick()
    });
    return <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2]} />
        <meshStandardMaterial ref={material} />
    </mesh>;
}

export function Spheretree() {
    const canvas = useRef(null);
    return <>
        <canvas width="1920" height="1080" style={{ "display": "none" }} ref={canvas} />
        <Canvas>
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[10, 10, -10]} />
            <Sphere canvas={canvas} rotate-y={Math.PI / 2} />
            <OrbitControls />
        </Canvas>
    </>;
}
