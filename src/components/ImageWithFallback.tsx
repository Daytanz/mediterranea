import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, fallbackSrc }) => {
  const [error, setError] = useState(false);

  // If source is null/empty or we encountered an error
  if (!src || error) {
    if (fallbackSrc) {
      return (
        <img 
          src={fallbackSrc} 
          alt={alt} 
          className={className} 
        />
      );
    }
    
    return (
      <div className={`flex items-center justify-center bg-zinc-100 text-zinc-300 ${className}`}>
        <ImageIcon size={20} />
      </div>
    );
  }

  // Construct correct URL
  let imageUrl = src;
  if (
    !src.startsWith('http') && 
    !src.startsWith('data:') && 
    !src.startsWith('blob:')
  ) {
      // It's a relative path (old system), prepend backend URL
      imageUrl = `https://mediterranea.onrender.com${src}`;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default ImageWithFallback;
