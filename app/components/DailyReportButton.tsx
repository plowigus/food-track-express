"use client";

import { useState } from "react";
import { generateDailyReportText } from "@/app/actions/reports";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";

// Helper to remove polish characters because standard jsPDF fonts only support ASCII
const removePolishChars = (str: string) => {
    return str
        .replace(/ą/g, 'a').replace(/Ą/g, 'A')
        .replace(/ć/g, 'c').replace(/Ć/g, 'C')
        .replace(/ę/g, 'e').replace(/Ę/g, 'E')
        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
        .replace(/ń/g, 'n').replace(/Ń/g, 'N')
        .replace(/ó/g, 'o').replace(/Ó/g, 'O')
        .replace(/ś/g, 's').replace(/Ś/g, 'S')
        .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
        .replace(/ż/g, 'z').replace(/Ż/g, 'Z');
};

export function DailyReportButton() {
    const [isPending, setIsPending] = useState(false);
    const [reportData, setReportData] = useState<{ date: string; revenuePln: string; orderCount: number; items: { name: string; qty: number }[] } | null>(null);

    const handleGenerateReport = async () => {
        setIsPending(true);
        try {
            const result = await generateDailyReportText();

            if (!result.success || !result.reportData) {
                alert(result.error || "Nie udało się wygenerować raportu.");
                setIsPending(false);
                return;
            }

            // We do not need DOM anymore with native jsPDF
            const doc = new jsPDF({ format: 'a4', unit: 'mm' });

            // Define layout
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;
            const margin = 20;

            // Header Layer
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("CHEMIK BURGER", margin, yPos);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            yPos += 6;
            doc.text("Raport Zamkniecia Dnia", margin, yPos);

            // Date on the right
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`Data: ${result.reportData.date}`, pageWidth - margin, yPos, { align: 'right' });

            yPos += 10;
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            // Summary Blocks
            yPos += 10;
            const boxWidth = (pageWidth - margin * 2 - 10) / 2;

            // Box 1 (Revenue)
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(margin, yPos, boxWidth, 25, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("UTARG CALKOWITY", margin + boxWidth / 2, yPos + 8, { align: 'center' });
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`${result.reportData.revenuePln} PLN`, margin + boxWidth / 2, yPos + 18, { align: 'center' });

            // Box 2 (Count)
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(margin + boxWidth + 10, yPos, boxWidth, 25, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("LICZBA ZAMOWIEN", margin + boxWidth + 10 + boxWidth / 2, yPos + 8, { align: 'center' });
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`${result.reportData.orderCount}`, margin + boxWidth + 10 + boxWidth / 2, yPos + 18, { align: 'center' });

            // Table Header
            yPos += 40;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("ZESTAWIENIE SPRZEDAZY", margin, yPos);

            yPos += 4;
            doc.setLineWidth(0.2);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.text("PRODUKT", margin, yPos);
            doc.text("ILOSC", pageWidth - margin, yPos, { align: 'right' });

            yPos += 2;
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            // Table Rows
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

            if (result.reportData.items.length === 0) {
                yPos += 10;
                doc.setTextColor(100, 100, 100);
                doc.text("Brak sprzedanych produktow.", margin, yPos);
            } else {
                result.reportData.items.forEach((item: { name: string; qty: number }) => {
                    yPos += 8;
                    // Check page break
                    if (yPos > doc.internal.pageSize.getHeight() - 20) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(removePolishChars(item.name), margin, yPos);
                    doc.setFont("helvetica", "bold");
                    doc.text(`${item.qty} szt.`, pageWidth - margin, yPos, { align: 'right' });
                    doc.setFont("helvetica", "normal");

                    yPos += 2;
                    doc.setDrawColor(230, 230, 230);
                    doc.setLineWidth(0.1);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                });
            }

            // Footer
            yPos += 20;
            if (yPos > doc.internal.pageSize.getHeight() - 10) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Wygenerowano z systemu na zywo -- Chemik Burger", pageWidth / 2, yPos, { align: 'center' });

            // Output blob
            const pdfBlob = doc.output('blob');
            const fileName = `Raport_ChemikBurger_${result.reportData.date}.pdf`;

            // Force browser download regardless of device capability.
            // On mobile Safari/Chrome, this will open a "Do you want to download?" prompt or open the PDF viewer.
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error("Report generation error full:", error);
            // Ignore AbortError if the user cancels the share
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            alert("Blad generowania PDF.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            <button
                onClick={handleGenerateReport}
                disabled={isPending}
                className="rounded-full bg-blue-600/20 border border-blue-500/40 px-4 py-2 text-sm font-bold tracking-wide text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                title="Pobierz Raport Zamknięcia Dnia jako PDF"
            >
                {isPending ? (
                    <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <FileText className="w-4 h-4" />
                )}
                <span>Pobierz PDF: Zamknięcie Dnia</span>
            </button>

        </>
    );
}
