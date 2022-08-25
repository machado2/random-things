// @ts-nocheck

import { Brush, Evaluator, SUBTRACTION, ADDITION } from '@react-three/csg/src/packages/three-bvh-csg';
import { Box } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import React from 'react';
import { SphereGeometry, BoxGeometry } from 'three';

import { bufferGeometryToIndexed } from './bufferGeometryToIndexed';

function hollowSphereGeometry(radius: number): BufferGeometry {
    const segs = 6;
    const csgEvaluator = new Evaluator();
    const a = new Brush(new SphereGeometry(radius * 1.2, segs, segs));
    const b = new Brush(new SphereGeometry(radius, segs, segs));
    const c = csgEvaluator.evaluate(a, b, SUBTRACTION);
    return bufferGeometryToIndexed(c.geometry);

    /*
    const box = new BoxGeometry(radius*3, radius, radius*3);
    box.translate(0, radius, 0);
    const d = new Brush(box);
    const e = csgEvaluator.evaluate(c, d, SUBTRACTION);
    return bufferGeometryToIndexed(e.geometry);
    */
}

export function Hollowsphere(props) {
    return <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={hollowSphereGeometry(props.radius)}>
            <meshPhysicalMaterial transmission="0.9" ior="0.97" />
        </mesh>
    </RigidBody>;
}