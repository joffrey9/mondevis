"use client";

import { Prisma } from "@prisma/client";
import { getCountry, type Country } from "@/lib/countries";

type FactureWithLines = Prisma.FactureGetPayload<{ include: { lines: true } }>;

export function downloadFacturePDF(
  facture: FactureWithLines,
  companyLogo?: string | null,
  companyName?: string | null,
  companySiret?: string | null,
  companyAddress?: string | null,
  companyEmail?: string | null,
  companyIban?: string | null,
  companyBic?: string | null
) {
  import("jspdf").then(({ default: jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    const countryConfig = getCountry((facture.country || "FR") as Country);

    // — Header bandeau —
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 32, "F");

    // Logo dans le header si présent
    if (companyLogo) {
      try {
        doc.addImage(companyLogo, "PNG", margin + 2, 4, 24, 24);
        doc.setTextColor(226, 176, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text((companyName || "FACTURE"), margin + 30, 16);
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.text("Facture professionnelle", margin + 30, 23);
      } catch {
        // Fallback si l'image est invalide
        doc.setTextColor(226, 176, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(companyName || "FACTURE", margin, 18);
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.text("Facture professionnelle", margin, 25);
      }
    } else {
      doc.setTextColor(226, 176, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("FACTURE", margin, 18);
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text("Document professionnel", margin, 25);
    }
    y = 42;

    // — Infos entreprise (sous le header) —
    if (companyName || companySiret || companyAddress || companyEmail) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      let infoY = y;
      if (companyName) { doc.text(companyName, pageWidth - margin, infoY, { align: "right" } as any); infoY += 4; }
      if (companySiret) { doc.text(`N° TVA : ${companySiret}`, pageWidth - margin, infoY, { align: "right" } as any); infoY += 4; }
      if (companyAddress) { doc.text(companyAddress, pageWidth - margin, infoY, { align: "right" } as any); infoY += 4; }
      if (companyEmail) { doc.text(companyEmail, pageWidth - margin, infoY, { align: "right" } as any); }
      y = infoY + 8;
    }

    // — Title —
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`FACTURE N° ${facture.number}`, margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date d'émission : ${new Date(facture.createdAt).toLocaleDateString("fr-FR")}`, margin, y);
    y += 5;
    if (facture.dueDate) {
      doc.text(`Date d'échéance : ${new Date(facture.dueDate).toLocaleDateString("fr-FR")}`, margin, y);
      y += 5;
    }
    if (facture.profession) {
      doc.text(`Métier : ${facture.profession}`, margin, y);
      y += 5;
    }
    y += 6;

    // — Client section —
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 46);
    doc.text("CLIENT", margin + 2, y + 2);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(44, 44, 44);
    doc.text(`Nom : ${facture.clientName}`, margin, y);
    y += 5;
    if (facture.clientEmail) { doc.text(`Email : ${facture.clientEmail}`, margin, y); y += 5; }
    if (facture.clientPhone) { doc.text(`Tél : ${facture.clientPhone}`, margin, y); y += 5; }
    if (facture.clientAddress) { doc.text(`Adresse : ${facture.clientAddress}`, margin, y); y += 5; }
    doc.text(`Pays : ${countryConfig.label} (${facture.country || "FR"})`, margin, y);
    y += 8;

    // — IBAN/BIC (priorité aux données de la facture, fallback sur le profil) —
    const displayIban = facture.iban || companyIban || "";
    const displayBic = facture.bic || companyBic || "";
    if (displayIban || displayBic) {
      doc.setFillColor(255, 250, 240);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 130, 30);
      doc.text("COORDONNÉES BANCAIRES", margin + 2, y + 2);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      if (displayIban) doc.text(`IBAN : ${displayIban}`, margin, y);
      if (displayBic) { y += 4; doc.text(`BIC : ${displayBic}`, margin, y); }
      y += 10;
    }

    // — Lines table —
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 46);
    doc.text("DÉTAIL DES PRESTATIONS", margin + 2, y + 2);
    y += 14;

    const colX = [margin, margin + 80, margin + 110, margin + 135, margin + 165];
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Description", colX[0], y);
    doc.text("Qté", colX[1], y);
    doc.text("Prix unit.", colX[2], y);
    doc.text("TVA", colX[3], y);
    doc.text("Total HT", colX[4], y);
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(44, 44, 44);
    for (const line of facture.lines) {
      if (y > pageHeight - 40) { doc.addPage(); y = margin; }
      const lineTotal = line.quantity * line.unitPrice;
      doc.text(line.description.substring(0, 40), colX[0], y);
      doc.text(String(line.quantity), colX[1], y);
      doc.text(line.unitPrice.toFixed(2) + " €", colX[2], y, { align: "right" } as any);
      doc.text(line.tvaRate + "%", colX[3], y);
      doc.text(lineTotal.toFixed(2) + " €", colX[4], y, { align: "right" } as any);
      y += 6;
    }

    // — Totaux —
    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total HT : ${facture.totalHt.toFixed(2)} €`, pageWidth - margin, y, { align: "right" } as any);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 46);
    doc.text(`Total TTC : ${facture.totalTtc.toFixed(2)} €`, pageWidth - margin, y, { align: "right" } as any);
    y += 10;

    // — Notes —
    if (facture.notes) {
      if (y > pageHeight - 60) { doc.addPage(); y = margin; }
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 46);
      doc.text("NOTES", margin + 2, y + 2);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const splitNotes = doc.splitTextToSize(facture.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 4 + 8;
    }

    // — Conditions de paiement —
    if (facture.delaiPaiement > 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 46);
      doc.text("CONDITIONS DE PAIEMENT", margin + 2, y + 2);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(44, 44, 44);
      doc.text(`• Délai de paiement : ${facture.delaiPaiement} jours`, margin, y);
      y += 5;
      if (facture.dueDate) {
        doc.text(`• Date d'échéance : ${new Date(facture.dueDate).toLocaleDateString("fr-FR")}`, margin, y);
        y += 5;
      }
      y += 6;
    }

    // — Mentions légales —
    if (y > pageHeight - 50) { doc.addPage(); y = margin; }
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 46);
    doc.text("MENTIONS LÉGALES", margin + 2, y + 2);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    for (const mention of countryConfig.legalMentions) {
      if (y > pageHeight - 20) { doc.addPage(); y = margin; }
      const split = doc.splitTextToSize(`• ${mention}`, pageWidth - margin * 2);
      doc.text(split, margin, y);
      y += split.length * 4 + 1;
    }

    // — Footer —
    doc.setDrawColor(226, 176, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Document généré par MonDevis", margin, pageHeight - 12);

    doc.save(`facture-${facture.number.toLowerCase()}.pdf`);
  });
}
