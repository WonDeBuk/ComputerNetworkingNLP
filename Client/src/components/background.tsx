import { useEffect, useState } from "react";

const GRID_SIZE = 40;

export const Background = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const Rectangles = [];
  const cols = Math.ceil(windowSize.width / GRID_SIZE);
  const rows = Math.ceil(windowSize.height / GRID_SIZE);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      Rectangles.push(
        <rect
          key={`${x}-${y}`}
          className="stroke-foreground-200 fill-transparent"
          height={GRID_SIZE}
          width={GRID_SIZE}
          x={x * GRID_SIZE}
          y={y * GRID_SIZE}
        />,
      );
    }
  }

  return (
    <div className="overflow-hidden z-10 pointer-events-auto absolute inset-0 w-full h-full">
      <div
        className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/25 dark:bg-primary/35 blur-[100px] animate-float"
        style={{
          animationDuration: "15s",
          opacity: 0.8,
          transform: "translateY(0px) scale(1)",
          transition:
            "opacity 1s ease-out, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/40 dark:bg-blue-600/30 blur-[80px] animate-float"
        style={{
          animationDuration: "12s",
          animationDelay: "1s",
          opacity: 0.7,
          transform: "translateX(0px) scale(1)",
          transition:
            "opacity 1.2s ease-out 0.1s, transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/30 dark:bg-purple-600/25 blur-[70px] animate-float"
        style={{
          animationDuration: "18s",
          animationDelay: "2s",
          opacity: 0.6,
          transform: "translateY(0px) scale(1)",
          transition:
            "opacity 1.3s ease-out 0.3s, transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-[250px] h-[250px] rounded-full bg-cyan-400/35 dark:bg-cyan-500/30 blur-[60px] animate-float"
        style={{
          animationDuration: "14s",
          animationDelay: "1.5s",
          opacity: 0.5,
          transform: "translateX(0px) scale(1)",
          transition:
            "opacity 1.4s ease-out 0.5s, transform 1.7s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <svg className="absolute inset-0 w-full h-full">{Rectangles}</svg>
    </div>
  );
};
