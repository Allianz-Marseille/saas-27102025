import { SVGProps } from "react";

export function PaletteAllianz(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M100 20L160 80L100 140L40 80L100 20Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M100 40L130 70L100 100L70 70L100 40Z"
        fill="currentColor"
      />
    </svg>
  );
}

