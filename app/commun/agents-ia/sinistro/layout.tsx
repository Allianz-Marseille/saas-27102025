import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sinistro - Assistant sinistres",
  description:
    "Expert conventions inter-assurances : IRSA, IDA, IRSI, CIDE-COP, IRCA, PAOS.",
};

export default function SinistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
