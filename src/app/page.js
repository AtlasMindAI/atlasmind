"use client"; // Enables hooks and event handlers

import { useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabase.js";

export default function Home() {
  const canvasRef = useRef(null); // Points to canvas DOM element
  const [email, setEmail] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H;
    let animId;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const NODES = 120;
    const DEPTH = 800;
    const FOV = 400;

    let nodes = Array.from({ length: NODES }, () => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 1200,
      z: Math.random() * DEPTH,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: 0.4 + Math.random() * 0.6,
      r: Math.random() * 2 + 1,
    }));

    function project(x, y, z) {
      const scale = FOV / (FOV + z);
      return { sx: x * scale + W / 2, sy: y * scale + H / 2, scale };
    }

    let angle = 0;

    function draw() {
      ctx.fillStyle = "#030b1a";
      ctx.fillRect(0, 0, W, H);

      angle += 0.0015;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const projected = nodes.map((n) => {
        const rx = n.x * cos - n.z * sin;
        const rz = n.x * sin + n.z * cos;
        return project(rx, n.y, rz);
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = projected[i], b = projected[j];
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dz = nodes[i].z - nodes[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 280) {
            const alpha = (1 - dist / 280) * 0.25 * Math.min(a.scale, b.scale) * 3;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = `rgba(120,200,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n, i) => {
        const p = projected[i];
        const glow = p.scale * 5;
        const alpha = Math.min(1, p.scale * 2.5);

        // Fix: Math.max(0,...) ensures radius is never negative
        const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, Math.max(0, n.r * glow * 4));
        grad.addColorStop(0, `rgba(100,200,255,${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(100,200,255,0)`);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0, n.r * glow * 4), 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0, n.r * glow), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${alpha})`;
        ctx.fill();

        // Move nodes
        n.z -= n.vz;
        n.x += n.vx;
        n.y += n.vy;

        // Reset if out of bounds
        if (n.z < -FOV || n.z > DEPTH * 2) {
          n.z = DEPTH;
          n.x = (Math.random() - 0.5) * 1200;
          n.y = (Math.random() - 0.5) * 1200;
        }
        if (Math.abs(n.x) > 1000) n.x = (Math.random() - 0.5) * 1200;
        if (Math.abs(n.y) > 1000) n.y = (Math.random() - 0.5) * 1200;
      });

      animId = requestAnimationFrame(draw); // Store animation ID for cleanup
    }

    draw(); // Start animation

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []); // [] = run once on mount
  
  const handleSubmit = async () => {
    const { error } = await supabase.from("EMAILS").insert([{ Email: email }])       
    
    if (error) {
        alert("Error. Try again")
    } else {
        alert("Congratulations! You've have joined the waitlist.")
    }       
  };

  return (
    <main className="min-h-screen">
      <canvas ref={canvasRef} style = {{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1}} />
      <section className="min-h-screen flex items-center justify-center relative z-10">
       <div className="flex flex-col items-center text-center backdrop-blur-md bg-white/5 border border-blue-400/20 rounded-2xl px-10 py-12 shadow-2xl max-w-2xl mx-auto"> 
       <h1 className="text-6xl font-bold tracking-tight text-blue-50 drop-shadow-[0_0_18px_rgba(120, 200, 255, 0.6)]"> 
         AtlasMindAI 
       </h1>
       <p className="text-lg md:text-xl text-cente text-blue-300 mt-4 max-w-2xl leading-relaxed"> Building intelligent systems that  enhance human capabilities</p>
       <div className="flex flex-col items-center gap-5 mt-6"> 
       <input onChange={(e) => setEmail(e.target.value)} 
        value={email}
        className="mt-4 px-4 py-3 rounded-lg w-72 bg-transparent border border-blue-400 text-white placeholder-blue-300"
        placeholder="Please, Enter your mail"/>
       <button
        onClick={handleSubmit} 
        className="mt-4 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"> Join Waitlist </button>
       <p className="text-blue-400 text-sm mt-4"> 
       Early access. No spam.
       <br/>
       120+ joined the journey. 
       </p>
      </div>
      </div>
      </section> 

    </main>
  );
}
 
