import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bob TNS - Assistant Prévoyance",
  description: "Expert en prévoyance. Mutuelles, SSI, CARPIMKO, CAVEC.",
};

export default function BobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
