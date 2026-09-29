import Image from 'next/image';

export function BrandLogo({className = ''}: {className?: string}) {
  return <Image className={`showki-logo ${className}`} src="/assets/brand/showki-logo.svg" alt="SHOWKI BIOTECH 修齐" width={230} height={63} priority />;
}
