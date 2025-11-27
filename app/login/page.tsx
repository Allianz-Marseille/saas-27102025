"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, getUserData } from "@/lib/firebase/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { ROLES } from "@/lib/utils/roles";

const loginSchema = z.object({
  email: z.string().email("Email invalide").refine(
    (email) => email.endsWith("@allianz-nogaro.fr"),
    "L'email doit se terminer par @allianz-nogaro.fr"
  ),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const firebaseUser = await login(data.email, data.password);
      
      // Récupérer le rôle de l'utilisateur et rediriger
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        
        // Toast de succès
        toast.success("Connexion réussie !");
        
        // Rediriger selon le rôle (le log de connexion sera créé automatiquement par useAuth)
        if (userData?.role === ROLES.ADMINISTRATEUR) {
          router.push("/admin");
        } else if (userData?.role === ROLES.COMMERCIAL_SANTE_INDIVIDUEL) {
          router.push("/sante-individuelle");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background image avec flou */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/vieux_port.jpeg"
          alt="Vieux-Port de Marseille"
          fill
          priority
          className="object-cover"
          style={{ filter: 'blur(8px)' }}
          quality={90}
        />
        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60" />
      </div>

      {/* Contenu de la page */}
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/allianz.svg"
            alt="Allianz"
            width={150}
            height={40}
            priority
            className="h-12 w-auto brightness-0 invert drop-shadow-2xl"
          />
        </div>
        
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Connexion
            </CardTitle>
            <CardDescription className="text-center">
              Accédez à votre espace Allianz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@allianz-nogaro.fr"
                  {...registerField("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  {...registerField("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00529B] hover:bg-[#003d73]"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

