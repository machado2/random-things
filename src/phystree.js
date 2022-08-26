import { Physics, RigidBody } from '@react-three/rapier';
import { OrbitControls, Cylinder, Cone, Plane } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useRef, useMemo, useEffect, useState } from 'react';
import niceColors from 'nice-color-palettes';
import { Perf, usePerf } from 'r3f-perf';
import * as uuid from 'uuid';
const halfpi = Math.PI / 2;
const angsize = Math.PI / 1.5;
function angle() {
    return Math.random() * angsize - angsize / 2;
}
function Branch(props) {
    const mesh = useRef(null);
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
            children.push(React.createElement(Branch, { key: i, matprop: props.matprop, position: [0, len / 2, 0], level: props.level + 1, color: color }));
        }
    }
    return React.createElement(React.Fragment, null,
        React.createElement("mesh", { ...props, "rotation-x": rotx, "rotation-y": roty, "rotation-z": rotz, scale: "1", ref: mesh },
            React.createElement("group", null,
                React.createElement("mesh", { position: [0, len / 2, 0], castShadow: true },
                    React.createElement(RigidBody, { type: "fixed" },
                        React.createElement(Cylinder, { args: [radius2, radius, len] },
                            React.createElement("meshPhysicalMaterial", { color: props.color }))),
                    children))));
}
const rndz = (multiplier) => (Math.random() - 0.5) * multiplier;
function Snowflake(props) {
    const radius = 0.1;
    const rbottom = 0.05;
    const vel = [rndz(2), rndz(2), rndz(2)];
    const avel = [rndz(2), rndz(2), rndz(2)];
    /// const material = <meshLambertMaterial transparent opacity={0.7} color={niceColors[0][Math.floor(Math.random() * 5)]} />
    const material = React.createElement("meshPhysicalMaterial", { transmission: 0.9, ior: 0.5, color: niceColors[0][Math.floor(Math.random() * 5)] });
    return React.createElement(RigidBody, { position: props.position, linearDamping: 2, linearVelocity: vel, angularVelocity: avel },
        React.createElement(Cone, { position: [0, radius / 2, 0], args: [rbottom, radius] }, material),
        React.createElement(Cone, { position: [0, 0, radius / 2], args: [rbottom, radius], rotation: [halfpi, 0, 0] }, material),
        React.createElement(Cone, { position: [0, -radius / 2, 0], args: [rbottom, radius], rotation: [Math.PI, 0, 0] }, material),
        React.createElement(Cone, { position: [0, 0, -radius / 2], args: [rbottom, radius], rotation: [-halfpi, 0, 0] }, material),
        React.createElement(Cone, { position: [-radius / 2, 0, 0], args: [rbottom, radius], rotation: [0, 0, halfpi] }, material),
        React.createElement(Cone, { position: [radius / 2, 0, 0], args: [rbottom, radius], rotation: [0, 0, -halfpi] }, material));
}
let lastfps = [];
const minsnow = 50;
const maxsnow = 1000;
function Snow() {
    var _a, _b, _c;
    const [spheres, setSpheres] = useState([]);
    const [shouldCreateNew, setShouldCreateNew] = useState(false);
    const fps = (_c = (_b = (_a = usePerf()) === null || _a === void 0 ? void 0 : _a.log) === null || _b === void 0 ? void 0 : _b.fps) !== null && _c !== void 0 ? _c : 0;
    useFrame(() => {
        if (shouldCreateNew) {
            setShouldCreateNew(false);
            lastfps = lastfps.concat([fps]).slice(-5);
            const isSlow = lastfps.some(x => x < 20) && spheres.length >= minsnow;
            const pos = [rndz(2), 5, rndz(2)];
            spheres.push(React.createElement(Snowflake, { key: uuid.v4(), position: pos }));
            setSpheres(isSlow ? spheres.slice(-minsnow) : spheres);
        }
    });
    useEffect(() => {
        const timer = setInterval(() => setShouldCreateNew(true), 1000);
        return () => clearInterval(timer);
    }, [true]);
    return React.createElement(React.Fragment, null, spheres);
}
export function Physicstree() {
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
    return React.createElement(Canvas, null,
        React.createElement("ambientLight", null),
        React.createElement("pointLight", { position: [10, 10, 10] }),
        React.createElement("pointLight", { position: [10, 10, -10] }),
        React.createElement(Physics, { gravity: [0, -1, 0] },
            React.createElement(RigidBody, null,
                React.createElement(Plane, { args: [1000, 1000], "position-y": -1, "rotation-x": -halfpi },
                    React.createElement("meshPhysicalMaterial", { color: "red" }))),
            React.createElement(Branch, { position: [0, -1, 0], level: 1 }),
            React.createElement(Snow, null),
            React.createElement(Perf, null)),
        React.createElement(OrbitControls, null));
}
