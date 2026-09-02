import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];

  // Base classes for both image and fallback
  const baseClasses = `rounded-full flex items-center justify-center flex-shrink-0 ${sizeClass} ${className}`;

  if (src && !imageError) {
    const imageUrl = src.startsWith('http') || src.startsWith('blob:') ? src : `http://localhost:5000${src}`;
    return (
      <img
        src={imageUrl}
        alt={name || 'User Avatar'}
        className={`${baseClasses} object-cover ring-1 ring-black/5 bg-gray-50`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback state
  return (
    <div className={`${baseClasses} bg-indigo-100 text-indigo-700 font-bold uppercase ring-1 ring-black/5 shadow-inner`}>
      {initials ? initials : <User className="w-1/2 h-1/2 opacity-75" />}
    </div>
  );
};

export default Avatar;
