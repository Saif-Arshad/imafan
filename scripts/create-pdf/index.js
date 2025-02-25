const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");
const moment = require("moment");
const ptp = require("pdf-to-printer2");
const path = require("path");

// Mock Data Simulating an Order
const order = {
  _id: "670fc7f31f351b80a0855169",
  event: {
    _id: "66e54f46ec46e8cd7b965f73",
    name: "dumy 1",
    date: "2024-09-11T00:00:00.000Z",
    location: "sw",
    description: "de",
    createdAt: "2024-09-14T08:54:30.801Z",
    updatedAt: "2024-09-14T08:54:30.801Z",
    __v: 0,
  },
  products: [
    {
      product: {
        _id: "670e62de1cd7865de70445c4",
        phoneModel: "iPhone 16 Pro Max",
        phoneBrand: {
          _id: "670e62dd1cd7865de70445b7",
          name: "Apple",
        },
        quality: {
          _id: "670e62de1cd7865de70445c0",
          name: "Plastic",
        },
        quantity: 0,
      },
      quantity: 1,
      price: 20,
      _id: "670fc7f31f351b80a085516a",
    },
    {
      product: {
        _id: "670e62de1cd7865de70445c8",
        phoneModel: "iPhone 15 Pro Max",
        phoneBrand: {
          _id: "670e62dd1cd7865de70445b7",
          name: "Apple",
        },
        quality: {
          _id: "670e62de1cd7865de70445c0",
          name: "Plastic",
        },
        quantity: 0,
      },
      quantity: 1,
      price: 20,
      _id: "670fc7f31f351b80a085519a",
    },
  ],
  status: "in-process",
  seller: {
    _id: "66d84c19be1646502ab81f47",
    email: "admin@admin.com",
    full_name: "Admin",
    password: "$2b$10$jJg/SkNVy0gVmLHHdW3Jqek/8U67goT/JnKRsrGHBbCToi2pC6knq",
    phone_number: "1234567890",
    type: "admin",
    createdAt: "2024-09-04T12:01:29.985Z",
    updatedAt: "2024-09-04T12:01:29.985Z",
    __v: 0,
  },
  customer: {
    _id: "670fc7f21f351b80a0855166",
    name: "Usman Asif",
    phone: "",
    createdAt: "2024-10-16T14:04:34.932Z",
    updatedAt: "2024-10-16T14:04:34.932Z",
    __v: 0,
  },
  orderDiscount: 0,
  orderDate: "2024-10-16T14:04:35.996Z",
  createdAt: "2024-10-16T14:04:35.998Z",
  updatedAt: "2024-10-16T14:04:35.998Z",
  day_id: "001",
  totalAmount: 20,
  __v: 0,
};

const width = 240; // Receipt width for thermal printers

generateReceipt = async function ({ order }) {
  // Calculate Totals
  const subtotal = order.products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = parseFloat(order.orderDiscount) || 0;
  const total = order.totalAmount;
  const formattedDate = moment(order.orderDate).format(
    "MMMM Do YYYY, h:mm:ss a"
  );

  // Initialize PDF Document
  const doc = new PDFDocument({
    size: [width, 1000], // Receipt width for thermal printers
    margins: { top: 0, left: 10, right: 10, bottom: 20 },
  });

  const tmpFileName = `${Math.random().toString(36).substr(2)}.pdf`;
  const receiptsDir = path.join(__dirname, "../../", "public", "receipts");
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  // const tmpFilePath = path.join(__dirname, "../../", "tmp", tmpFileName); // File path where the PDF is saved
  const tmpFilePath = path.join(__dirname, "../../", "public", "receipts", tmpFileName);
  console.log(tmpFilePath);
  doc.pipe(fs.createWriteStream(tmpFilePath));

  // Add Logo or Company Name
  const logoPath = "./public/images/logo-black.png";
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 20, { width: 130 }).moveDown(6);
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Imafan", { align: "center" })
      .moveDown();
  }

  // Add Date and Time
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Date: ${formattedDate}`, { align: "center" })
    .moveDown();

  // Add Receipt Header
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Sales Receipt", { align: "center" })
    .moveDown(0.5);

  // Add Order ID
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Order ID: ${order.day_id}`, { align: "center" })
    .moveDown();

  // Add Customer Information
  {
    order.customer &&
      order.customer.phone &&
      order.customer.name &&
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Customer: ${order.customer.name}`)
        .text(`Phone: ${order.customer.phone}`)
        .moveDown(1);
  }

  let currentY = doc.y; // Initial vertical position

  // Add Table Headers all on the same line
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Product", 10, currentY, { width: 150, align: "left" });
  doc.text("Qty", 160, currentY, { width: 20, align: "right" });
  doc.text("Total", 190, currentY, { width: 40, align: "right" });

  // Adding a header line with custom styling
  doc
    .save()
    .moveTo(10, currentY + 15) // Slightly below the header text
    .lineTo(width - 10, currentY + 15)
    .stroke("#000000"); // Solid black line
  doc.restore();

  // Move down from the header
  doc.moveDown(1);

  // Loop through each product to add rows to the table
  order.products.forEach((item, i) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const productDetails = ` ${item.product.phoneBrand.name} ${item.product.quality.name} ${item.product.phoneModel}`;
    currentY = doc.y; // Update current Y coordinate to align texts

    doc.fontSize(10).font("Helvetica");
    doc.text(productDetails, 10, currentY, { width: 150, align: "left" });
    doc.text(item.quantity.toString(), 160, currentY, {
      width: 20,
      align: "right",
    });
    doc.text(`$${itemTotal}`, 190, currentY, { width: 40, align: "right" });

    // Not last product
    {
      i !== order.products.length - 1 &&
        // Light gray line after each item
        doc
          .save()
          .moveTo(10, doc.y + 5)
          .lineTo(width - 10, doc.y + 5)
          .stroke("#aaaaaa"); // Light gray line
    }
    doc.restore();

    doc.moveDown(1); // Small gap after each product line
  });

  // Add a final thicker line after the last item
  doc
    .save()
    .moveTo(10, doc.y - 5)
    .lineTo(width - 10, doc.y - 5)
    .lineWidth(1) // Thicker line to emphasize the end of the table
    .stroke("#000000"); // Solid black line for emphasis
  doc.restore();

  // Add Totals and Discount
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Subtotal:", 10, doc.y, { continued: true })
    .text(`$${subtotal.toFixed(2)}`, 0, doc.y, { align: "right" })
    .moveDown(0.3);

  if (discount > 0) {
    doc
      .text("Discount:", 10, doc.y, { continued: true })
      .text(`-$${discount.toFixed(2)}`, 0, doc.y, { align: "right" })
      .moveDown(0.3);
  }

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Total:", 10, doc.y, { continued: true })
    .text(`$${total.toFixed(2)}`, 0, doc.y, { align: "right" })
    .moveDown();

  // Payment Status and QR Code
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Payment Status: PAID", { align: "center" })
    .moveDown();

  // If QR Code generation is needed
  const qrCodeImage = await QRCode.toDataURL(
    "https://imafan.com/active-orders"
  );
  doc.image(qrCodeImage, 240 / 2 - 25, doc.y, { width: 50 }).moveDown(4);

  // Thank You Message and Website
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Thank you for your purchase!", { align: "center" })
    .moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .text(
      ` Use code "SAVE10" for 10% off your next purchase. Visit our website!`,
      { align: "center" }
    )
    .moveDown(0.3);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("www.imafan.it", { align: "center" })
    .moveDown();

  // Finalize and Log
  doc.end();
  console.log(`Receipt PDF generated successfully as ${tmpFileName}`);
  console.log(`Printing ${tmpFileName}`);
  await ptp.print(tmpFilePath, {
    printer: process.env.PRINTER_NAME,
  });
  console.log(`Printed ${tmpFileName}`);
  // Delete the PDF file after printing
  //   fs.unlink(tmpFilePath, (err) => {
  //     if (err) {
  //       console.error(Error deleting file ${tmpFileName}:, err);
  //     } else {
  //       console.log(Successfully deleted ${tmpFileName});
  //     }
  //   });
};

// Call the function to generate the receipt
generateReceipt({ order });
