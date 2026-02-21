"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, getUserData } from "@/lib/firebase/auth";
import { isFirebaseAuthReady } from "@/lib/firebase/config";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { ROLES } from "@/lib/utils/roles";
import { isEmailDomainAllowed, getInvalidDomainErrorMessage, ALLOWED_EMAIL_DOMAINS } from "@/lib/config/auth-config";

const loginSchema = z.object({
  email: z.string().email("Email invalide").refine(
    (email) => isEmailDomainAllowed(email),
    getInvalidDomainErrorMessage()
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
        const userRole = userData?.role;
        if (userRole === ROLES.ADMINISTRATEUR) {
          router.push("/admin");
        } else if (userRole === ROLES.COMMERCIAL_SANTE_INDIVIDUEL) {
          router.push("/sante-individuelle");
        } else if (userRole === ROLES.COMMERCIAL_SANTE_COLLECTIVE) {
          router.push("/sante-collective");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error && error.message === "Firebase not initialized"
          ? "Configuration Firebase manquante. Vérifiez les variables NEXT_PUBLIC_FIREBASE_* sur Vercel (Production) et redéployez."
          : error instanceof Error
            ? error.message
            : "Erreur de connexion";
      toast.error(msg);
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
            {!isFirebaseAuthReady() && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                Configuration Firebase manquante. Vérifiez les variables{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                  NEXT_PUBLIC_FIREBASE_*
                </code>{" "}
                sur Vercel (Production) et redéployez l&apos;application.
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={`vous${ALLOWED_EMAIL_DOMAINS[0]}`}
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
                  autoComplete="current-password"
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
                disabled={isLoading || !isFirebaseAuthReady()}
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

