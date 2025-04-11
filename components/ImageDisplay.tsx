import React from "react";
import Image from "next/image";

interface ImageDisplayProps {
  imageUrl: string;
  altText: string;
  width?: number;
  height?: number;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  altText,
  width = 100,
  height = 100,
}) => {
  return (
    <div className="flex items-center justify-center">
      <Image
        src={imageUrl}
        alt={altText}
        width={width}
        height={height}
        className="h-16 text-center text-sm"
      />
    </div>
  );
};

export default ImageDisplay;
