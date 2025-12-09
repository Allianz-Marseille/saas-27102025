"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/DecryptedText";

export default function LeadsProcessPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          <DecryptedText
            text="Gestion des Leads"
            animateOn="view"
            revealDirection="center"
            speed={30}
            maxIterations={15}
            className="text-foreground"
            encryptedClassName="text-muted-foreground opacity-50"
          />
        </h1>
      </div>
    </div>
  );
}
