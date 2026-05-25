import Image from "next/image";
import Link from "next/link";

type VenSharesLogoProps = {
  priority?: boolean;
  className?: string;
};

export function VenSharesLogo({ priority, className = "" }: VenSharesLogoProps) {
  return (
    <Link href="/" className={`inline-flex shrink-0 ${className}`.trim()}>
      <Image
        src="/assets/Venshares logo web.png"
        alt="VenShares — Where Ideas meet Action"
        width={240}
        height={56}
        className="h-9 sm:h-11 md:h-14 w-auto"
        priority={priority}
      />
    </Link>
  );
}
