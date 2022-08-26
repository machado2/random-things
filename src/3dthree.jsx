import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';

const angsize = Math.PI / 1.5;

function angle() {
    return Math.random() * angsize - angsize / 2;
}


function Branch(props) {
    const mesh = useRef()
    const level = props.level;
    const rotx = level == 1 ? 0 : angle();
    const roty = level == 1 ? 0 : angle();
    const rotz = level == 1 ? 0 : angle();
    const len = 1 / Math.pow(props.level, 0.5);
    const radius = 0.05 / props.level;
    const radius2 = 0.05 / (props.level + 1);
    const color = Math.floor(Math.random() * 0xFFFFFF)

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
                    <cylinderGeometry args={[radius2, radius, len]} />
                    <meshPhysicalMaterial color={props.color} />
                    {children}
                </mesh>
            </group>
        </mesh>

    </>
}

export function Threetree() {

    return <Canvas>
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[10, 10, -10]} />
        <Branch position={[0, -1, 0]} level={1} />
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[3]} />
            <meshPhysicalMaterial transmission="0.9" ior="0.97" />
        </mesh>
        <OrbitControls />
    </Canvas>;
}
