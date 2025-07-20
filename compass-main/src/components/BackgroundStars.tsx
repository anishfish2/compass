import { CompassStar } from "@/components/CompassStar";


// Customize how many rows/cols to divide the screen into
const GRID_ROWS = 4;
const GRID_COLS = 5;
const CELL_PADDING_PERCENT = 10; // avoid exact edges
const MAX_STARS = 18;


export const BackgroundStars = () => {
 const takenCells = new Set<string>();
 const stars = [];


 while (stars.length < MAX_STARS && takenCells.size < GRID_ROWS * GRID_COLS) {
   const row = Math.floor(Math.random() * GRID_ROWS);
   const col = Math.floor(Math.random() * GRID_COLS);
   const cellId = `${row}-${col}`;


   if (takenCells.has(cellId)) continue;
   takenCells.add(cellId);


   const cellWidth = 100 / GRID_COLS;
   const cellHeight = 100 / GRID_ROWS;
   const top =
     row * cellHeight +
     CELL_PADDING_PERCENT * (Math.random() * 0.5 + 0.25); // ~2.5–7.5%
   const left =
     col * cellWidth +
     CELL_PADDING_PERCENT * (Math.random() * 0.5 + 0.25); // ~2.5–7.5%


   const size = Math.floor(Math.random() * 30) + 30; // 30–60px
   const rotate = Math.random() * 360;
   const opacity = 0.1 + Math.random() * 0.2;


   stars.push(
     <div
       key={cellId}
       className="absolute pointer-events-none"
       style={{
         top: `${top}%`,
         left: `${left}%`,
         width: `${size}px`,
         height: `${size}px`,
         transform: `rotate(${rotate}deg)`,
         opacity,
         filter: "blur(0.5px)",
       }}
     >
       <CompassStar className="text-accent w-full h-full" />
     </div>
   );
 }


 return <>{stars}</>;
};


