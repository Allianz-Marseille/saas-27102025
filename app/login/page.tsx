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
import dynamicImport from "next/dynamic";

const PixelBlast = dynamicImport(() => import("@/components/ui/PixelBlast"), {
  ssr: false,
});

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
      
      // Récupérer le rôle de l'utilisateur
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        
        // Rediriger selon le rôle
        if (userData?.role === ROLES.ADMINISTRATEUR) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
      
      toast.success("Connexion réussie !");
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 relative">
      {/* PixelBlast Background */}
      <div className="fixed inset-0 z-0 opacity-70">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#00529B"
          patternScale={2}
          patternDensity={1.5}
          pixelSizeJitter={0.3}
          enableRipples
          rippleSpeed={0.5}
          rippleThickness={0.15}
          rippleIntensityScale={2}
          liquid
          liquidStrength={0.15}
          liquidRadius={1.5}
          liquidWobbleSpeed={4}
          speed={0.8}
          edgeFade={0.2}
          transparent
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/allianz.svg"
            alt="Allianz"
            width={150}
            height={40}
            priority
            className="h-12 w-auto brightness-0 dark:brightness-100"
          />
        </div>
        
        <Card>
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

