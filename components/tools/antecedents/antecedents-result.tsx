"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Mail,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AntecedentsEngine } from "@/lib/tools/antecedents/antecedentsEngine";
import type { JournalDecision } from "@/lib/tools/antecedents/antecedentsTypes";
import { toast } from "sonner";
import { AntecedentsIAChat } from "./antecedents-ia-chat";

interface AntecedentsResultProps {
  journal: JournalDecision;
  onReset: () => void;
  isClientMode: boolean;
}

export function AntecedentsResult({
  journal,
  onReset,
  isClientMode,
}: AntecedentsResultProps) {
  const engine = new AntecedentsEngine();
  const [showChat, setShowChat] = useState(false);
  const [selectedRegleId, setSelectedRegleId] = useState<string | undefined>();

  const handleCopyAll = () => {
    const texte = engine.formaterJournalTexte(journal);
    navigator.clipboard.writeText(texte);
    toast.success("Journal copié dans le presse-papiers");
  };

  const handleCopyCRM = () => {
    const texte = `CRM retenu : ${journal.crm.valeur}
Règle : ${journal.crm.regle_id}
Justification : ${journal.crm.justification}
${journal.crm.calcul ? `Calcul : ${journal.crm.calcul}` : ""}`;
    navigator.clipboard.writeText(texte);
    toast.success("Section CRM copiée");
  };

  const handleCopyEmail = () => {
    const email = engine.formaterEmail(journal);
    navigator.clipboard.writeText(email);
    toast.success("Email copié dans le presse-papiers");
  };

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF
    toast.info("Export PDF à venir");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header avec actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Journal de décision</h2>
            <p className="text-muted-foreground mt-2">
              Généré le {journal.date_generation.toLocaleDateString("fr-FR")} à{" "}
              {journal.date_generation.toLocaleTimeString("fr-FR")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Actions d'export */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopyAll} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copier tout
              </Button>
              <Button onClick={handleCopyCRM} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copier CRM seul
              </Button>
              <Button onClick={handleCopyEmail} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Format email
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contexte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Contexte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Souscripteur :</strong>{" "}
                {journal.contexte.type_souscripteur === "personne_morale"
                  ? "Personne morale"
                  : journal.contexte.type_souscripteur === "personne_physique"
                  ? "Personne physique"
                  : "Assimilé PM"}
              </p>
              <p>
                <strong>Usage :</strong> {journal.contexte.usage}
              </p>
              <p>
                <strong>Situation :</strong> {journal.contexte.situation}
              </p>
              <p>
                <strong>Nombre de véhicules actuels :</strong>{" "}
                {journal.contexte.nb_vehicules_actuels}
              </p>
              <p>
                <strong>Conducteur désigné :</strong>{" "}
                {journal.contexte.conducteur_designe ? "Oui" : "Non"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CRM retenu */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                CRM retenu : {journal.crm.valeur}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRegleId(journal.crm.regle_id);
                  setShowChat(true);
                }}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Expliquer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Badge variant="outline" className="mb-2">
                {journal.crm.regle_id}
              </Badge>
              <p className="text-sm">{journal.crm.justification}</p>
              {journal.crm.calcul && (
                <p className="text-sm text-muted-foreground mt-2">
                  Calcul : {journal.crm.calcul}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Sources :{" "}
              {journal.crm.sources
                .map((s) => `${s.document}, p.${s.page}`)
                .join(" ; ")}
            </div>
          </CardContent>
        </Card>

        {/* Sinistres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Sinistres à saisir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">
                {journal.sinistres.regle.regle_id}
              </Badge>
              <p className="text-sm">
                Période : {journal.sinistres.regle.periode_mois} mois
              </p>
              {journal.sinistres.regle.regle_speciale && (
                <p className="text-sm text-orange-600 mt-2">
                  {journal.sinistres.regle.regle_speciale}
                </p>
              )}
            </div>

            <div className="text-sm">
              <p className="font-semibold mb-2">À retenir :</p>
              <ul className="list-disc list-inside space-y-1">
                {journal.sinistres.regle.a_retenir.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {journal.sinistres.regle.a_exclure.length > 0 && (
              <div className="text-sm">
                <p className="font-semibold mb-2">À exclure :</p>
                <ul className="list-disc list-inside space-y-1">
                  {journal.sinistres.regle.a_exclure.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {journal.sinistres.liste.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-2">
                  Nombre déclaré : {journal.sinistres.liste.length} sinistre(s)
                </p>
                <div className="space-y-2">
                  {journal.sinistres.liste.map((sin, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm"
                    >
                      {index + 1}. {sin.date.toLocaleDateString("fr-FR")} –{" "}
                      {sin.nature} – {sin.responsabilite} – {sin.montant} €
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pièces à conserver */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pièces à conserver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {journal.pieces.ri_conducteur ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                )}
                <span className="text-sm">Relevé d'informations conducteur</span>
              </div>
              {journal.pieces.ri_vehicule && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relevé d'informations véhicule(s)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {journal.pieces.carte_vtc ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                )}
                <span className="text-sm">Carte VTC</span>
              </div>
              {journal.pieces.justificatif_affectation && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Justificatif affectation conducteur</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertes */}
        {journal.alertes.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {journal.alertes.map((alerte, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold">• {alerte.message}</p>
                    {alerte.action && (
                      <p className="text-muted-foreground mt-1">→ {alerte.action}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blocages */}
        {journal.blocages.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Blocages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {journal.blocages.map((blocage, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold text-red-600">• {blocage.message}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Source : {blocage.source}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sources réglementaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Sources réglementaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {journal.sources.map((source, index) => (
                <div key={index}>
                  • {source.document} (p.{source.page}
                  {source.section ? `, ${source.section}` : ""})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat IA */}
        {showChat && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Assistant explicatif
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                >
                  Fermer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AntecedentsIAChat
                journal={journal}
                regleId={selectedRegleId}
              />
            </CardContent>
          </Card>
        )}

        {/* Bouton pour ouvrir le chat */}
        {!showChat && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => {
                setShowChat(true);
                setSelectedRegleId(undefined);
              }}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Questions sur ce résultat ?
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
