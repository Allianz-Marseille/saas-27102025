"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { KPI } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExportActionsProps {
  kpi: KPI;
  selectedMonth: string;
  userName?: string;
}

export function ExportActions({ kpi, selectedMonth, userName = "Commercial" }: ExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Créer un nouveau document PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFillColor(0, 82, 155); // Bleu Allianz
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('Rapport de Commissions', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      const monthDate = new Date(selectedMonth + "-01");
      const monthLabel = format(monthDate, "MMMM yyyy", { locale: fr });
      pdf.text(monthLabel, pageWidth / 2, 30, { align: 'center' });
      
      // Réinitialiser la couleur du texte
      pdf.setTextColor(0, 0, 0);
      
      // Informations commerciales
      let yPos = 50;
      pdf.setFontSize(14);
      pdf.text(`Commercial: ${userName}`, 20, yPos);
      yPos += 10;
      pdf.setFontSize(10);
      pdf.text(`Date d'édition: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`, 20, yPos);
      
      // Section KPI
      yPos += 15;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 60, 'F');
      
      yPos += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indicateurs clés', 20, yPos);
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const kpiData = [
        { label: 'Chiffre d\'affaires', value: formatCurrency(kpi.caMensuel) },
        { label: 'CA Auto/Moto', value: formatCurrency(kpi.caAuto) },
        { label: 'CA Autres', value: formatCurrency(kpi.caAutres) },
        { label: 'Nombre de contrats', value: kpi.nbContrats.toString() },
        { label: 'Ratio', value: `${kpi.ratio.toFixed(1)}%` },
        { label: 'Nombre de process', value: kpi.nbProcess.toString() },
      ];
      
      kpiData.forEach((item) => {
        pdf.text(`${item.label}:`, 20, yPos);
        pdf.text(item.value, 100, yPos);
        yPos += 7;
      });
      
      // Section Commissions
      yPos += 10;
      pdf.setFillColor(0, 82, 155);
      pdf.rect(15, yPos, pageWidth - 30, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Commissions', 20, yPos + 7);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      yPos += 15;
      
      pdf.setFontSize(12);
      pdf.text('Commissions potentielles:', 20, yPos);
      pdf.text(formatCurrency(kpi.commissionsPotentielles), 100, yPos);
      yPos += 7;
      
      pdf.text('Commissions réelles:', 20, yPos);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(kpi.commissionsReelles), 100, yPos);
      pdf.setFont('helvetica', 'normal');
      yPos += 7;
      
      pdf.text('Statut:', 20, yPos);
      if (kpi.commissionValidee) {
        pdf.setTextColor(0, 150, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('✓ VALIDÉES', 100, yPos);
      } else {
        pdf.setTextColor(255, 100, 0);
        pdf.text('En attente', 100, yPos);
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      // Section Validation
      yPos += 15;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 35, 'F');
      
      yPos += 7;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Conditions de validation', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      
      yPos += 7;
      const conditions = [
        { label: 'Commissions ≥ 200€', met: kpi.commissionsPotentielles >= 200 },
        { label: 'Process ≥ 15', met: kpi.nbProcess >= 15 },
        { label: 'Ratio ≥ 100%', met: kpi.ratio >= 100 },
      ];
      
      conditions.forEach((condition) => {
        const icon = condition.met ? '✓' : '✗';
        pdf.setTextColor(condition.met ? 0 : 255, condition.met ? 150 : 100, 0);
        pdf.text(`${icon} ${condition.label}`, 25, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 7;
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        'Document généré automatiquement - Allianz SaaS',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Sauvegarder le PDF
      const fileName = `commissions_${selectedMonth}_${userName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success("Export PDF réussi");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        ['Indicateur', 'Valeur'],
        ['Mois', selectedMonth],
        ['Commercial', userName],
        [''],
        ['CA Mensuel', kpi.caMensuel],
        ['CA Auto/Moto', kpi.caAuto],
        ['CA Autres', kpi.caAutres],
        ['Nombre de contrats', kpi.nbContrats],
        ['Contrats Auto/Moto', kpi.nbContratsAuto],
        ['Contrats Autres', kpi.nbContratsAutres],
        ['Ratio', `${kpi.ratio.toFixed(1)}%`],
        ['Nombre de process', kpi.nbProcess],
        ['Commissions potentielles', kpi.commissionsPotentielles],
        ['Commissions réelles', kpi.commissionsReelles],
        ['Statut', kpi.commissionValidee ? 'Validées' : 'En attente'],
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `commissions_${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export CSV réussi");
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      toast.error("Erreur lors de l'export CSV");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-6 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30 dark:from-blue-950/10 dark:via-purple-950/10 dark:to-pink-950/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-md">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exporter vos données
              </h3>
              <p className="text-sm text-muted-foreground">
                Téléchargez un rapport détaillé au format PDF ou CSV
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

