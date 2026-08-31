import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "h-16 w-auto", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/rattil-digital-academy-logo.png"
      alt="Rattil Digital Academy – Quran & Arabic"
      width={1374}
      height={1314}
      className={`object-contain ${className}`}
      priority={priority}
      sizes="(max-width: 768px) 96px, 144px"
    />
  );
}
