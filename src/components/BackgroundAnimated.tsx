"use client";
import { motion } from "framer-motion";


export default function BackgroundAnimated() {
// layered radial gradients + slow motion for "luxury black" look
return (
<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
{/* base gradient blobs */}
<motion.div
className="absolute -top-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,165,0,0.18)_0%,rgba(0,0,0,0)_70%)] blur-[120px] opacity-50"
animate={{ x: [0, 40, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.05, 0.95, 1] }}
transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
/>


<motion.div
className="absolute top-1/3 right-[-20vh] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0)_70%)] blur-[100px] opacity-30"
animate={{ x: [0, -30, 10, 0], y: [0, 10, -25, 0], scale: [1, 0.9, 1.1, 1] }}
transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
/>


{/* subtle noise overlay */}
<div
className="absolute inset-0 mix-blend-screen opacity-[0.07]"
style={{
backgroundImage:
"repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.15) 0, rgba(0,0,0,0) 5px)",
backgroundSize: "200px 200px",
}}
/>


{/* glass vignette */}
<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_70%)]" />
</div>
);
}