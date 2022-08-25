import React, { useRef, useEffect } from 'react';
import './index.css'
import { drawtree } from './tree';
import { snow } from './snow';

export function Snowtree() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        drawtree(canvas, ctx);
        snow(canvas, ctx);

    });
    return <canvas ref={ref} />;
}
