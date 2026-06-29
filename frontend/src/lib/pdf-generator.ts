import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateBudgetPDF(budget: any, targetElementId: string) {
  const element = document.getElementById(targetElementId);
  if (!element) {
    console.error("Target element not found for PDF generation");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    
    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add Logo (Placeholder - requires base64 or URL)
    pdf.setFontSize(22);
    pdf.setTextColor(40, 40, 40);
    // Since jsPDF text doesn't natively support Arabic shaping without a plugin, 
    // we rely entirely on the html2canvas snapshot for the main content!
    
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

    // Add footer with page numbers
    const pageCount = pdf.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(`Page ${i} of ${pageCount}`, pdfWidth / 2, 290, { align: 'center' });
    }

    pdf.save(`Budget_Report_${budget.id}.pdf`);
  } catch (err) {
    console.error("Error generating PDF:", err);
    throw err;
  }
}
