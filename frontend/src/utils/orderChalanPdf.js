import { jsPDF } from "jspdf";

const COLORS = {
  dark: [29, 29, 29],
  accent: [225, 29, 72],
  cream: [243, 239, 231],
  muted: [130, 130, 130],
  line: [222, 220, 214],
};

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 40;

const money = (value) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
const safeText = (value) => String(value ?? "").replace(/[^\x20-\x7E]/g, "");

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}...` : text;

const formatDate = (value) => {
  if (!value) return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PAYMENT_LABELS = {
  card: "Credit / Debit Card",
  cod: "Cash on Delivery",
};

const DELIVERY_LABELS = {
  standard: "Standard Delivery (3-5 days)",
  express: "Express Delivery (1-2 days)",
  pickup: "Store Pickup",
};

export function downloadOrderChalan(order) {
  if (!order) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const customer = order.customer || {};
  const address = order.address || {};
  const payment = order.payment || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const pageWidth = doc.internal?.pageSize?.getWidth?.() || PAGE.width;
  const pageHeight = doc.internal?.pageSize?.getHeight?.() || PAGE.height;
  const contentWidth = pageWidth - MARGIN * 2;

  const drawHeader = () => {
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 104, "F");
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 104, pageWidth, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text("Coffee Mern", MARGIN, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(205, 205, 205);
    doc.text("Freshly roasted coffee, delivered to your door", MARGIN, 64);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text("INVOICE / CHALAN", pageWidth - MARGIN, 46, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(225, 225, 225);
    doc.text(`#${safeText(order.orderNumber || "")}`, pageWidth - MARGIN, 66, {
      align: "right",
    });
  };

  let y = 132;

  const boxGap = 12;
  const boxWidth = (contentWidth - boxGap * 2) / 3;
  const metaBoxes = [
    ["Order Number", safeText(order.orderNumber || "-")],
    ["Order Date", formatDate(order.createdAt)],
    ["Status", safeText(order.status || "pending").toUpperCase()],
  ];

  metaBoxes.forEach(([label, value], index) => {
    const x = MARGIN + index * (boxWidth + boxGap);
    doc.setFillColor(...COLORS.cream);
    doc.roundedRect(x, y, boxWidth, 54, 8, 8, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(label.toUpperCase(), x + 14, y + 21);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text(truncate(value, 26), x + 14, y + 39);
  });

  y += 54 + 26;

  const columnGap = 14;
  const columnWidth = (contentWidth - columnGap) / 4;
  const leftX = MARGIN;
  const rightX = MARGIN + columnWidth * 2 + columnGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text("Billed To", leftX, y);

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  const customerLines = [
    `${safeText(customer.firstName || "")} ${safeText(customer.lastName || "")}`.trim(),
    safeText(customer.phone || ""),
    safeText(customer.email || ""),
    safeText(address.street || ""),
    safeText(address.detailAddress || ""),
    [
      safeText(address.city || ""),
      safeText(address.state || ""),
      safeText(address.zip || ""),
    ]
      .filter(Boolean)
      .join(", "),
    safeText(address.country || ""),
  ].filter(Boolean);

  doc.setFont("helvetica", "normal");
  customerLines.forEach((line, index) => {
    doc.text(truncate(line, Math.floor(columnWidth * 2 / 4.6)), leftX, y + 18 + index * 15);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text("Payment & Delivery", rightX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const orderLines = [
    ["Payment method", PAYMENT_LABELS[payment.method] || safeText(payment.method || "-")],
    [
      "Card",
      payment.cardLast4
        ? `${safeText(payment.cardBrand || "Card")} **** ${safeText(payment.cardLast4)}`
        : "-",
    ],
    ["Delivery", DELIVERY_LABELS[order.deliveryMethod] || safeText(order.deliveryMethod || "-")],
    ["Total items", String(order.totalQuantity ?? items.length)],
  ];

  orderLines.forEach(([label, value], index) => {
    const lineY = y + 18 + index * 15;
    doc.setTextColor(...COLORS.muted);
    doc.text(label, rightX, lineY);
    doc.setTextColor(...COLORS.dark);
    doc.text(truncate(value, Math.floor(columnWidth * 2 / 4.6)), rightX + 96, lineY);
  });

  y += Math.max(customerLines.length, orderLines.length) * 15 + 30;

  const columns = [
    { label: "#", width: 30, align: "left" },
    { label: "Product", width: 245.28, align: "left" },
    { label: "Price", width: 80, align: "right" },
    { label: "Qty", width: 50, align: "right" },
    { label: "Total", width: 110, align: "right" },
  ];

  const tableStartX = MARGIN;
  const columnX = columns.reduce((acc, column, index) => {
    if (index === 0) return acc.concat(0);
    return acc.concat(acc[index - 1] + columns[index - 1].width);
  }, []);

  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.dark);
    doc.rect(tableStartX, y, contentWidth, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    columns.forEach((column, index) => {
      const x = tableStartX + columnX[index];
      if (column.align === "right") {
        doc.text(column.label.toUpperCase(), x + column.width - 8, y + 18, {
          align: "right",
        });
      } else {
        doc.text(column.label.toUpperCase(), x + 8, y + 18);
      }
    });
    y += 28;
  };

  const tableTop = y;
  drawTableHeader();

  const rowHeight = 26;
  items.forEach((item, index) => {
    if (y + rowHeight > pageHeight - 120) {
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.7);
      doc.line(tableStartX, tableTop, tableStartX + contentWidth, tableTop);
      doc.addPage();
      y = MARGIN;
      drawHeader();
      y = 60;
      drawTableHeader();
    }

    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.cream);
      doc.rect(tableStartX, y, contentWidth, rowHeight, "F");
    }

    const values = [
      String(index + 1),
      truncate(safeText(item.name || ""), 38),
      money(item.price),
      String(item.quantity ?? 0),
      money((Number(item.price) || 0) * (Number(item.quantity) || 0)),
    ];

    doc.setFont("helvetica", index % 2 === 0 ? "normal" : "normal");
    doc.setFontSize(10);
    columns.forEach((column, columnIndex) => {
      const x = tableStartX + columnX[columnIndex];
      doc.setTextColor(...COLORS.dark);
      if (column.align === "right") {
        doc.text(values[columnIndex], x + column.width - 8, y + 17, {
          align: "right",
        });
      } else {
        doc.text(values[columnIndex], x + 8, y + 17);
      }
    });

    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.5);
    doc.line(tableStartX, y + rowHeight, tableStartX + contentWidth, y + rowHeight);

    y += rowHeight;
  });

  y += 18;

  const subtotal =
    Number(order.subtotal) ||
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const shipping = Number(order.shipping) || 0;
  const total = Number(order.total) || subtotal + shipping;

  const totalsWidth = 230;
  const totalsX = tableStartX + contentWidth - totalsWidth;
  const totalRows = [
    ["Subtotal", money(subtotal), false],
    ["Shipping", shipping === 0 ? "Free" : money(shipping), false],
    ["Total", money(total), true],
  ];

  totalRows.forEach(([label, value, isTotal]) => {
    if (isTotal) {
      doc.setFillColor(...COLORS.accent);
      doc.roundedRect(totalsX, y - 8, totalsWidth, 32, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("Total", totalsX + 12, y + 12);
      doc.setFontSize(14);
      doc.text(value, totalsX + totalsWidth - 12, y + 13, { align: "right" });
      y += 32;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.muted);
      doc.text(label, totalsX, y);
      doc.setTextColor(...COLORS.dark);
      doc.text(value, totalsX + totalsWidth, y, { align: "right" });
      y += 18;
    }
  });

  const footerY = pageHeight - 46;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, footerY - 16, pageWidth - MARGIN, footerY - 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text("Thank you for shopping with Coffee Mern!", MARGIN, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "This is a computer generated chalan. Questions? Contact support@coffeemern.com",
    MARGIN,
    footerY + 12
  );

  const fileName = `chalan-${safeText(order.orderNumber || "order")}.pdf`;
  doc.save(fileName);
}
