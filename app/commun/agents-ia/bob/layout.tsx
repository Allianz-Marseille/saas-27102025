import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bob Santé - Assistant Prévoyance",
  description: "Expert santé et prévoyance TNS. Mutuelles, SSI, CARPIMKO, CAVEC.",
};

export default function BobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
