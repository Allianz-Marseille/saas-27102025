import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "John - Santé, Prévoyance et Retraite Collectives",
  description: "Expert Santé, Prévoyance et Retraite Collectives.",
};

export default function JohnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
