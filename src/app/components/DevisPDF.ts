"use client";

import { Prisma } from "@prisma/client";
import { getCountry, type Country } from "@/lib/countries";

type DevisWithLines = Prisma.DevisGetPayload<{ include: { lines: true } }>;

export function downloadDevisPDF(
  devis: DevisWithLines,
  signatureData?: string | null,
  companyLogo?: string | null,
  companyName?: string | null
) {
  import("jspdf").then(({ default: jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    const countryConfig = getCountry((devis.country || "FR") as Country);

    // — Header —
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 32, "F");

    if (companyLogo) {
      try {
        doc.addImage(companyLogo, "PNG", margin + 2, 4, 24, 24);
        doc.setTextColor(226, 176, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(companyName || "MONDEVIS", margin + 30, 16);
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.text("Devis professionnel", margin + 30, 23);
      } catch {
        doc.setTextColor(226, 176, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("MONDEVIS", margin, 18);
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.text("Devis professionnel", margin, 25);
      }
    } else {
      doc.setTextColor(226, 176, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("MONDEVIS", margin, 18);
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text("Devis professionnel", margin, 25);
    }
    y = 42;

    // — Title —
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`DEVIS N° ${devis.number}`, margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Date : ${new Date(devis.createdAt).toLocaleDateString("fr-FR")}`,
      margin, y
    );
    if (devis.profession) {
      y += 5;
      doc.text(`Métier : ${devis.profession}`, margin, y);
    }
    y += 8;

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
    doc.text(`Nom : ${devis.clientName}`, margin, y);
    y += 5;
    if (devis.clientEmail) { doc.text(`Email : ${devis.clientEmail}`, margin, y); y += 5; }
    if (devis.clientPhone) { doc.text(`Tél : ${devis.clientPhone}`, margin, y); y += 5; }
    if (devis.clientAddress) { doc.text(`Adresse : ${devis.clientAddress}`, margin, y); y += 5; }
    doc.text(`Pays : ${countryConfig.flag} ${countryConfig.label}`, margin, y);
    y += 10;

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
    for (const line of devis.lines) {
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
    doc.text(`Total HT : ${devis.totalHt.toFixed(2)} €`, pageWidth - margin, y, { align: "right" } as any);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 46);
    doc.text(`Total TTC : ${devis.totalTtc.toFixed(2)} €`, pageWidth - margin, y, { align: "right" } as any);
    y += 10;

    // — Notes / description —
    if (devis.notes) {
      if (y > pageHeight - 60) { doc.addPage(); y = margin; }
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 46);
      doc.text("DESCRIPTION DES TRAVAUX", margin + 2, y + 2);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const splitNotes = doc.splitTextToSize(devis.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 4 + 8;
    }

    // — Payment terms —
    if (devis.acomptePct > 0 || devis.delaiPaiement > 0) {
      const acompteMontant = devis.totalTtc * devis.acomptePct / 100;
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
      doc.text(`• Acompte ${devis.acomptePct}% à la commande : ${acompteMontant.toFixed(2)} € TTC`, margin, y);
      y += 5;
      doc.text(`• Solde à la réception : ${(devis.totalTtc - acompteMontant).toFixed(2)} € TTC`, margin, y);
      y += 5;
      doc.text(`• Délai de paiement : ${devis.delaiPaiement} jours à réception de facture`, margin, y);
      y += 10;
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

    // — Signature —
    if (signatureData) {
      y += 8;
      if (y > pageHeight - 40) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 46);
      doc.text("Signature du client :", margin, y);
      y += 4;
      doc.addImage(signatureData, "PNG", margin, y, 60, 22);
      y += 28;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Bon pour accord — Devis N° ${devis.number}`, margin, y);
    }

    // — Footer —
    doc.setDrawColor(226, 176, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Document généré par MonDevis", margin, pageHeight - 12);

    doc.save(`devis-${devis.number.toLowerCase()}.pdf`);
  });
}
