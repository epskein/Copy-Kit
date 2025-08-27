import { useState, useEffect } from 'react';

// Import all background images
const backgroundImages = [
  '/bg_images/pexels-billelmoula-540518.jpg',
  '/bg_images/pexels-joyston-judah-331625-933054.jpg'
];

export const useBackgroundCycler = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    currentImage: backgroundImages[currentImageIndex],
    nextImage: backgroundImages[(currentImageIndex + 1) % backgroundImages.length],
    currentImageIndex
  };
};
