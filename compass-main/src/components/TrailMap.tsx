import { useEffect, useRef, useState } from "react";


export const TrailMap = () => {
 const [pathD, setPathD] = useState("");
 const pathRef = useRef<SVGPathElement>(null);
 const dotRef = useRef<SVGCircleElement>(null);


 useEffect(() => {
   const generateSmoothTerrainPath = () => {
     const width = 1200;
     const height = 800;
     const margin = 50;
     const numPoints = 24; // More points = more variation and detail
     const stepX = (width - 2 * margin) / (numPoints - 1);
     const baseAmplitude = height * 0.2;
     const baseFrequency = 5;
     const phase = Math.random() * Math.PI * 2;


     const points = [];


     for (let i = 0; i < numPoints; i++) {
       const x = margin + i * stepX;


       // Add variation per point
       const amp = baseAmplitude + (Math.random() - 0.5) * height * 0.1;
       const freqMod = 1 + (Math.random() - 0.5) * 0.5;
       const wave = Math.sin(
         (i / (numPoints - 1)) * Math.PI * baseFrequency * freqMod + phase
       );
       const jitter = (Math.random() - 0.5) * 50;
       const y = height / 2 + wave * amp + jitter;


       points.push({ x, y });
     }


     // Catmull-Rom-like Bézier smoothing
     let d = `M ${points[0].x} ${points[0].y}`;
     for (let i = 1; i < points.length - 2; i++) {
       const p0 = points[i - 1];
       const p1 = points[i];
       const p2 = points[i + 1];
       const p3 = points[i + 2];


       const cp1x = p1.x + (p2.x - p0.x) / 6;
       const cp1y = p1.y + (p2.y - p0.y) / 6;
       const cp2x = p2.x - (p3.x - p1.x) / 6;
       const cp2y = p2.y - (p3.y - p1.y) / 6;


       d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
     }


     return d;
   };


   setPathD(generateSmoothTerrainPath());
 }, []);


 useEffect(() => {
   if (!pathRef.current || !dotRef.current) return;


   const path = pathRef.current;
   const dot = dotRef.current;


   const totalLength = path.getTotalLength();
   const baseDuration = 20000; // 20s
   const baseSpeed = totalLength / (baseDuration / 16.67);


   let t = 0;
   let speed = baseSpeed;
   const gravityFactor = 0.015;
   const maxBoost = baseSpeed * 1.5;
   const minFloor = baseSpeed * 0.5;


   const animate = () => {
     const current = path.getPointAtLength(t);
     const next = path.getPointAtLength(Math.min(t + 1, totalLength));
     const dy = next.y - current.y;


     speed += gravityFactor * dy;
     speed = Math.max(minFloor, Math.min(maxBoost, speed));


     if (t >= totalLength) t = 0;
     dot.setAttribute("transform", `translate(${current.x}, ${current.y})`);
     t += speed;


     requestAnimationFrame(animate);
   };


   animate();
 }, [pathD]);


 return (
   <svg
     viewBox="0 0 1200 800"
     className="absolute inset-0 w-full h-full text-accent pointer-events-none"
     style={{ opacity: 0.2 }}
     preserveAspectRatio="xMidYMid slice"
   >
     <path
       ref={pathRef}
       d={pathD}
       stroke="currentColor"
       strokeWidth="2"
       strokeLinecap="round"
       strokeDasharray="6 6"
       fill="none"
     />
     {pathD && <circle ref={dotRef} r="5" fill="currentColor" />}
   </svg>
 );
};


