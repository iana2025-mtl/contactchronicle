export default function Logo({ className = "w-32 h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tangled timeline lines */}
      <g stroke="#FFB84D" strokeWidth="2" fill="none" opacity="0.8">
        <path d="M30,20 Q50,60 80,40 T130,30 Q150,70 170,50" />
        <path d="M50,100 Q70,40 100,80 T150,90 Q170,130 180,110" />
        <path d="M20,150 Q60,100 90,140 T140,120 Q160,160 190,140" />
        <path d="M70,10 Q90,50 110,20 T160,60 Q180,100 190,80" />
        <path d="M10,80 Q40,50 70,70 T120,50 Q140,90 160,70" />
      </g>
      
      {/* Clock hand in center */}
      <g transform="translate(100,90)">
        <circle cx="0" cy="0" r="8" fill="#333" />
        <line x1="0" y1="0" x2="-40" y2="-30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
      </g>
      
      {/* Small objects in the tangle */}
      <g opacity="0.7">
        {/* Toaster */}
        <rect x="20" y="25" width="18" height="12" rx="2" fill="#ADD8E6" />
        <rect x="23" y="28" width="12" height="6" fill="#DEB887" />
        <circle cx="25" cy="30" r="2" fill="#654321" />
        
        {/* Books */}
        <rect x="25" y="140" width="15" height="12" fill="#DC143C" />
        <rect x="28" y="145" width="15" height="12" fill="#228B22" />
        <rect x="31" y="150" width="15" height="12" fill="#4169E1" />
        
        {/* Coffee mug */}
        <rect x="155" y="120" width="16" height="20" rx="2" fill="#FFF" stroke="#333" strokeWidth="1" />
        <line x1="171" y1="125" x2="175" y2="122" stroke="#333" strokeWidth="1.5" />
        <path d="M159,128 Q163,125 167,128" stroke="#8B4513" strokeWidth="2" fill="none" />
      </g>
      
      {/* Sloth body */}
      <g transform="translate(100,100)">
        {/* Sloth head */}
        <ellipse cx="0" cy="-10" rx="20" ry="18" fill="#CD853F" />
        <ellipse cx="-8" cy="-12" rx="6" ry="8" fill="#8B4513" />
        <ellipse cx="8" cy="-12" rx="6" ry="8" fill="#8B4513" />
        
        {/* Eyes */}
        <circle cx="-6" cy="-10" r="2" fill="#000" />
        <circle cx="6" cy="-10" r="2" fill="#000" />
        <circle cx="-5.5" cy="-9.5" r="0.8" fill="#FFF" />
        <circle cx="6.5" cy="-9.5" r="0.8" fill="#FFF" />
        
        {/* Wizard hat */}
        <path d="M-12,-18 L-8,-28 L0,-35 L8,-28 L12,-18 Z" fill="#4B0082" />
        {/* Stars on hat */}
        <circle cx="-6" cy="-25" r="1.5" fill="#FFD700" />
        <circle cx="2" cy="-30" r="1.5" fill="#FFD700" />
        <circle cx="8" cy="-24" r="1.5" fill="#FFD700" />
        
        {/* Sloth body */}
        <ellipse cx="0" cy="8" rx="22" ry="16" fill="#CD853F" />
        
        {/* Arms */}
        <ellipse cx="-18" cy="5" rx="8" ry="12" fill="#CD853F" />
        <ellipse cx="18" cy="5" rx="8" ry="12" fill="#CD853F" />
        
        {/* Hand holding line */}
        <line x1="25" y1="3" x2="40" y2="-10" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Numbers in tangle */}
      <text x="165" y="25" fill="#DC143C" fontSize="14" fontWeight="bold">12</text>
      <text x="160" y="130" fill="#DC143C" fontSize="14" fontWeight="bold">3</text>
      <text x="50" y="165" fill="#4169E1" fontSize="12" fontWeight="bold">6</text>
    </svg>
  );
}

