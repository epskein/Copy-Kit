import React from 'react';
import { useBackgroundCycler } from '../hooks/useBackgroundCycler';

export const BackgroundCycler: React.FC = () => {
  const { currentImage, currentImageIndex } = useBackgroundCycler();

  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out z-[-2]"
        style={{
          backgroundImage: `url('${currentImage}'), linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)`,
        }}
        key={currentImageIndex}
      />
      
      {/* Overlay for consistent glass effect */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><defs><pattern id=\\"grain\\" patternUnits=\\"userSpaceOnUse\\" width=\\"100\\" height=\\"100\\"><circle cx=\\"20\\" cy=\\"20\\" r=\\"1\\" fill=\\"%23ffffff\\" opacity=\\"0.05\\"/><circle cx=\\"80\\" cy=\\"40\\" r=\\"1\\" fill=\\"%23ffffff\\" opacity=\\"0.03\\"/><circle cx=\\"40\\" cy=\\"80\\" r=\\"1\\" fill=\\"%23ffffff\\" opacity=\\"0.06\\"/><circle cx=\\"90\\" cy=\\"90\\" r=\\"1\\" fill=\\"%23ffffff\\" opacity=\\"0.04\\"/><circle cx=\\"10\\" cy=\\"60\\" r=\\"1\\" fill=\\"%23ffffff\\" opacity=\\"0.05\\"/></pattern></defs><rect width=\\"100%\\" height=\\"100%\\" fill=\\"url(%23grain)\\"/></svg>") repeat'
          }}
        />
      </div>
    </>
  );
};
