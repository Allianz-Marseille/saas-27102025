/**
 * Modale explicative des routes de gestion des sinistres
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  Search,
  Car,
  Heart,
  Building,
  Scale,
  HelpCircle,
} from "lucide-react";
import { SinistreRoute } from "@/types/sinistre";

interface RoutesInfoDialogProps {
  trigger?: React.ReactNode;
}

const ROUTES_INFO = [
  {
    route: SinistreRoute.ROUTE_A,
    icon: Wrench,
    title: "Route A - Réparation pilotée / réseau d'artisans",
    when: "Petits/moyens dommages \"réparables vite\", besoin de sécurisation/organisation, préférence pour un parcours court",
    steps: [
      "Déclaration",
      "Triage",
      "Mission artisan",
      "Devis",
      "Accord",
      "Travaux",
      "Facture",
      "Règlement",
      "Clôture",
    ],
    context: "Allianz a ce modèle via réseau d'artisans (accord rapide, organisation intervention, évaluation, etc.). Côté assistance, Allianz Partners pousse aussi du diagnostic vidéo type Visi'Home (dépannage/auto-réparation/artisan).",
  },
  {
    route: SinistreRoute.ROUTE_B,
    icon: Search,
    title: "Route B - Expertise dommages",
    when: "Dommage important, suspicion, désaccord, montant élevé, besoin d'un rapport opposable",
    steps: [
      "Déclaration",
      "Collecte pièces",
      "Mission expert",
      "RDV",
      "Rapport",
      "Chiffrage",
      "Offre/règlement",
      "Clôture",
    ],
    context: "Expertise dommages pour les sinistres IARD et auto nécessitant une évaluation approfondie.",
  },
  {
    route: SinistreRoute.ROUTE_C,
    icon: Car,
    title: "Route C - Auto matériel conventionnel (IRSA)",
    when: "Accident matériel avec tiers, gestion inter-assureurs",
    steps: [
      "Constat/infos tiers",
      "Application barème / responsabilités",
      "Réparation/expert",
      "Indemnisation",
      "Recours inter-compagnies",
    ],
    context: "La convention IRSA organise l'indemnisation/recours entre assureurs pour les dommages matériels.",
  },
  {
    route: SinistreRoute.ROUTE_D,
    icon: Heart,
    title: "Route D - Auto corporel (IRCA / droit commun)",
    when: "Blessés, ITT, préjudices corporels",
    steps: [
      "Ouverture corporel",
      "Pièces médicales / avocat éventuel",
      "Médecin-conseil/expertises",
      "Offres",
      "Transaction/recours",
    ],
    context: "La convention IRCA est un cadre inter-assureurs pour l'indemnisation corporelle dans beaucoup de cas (sinon droit commun / Badinter).",
  },
  {
    route: SinistreRoute.ROUTE_E,
    icon: Building,
    title: "Route E - Immeuble / dégât des eaux / incendie (IRSI)",
    when: "Dégâts des eaux/incendie dans immeuble (copro/locatif), multi-acteurs (occupant, copro, voisin…)",
    steps: [
      "Tri \"qui est gestionnaire ?\"",
      "Recherche fuite/mesures conservatoires",
      "Devis/travaux",
      "Indemnisation/recours",
    ],
    context: "La convention IRSI (en vigueur depuis 01/06/2018) remplace CIDRE pour faciliter la gestion/recours des sinistres immeuble.",
  },
  {
    route: SinistreRoute.ROUTE_F,
    icon: Scale,
    title: "Route F - Responsabilité / litige / protection juridique",
    when: "Réclamation d'un tiers, mise en cause, assignation, ou litige PJ",
    steps: [
      "Réception réclamation",
      "Analyse garantie (RC/PJ)",
      "Stratégie (défense, expertise contradictoire, transaction)",
      "Position (prise en charge / refus motivé)",
      "Clôture",
    ],
    context: "Gestion des réclamations de tiers, mises en cause et litiges nécessitant une approche juridique.",
  },
];

export function RoutesInfoDialog({ trigger }: RoutesInfoDialogProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <HelpCircle className="h-4 w-4 mr-2" />
      Guide des routes
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guide des routes de gestion</DialogTitle>
          <DialogDescription>
            Explication détaillée des 6 routes de gestion des sinistres
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={SinistreRoute.ROUTE_A} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {ROUTES_INFO.map((routeInfo) => {
              const Icon = routeInfo.icon;
              return (
                <TabsTrigger
                  key={routeInfo.route}
                  value={routeInfo.route}
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">Route {routeInfo.route.charAt(5)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ROUTES_INFO.map((routeInfo) => {
            const Icon = routeInfo.icon;
            return (
              <TabsContent key={routeInfo.route} value={routeInfo.route}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{routeInfo.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Quand utiliser cette route ?</h4>
                      <p className="text-sm text-muted-foreground">
                        {routeInfo.when}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Étapes typiques</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {routeInfo.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Contexte</h4>
                      <p className="text-sm text-muted-foreground">
                        {routeInfo.context}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

