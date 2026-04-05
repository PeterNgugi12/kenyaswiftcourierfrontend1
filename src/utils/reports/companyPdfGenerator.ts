import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ReportData {
  stats: {
    parcelsThisMonth: number;
    revenueThisMonth: string;
    smsThisMonth: number;
    growth: string;
  };
  chartData: Array<{
    month: string;
    parcels: number;
    revenue: number;
    sms: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export const generateCompanyPDF = async (data: ReportData): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Color System
  const colors = {
    primary: { r: 10, g: 38, b: 71 }, // #0A2647 - Deep navy
    secondary: { r: 249, g: 115, b: 22 }, // #F97316 - Orange
    accent: { r: 16, g: 185, b: 129 }, // #10B981 - Emerald
    purple: { r: 139, g: 92, b: 246 }, // #8B5CF6 - Purple
    success: { r: 16, g: 185, b: 129 }, // #10B981 - Green
    warning: { r: 245, g: 158, b: 11 }, // #F59E0B - Amber
    danger: { r: 239, g: 68, b: 68 }, // #EF4444 - Red
    
    // Grays
    gray: {
      50: { r: 249, g: 250, b: 251 },
      100: { r: 243, g: 244, b: 246 }, // #F3F4F6 - Light gray
      200: { r: 229, g: 231, b: 235 },
      300: { r: 209, g: 213, b: 219 },
      400: { r: 156, g: 163, b: 175 },
      500: { r: 107, g: 114, b: 128 }, // #6B7280 - Medium gray
      600: { r: 75, g: 85, b: 99 }, // #4B5563 - Dark gray
      700: { r: 55, g: 65, b: 81 },
      800: { r: 31, g: 41, b: 55 },
      900: { r: 17, g: 24, b: 39 },
    },
    
    // Backgrounds
    background: {
      white: { r: 255, g: 255, b: 255 },
      light: { r: 249, g: 250, b: 251 },
      card: { r: 255, g: 255, b: 255 },
    },
    
    // Text
    text: {
      primary: { r: 17, g: 24, b: 39 }, // #111827 - Near black
      secondary: { r: 75, g: 85, b: 99 }, // #4B5563 - Dark gray
      muted: { r: 107, g: 114, b: 128 }, // #6B7280 - Medium gray
      light: { r: 255, g: 255, b: 255 }, // White
    },
    
    // Borders
    border: {
      light: { r: 229, g: 231, b: 235 }, // #E5E7EB
      default: { r: 209, g: 213, b: 219 }, // #D1D5DB
    }
  };

  // Helper function to set RGB color
  const setTextColor = (color: { r: number; g: number; b: number }) => {
    doc.setTextColor(color.r, color.g, color.b);
  };

  const setFillColor = (color: { r: number; g: number; b: number }) => {
    doc.setFillColor(color.r, color.g, color.b);
  };

  const setDrawColor = (color: { r: number; g: number; b: number }) => {
    doc.setDrawColor(color.r, color.g, color.b);
  };

  // Helper function to draw a circle (for icons)
  const drawCircle = (x: number, y: number, radius: number, color: { r: number; g: number; b: number }) => {
    setFillColor(color);
    doc.circle(x, y, radius, "F");
  };

  // Helper function to add header to each page
  const addHeader = (pageNum: number) => {
    // Top decorative bar
    setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, 8, "F");

    // Company name and report title
    doc.setFontSize(20);
    setTextColor(colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Company Performance Report", margin, 25);

    doc.setFontSize(10);
    setTextColor(colors.text.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "MMMM dd, yyyy")}`, margin, 32);

    // Page number
    doc.setFontSize(9);
    setTextColor(colors.text.secondary);
    doc.text(`Page ${pageNum}`, pageWidth - margin - 10, 32);
  };

  // Helper function to add footer to each page
  const addFooter = (pageNum: number) => {
    const footerY = pageHeight - 10;
    
    setDrawColor(colors.gray[200]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFontSize(8);
    setTextColor(colors.text.secondary);
    doc.text(
      "© 2026 Your Company Name - Confidential",
      margin,
      footerY
    );
  };

  let pageNum = 1;
  addHeader(pageNum);
  
  // Executive Summary Section
  let yPos = 45;
  
  // Summary card background
  setFillColor(colors.gray[100]);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, "F");
  
  doc.setFontSize(12);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin + 5, yPos + 8);

  doc.setFontSize(9);
  setTextColor(colors.text.secondary);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Performance overview for the selected period",
    margin + 5,
    yPos + 15
  );

  yPos += 45;

  // Key Metrics in Cards - Without emojis
  const cardWidth = (contentWidth - 30) / 4;
  
  const metrics = [
    { 
      label: "Parcels", 
      value: data.stats.parcelsThisMonth.toString(),
      icon: "📦", // This might still show as character, let's use text labels instead
      color: colors.primary
    },
    { 
      label: "Revenue", 
      value: data.stats.revenueThisMonth,
      icon: "💰",
      color: colors.secondary
    },
    { 
      label: "SMS Sent", 
      value: data.stats.smsThisMonth.toString(),
      icon: "📱",
      color: colors.accent
    },
    { 
      label: "Growth", 
      value: data.stats.growth,
      icon: "📈",
      color: colors.purple
    }
  ];

  metrics.forEach((metric, index) => {
    const xPos = margin + (index * (cardWidth + 10));
    
    // Card background
    setFillColor(colors.background.white);
    setDrawColor(colors.gray[200]);
    doc.roundedRect(xPos, yPos, cardWidth, 30, 3, 3, "FD");

    // Simple shape instead of emoji
    setFillColor(metric.color);
    doc.circle(xPos + 8, yPos + 10, 3, "F");

    // Value
    doc.setFontSize(14);
    setTextColor(metric.color);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, xPos + 15, yPos + 12);

    // Label
    doc.setFontSize(8);
    setTextColor(colors.text.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, xPos + 15, yPos + 20);
  });

  yPos += 45;

  // Monthly Breakdown Title
  doc.setFontSize(14);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Monthly Performance Breakdown", margin, yPos);

  yPos += 10;

  // Monthly Data Table
  const tableData = data.chartData.map(item => [
    item.month,
    item.parcels.toString(),
    item.revenue.toString().startsWith('KES') ? item.revenue : `KES ${item.revenue.toLocaleString()}`,
    item.sms.toString()
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Month", "Parcels", "Revenue (KES)", "SMS Sent"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: [colors.gray[200].r, colors.gray[200].g, colors.gray[200].b],
      lineWidth: 0.1,
      textColor: [colors.text.primary.r, colors.text.primary.g, colors.text.primary.b],
    },
    headStyles: {
      fillColor: [colors.primary.r, colors.primary.g, colors.primary.b],
      textColor: [colors.text.light.r, colors.text.light.g, colors.text.light.b],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { halign: "right", cellWidth: 35 },
      2: { halign: "right", cellWidth: 45 },
      3: { halign: "right", cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [colors.gray[50].r, colors.gray[50].g, colors.gray[50].b],
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore - autoTable adds lastAutoTable
  yPos = doc.lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > pageHeight - 50) {
    doc.addPage();
    pageNum++;
    addHeader(pageNum);
    yPos = 45;
  }

  // Performance Insights
  doc.setFontSize(14);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Insights", margin, yPos);

  yPos += 10;

  // Calculate averages and best month
  const avgParcels = Math.round(
    data.chartData.reduce((sum, item) => sum + item.parcels, 0) / 
    data.chartData.length
  );
  
  const avgRevenue = Math.round(
    data.chartData.reduce((sum, item) => sum + item.revenue, 0) / 
    data.chartData.length
  );
  
  const bestMonth = data.chartData.reduce(
    (max, item) => item.parcels > max.parcels ? item : max, 
    data.chartData[0]
  );

  const insights = [
    {
      title: "Average Monthly Parcels",
      value: avgParcels.toLocaleString(),
      change: "+12% vs last period",
      color: colors.primary
    },
    {
      title: "Average Monthly Revenue",
      value: `KES ${avgRevenue.toLocaleString()}`,
      change: "+8% vs last period",
      color: colors.secondary
    },
    {
      title: "Best Performing Month",
      value: bestMonth?.month || "N/A",
      change: `${bestMonth?.parcels || 0} parcels delivered`,
      color: colors.accent
    },
  ];

  const insightCardWidth = (contentWidth - 20) / 3;

  insights.forEach((insight, index) => {
    const xPos = margin + (index * (insightCardWidth + 10));
    
    // Card
    setFillColor(colors.background.white);
    setDrawColor(colors.primary);
    doc.setLineWidth(0.2);
    doc.roundedRect(xPos, yPos, insightCardWidth, 35, 3, 3, "FD");

    // Accent line at top
    setFillColor(insight.color);
    doc.rect(xPos, yPos, insightCardWidth, 2, "F");

    // Simple indicator dot
    setFillColor(insight.color);
    doc.circle(xPos + 8, yPos + 15, 2, "F");

    // Title
    doc.setFontSize(8);
    setTextColor(colors.text.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(insight.title, xPos + 15, yPos + 12);

    // Value
    doc.setFontSize(12);
    setTextColor(insight.color);
    doc.setFont("helvetica", "bold");
    doc.text(insight.value, xPos + 15, yPos + 22);

    // Change indicator
    doc.setFontSize(7);
    setTextColor(colors.success);
    doc.setFont("helvetica", "normal");
    doc.text(insight.change, xPos + 15, yPos + 28);
  });

  yPos += 50;

  // Add footer to first page
  addFooter(pageNum);

  // Visual Analytics Section - New Page
  doc.addPage();
  pageNum++;
  addHeader(pageNum);
  yPos = 45;

  doc.setFontSize(14);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Visual Analytics", margin, yPos);

  yPos += 15;

  // Chart cards
  const chartCardWidth = (contentWidth - 10) / 2;

  // Parcels Chart Card
  setFillColor(colors.background.white);
  setDrawColor(colors.gray[200]);
  doc.roundedRect(margin, yPos, chartCardWidth, 80, 3, 3, "FD");

  doc.setFontSize(10);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Monthly Parcels Trend", margin + 5, yPos + 10);

  // Bar chart
  const maxParcels = Math.max(...data.chartData.map(d => d.parcels));
  const barWidth = (chartCardWidth - 30) / data.chartData.length;
  
  data.chartData.forEach((item, index) => {
    const barHeight = maxParcels > 0 ? (item.parcels / maxParcels) * 40 : 0;
    const barX = margin + 15 + (index * (barWidth + 2));
    const barY = yPos + 65 - barHeight;
    
    setFillColor(colors.primary);
    doc.roundedRect(barX, barY, barWidth - 2, barHeight, 1, 1, "F");
    
    // Month label
    doc.setFontSize(7);
    setTextColor(colors.text.secondary);
    doc.text(item.month.split(' ')[0], barX, yPos + 72);
  });

  // Revenue Chart Card
  setFillColor(colors.background.white);
  setDrawColor(colors.gray[200]);
  doc.roundedRect(margin + chartCardWidth + 10, yPos, chartCardWidth, 80, 3, 3, "FD");

  doc.setFontSize(10);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Revenue Trend", margin + chartCardWidth + 15, yPos + 10);

  // Line chart
  const maxRevenue = Math.max(...data.chartData.map(d => d.revenue));
  
  if (data.chartData.length > 1) {
    const points = data.chartData.map((item, index) => {
      const x = margin + chartCardWidth + 15 + (index * ((chartCardWidth - 20) / (data.chartData.length - 1)));
      const y = yPos + 55 - (maxRevenue > 0 ? (item.revenue / maxRevenue) * 30 : 0);
      return { x, y, month: item.month, value: item.revenue };
    });

    // Draw line
    setDrawColor(colors.secondary);
    doc.setLineWidth(1.5);
    points.forEach((point, index) => {
      if (index > 0) {
        doc.line(points[index - 1].x, points[index - 1].y, point.x, point.y);
      }
    });

    // Draw points
    points.forEach(point => {
      setFillColor(colors.secondary);
      doc.circle(point.x, point.y, 1.5, "F");
    });

    // Month labels
    doc.setFontSize(7);
    setTextColor(colors.text.secondary);
    points.forEach((point, index) => {
      doc.text(data.chartData[index].month.split(' ')[0], point.x - 3, yPos + 72);
    });
  }

  yPos += 95;

  // Summary Statistics
  doc.setFontSize(12);
  setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", margin, yPos);

  yPos += 8;

  const summaryStats = [
    { label: "Total Parcels", value: data.chartData.reduce((sum, item) => sum + item.parcels, 0).toLocaleString() },
    { label: "Total Revenue", value: `KES ${data.chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}` },
    { label: "Total SMS", value: data.chartData.reduce((sum, item) => sum + item.sms, 0).toLocaleString() },
    { label: "Avg Revenue/Parcel", value: `KES ${Math.round(data.chartData.reduce((sum, item) => sum + item.revenue, 0) / data.chartData.reduce((sum, item) => sum + item.parcels, 0)).toLocaleString()}` },
  ];

  const statWidth = contentWidth / 4;
  summaryStats.forEach((stat, index) => {
    const xPos = margin + (index * statWidth);
    
    doc.setFontSize(9);
    setTextColor(colors.text.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos, yPos);

    doc.setFontSize(11);
    setTextColor(colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, xPos, yPos + 7);
  });

  // Add footer to last page
  addFooter(pageNum);

  return doc;
};