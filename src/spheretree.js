import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

import { snowtick } from './snow'
import { drawtree } from './tree'

function Sphere(props) {
    const ctx = useRef(null);
    const texture = useRef(null);
    const material = useRef(null);

    useFrame((state, delta) => { 
        if (props.canvas.current) {
            const canvas = props.canvas.current;
            if (ctx.current == null) {
                canvas.width = 640;
                canvas.height = 480;
                ctx.current = canvas.getContext("2d");
                drawtree(canvas, ctx.current);
            }
            if (texture.current == null) {
                texture.current = new THREE.CanvasTexture(canvas);
                material.current.map = texture.current;
            }
            snowtick(canvas, ctx.current);
            texture.current.needsUpdate = true;
        }
     });
    return <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2]} />
        <meshBasicMaterial ref={material} />
    </mesh>;
}

export function Spheretree() {
    const canvas = useRef(null);
    return <>
        <canvas style={{ "display": "none" }} ref={canvas} />
        <Canvas>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Sphere canvas={canvas} />
            <OrbitControls />
        </Canvas>
    </>;
}
