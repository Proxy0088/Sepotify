import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface ArtistCardProps {
  name: string;
  genre: string;
  imageUrl: string;
  onSelect: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  name,
  genre,
  imageUrl,
  onSelect,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onSelect}
      className="group bg-[#121212] hover:bg-[#1f1f1f] p-3 rounded-[6px] transition-all duration-200 cursor-pointer flex flex-col items-center text-center"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[#222222] shadow-lg mb-3">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#1ed760]/30 to-[#121212] text-xl font-bold text-white">
            {name.charAt(0)}
          </div>
        )}

        {/* Hover Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-md scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-white truncate max-w-full">{name}</h4>
      <p className="text-xs text-[#b3b3b3] mt-0.5 font-normal">هنرمند · {genre}</p>
    </div>
  );
};
