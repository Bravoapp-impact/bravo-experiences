import bravoSymbol from "@/assets/bravo-symbol.svg?react";

interface BravoSymbolIconProps {
  className?: string;
}

const BravoSymbolSvg = bravoSymbol as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

export function BravoSymbolIcon({ className }: BravoSymbolIconProps) {
  return <BravoSymbolSvg className={className} fill="currentColor" preserveAspectRatio="xMidYMid meet" />;
}
