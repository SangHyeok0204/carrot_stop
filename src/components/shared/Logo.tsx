'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function Logo({ className = '', href = '/', onClick }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/LOGO.jpg"
        alt="I:EUM"
        width={180}
        height={60}
        className="h-12 w-auto object-contain"
        priority
      />
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </button>
    );
  }

  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      {logoContent}
    </Link>
  );
}
