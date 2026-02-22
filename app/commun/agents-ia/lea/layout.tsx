import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Léa - Santé Individuelle",
  description: "Expert Santé Individuelle.",
};

export default function LeaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
