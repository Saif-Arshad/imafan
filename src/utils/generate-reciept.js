// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const QRCode = require("qrcode");
// const moment = require("moment");
// const path = require("path");
// const ptp = require("pdf-to-printer2");
// const { sleep } = require("./sleep");

// // Constants for measurements
// const MM_TO_PT = 72 / 25.4; // 1mm = 2.8346 points
// const RECEIPT_WIDTH_MM = 72; // Fixed width in mm
// const RECEIPT_WIDTH_PT = RECEIPT_WIDTH_MM * MM_TO_PT; // Convert to points

// // Font sizes in points
// const FONT_SIZE_SMALL = 10;
// const FONT_SIZE_MEDIUM = 12;
// const FONT_SIZE_LARGE = 16;

// // Margins in points
// const MARGIN_TOP_PT = 0;
// const MARGIN_LEFT_PT = 10;
// const MARGIN_RIGHT_PT = 10;
// const MARGIN_BOTTOM_PT = 20;

// // Spacing between sections
// const SECTION_SPACING_PT = 5;

// /**
//  * Type guard to check if a variable is of type IProduct.
//  * @param product The product to check.
//  * @returns True if product is IProduct, false otherwise.
//  */
// function isIProduct(product) {
//   return (
//     typeof product === "object" &&
//     product !== null &&
//     "phoneBrand" in product &&
//     "quality" in product &&
//     "phoneModel" in product
//   );
// }

// /**
//  * Calculates the exact height required for the receipt based on content.
//  * @param {Object} order - The order data.
//  * @param {boolean} internal - Flag indicating if it's an internal receipt.
//  * @returns {number} - Total height in points.
//  */
// async function calculateExactHeight(order, internal) {
//   return new Promise((resolve, reject) => {
//     try {
//       // Initialize a temporary PDF document for height calculation
//       const tempDoc = new PDFDocument({
//         size: [RECEIPT_WIDTH_PT, 1000], // Temporary height
//         margins: {
//           top: MARGIN_TOP_PT,
//           left: MARGIN_LEFT_PT,
//           right: MARGIN_RIGHT_PT,
//           bottom: MARGIN_BOTTOM_PT,
//         },
//       });

//       // Set font
//       tempDoc.font("Helvetica");

//       let totalHeight = MARGIN_TOP_PT;

//       // Logo or Company Name
//       const logoPath = path.join(
//         __dirname,
//         "../../public/images/logo-black.png"
//       );
//       if (fs.existsSync(logoPath)) {
//         const logoHeight = 130 * 0.75; // Approximate height in points based on width
//         totalHeight += logoHeight;
//       } else {
//         const text = "Imafan";
//         const options = {
//           width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//           align: "center",
//           font: "Helvetica-Bold",
//           size: FONT_SIZE_LARGE,
//         };
//         const height = tempDoc.heightOfString(text, options);
//         totalHeight += height;
//       }
//       totalHeight += SECTION_SPACING_PT;

//       // Date and Time
//       const formattedDate = moment(order.orderDate).format(
//         "MMMM Do YYYY, h:mm:ss a"
//       );
//       const dateText = `Date: ${formattedDate}`;
//       const dateOptions = {
//         width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//         align: "center",
//         font: "Helvetica",
//         size: FONT_SIZE_SMALL,
//       };
//       const dateHeight = tempDoc.heightOfString(dateText, dateOptions);
//       totalHeight += dateHeight;

//       if (internal) {
//         const internalText = "Internal Copy";
//         const internalHeight = tempDoc.heightOfString(
//           internalText,
//           dateOptions
//         );
//         totalHeight += internalHeight;
//       }

//       totalHeight += SECTION_SPACING_PT * 15;

//       // Receipt Header
//       const headerText = "Sales Receipt";
//       const headerOptions = {
//         width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//         align: "center",
//         font: "Helvetica-Bold",
//         size: FONT_SIZE_LARGE,
//       };
//       const headerHeight = tempDoc.heightOfString(headerText, headerOptions);
//       totalHeight += headerHeight;
//       totalHeight += SECTION_SPACING_PT;

//       // Order ID
//       const orderIdText = `Order ID: ${order.day_id}`;
//       const orderIdOptions = {
//         width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//         align: "center",
//         font: "Helvetica",
//         size: FONT_SIZE_SMALL,
//       };
//       const orderIdHeight = tempDoc.heightOfString(orderIdText, orderIdOptions);
//       totalHeight += orderIdHeight;
//       totalHeight += SECTION_SPACING_PT;

//       // Customer Information
//       if (!internal && order.customer) {
//         if (order.customer.name && order.customer.phone) {
//           const customerNameText = `Customer: ${order.customer.name}`;
//           const customerPhoneText = `Phone: ${order.customer.phone}`;
//           const customerNameHeight = tempDoc.heightOfString(
//             customerNameText,
//             orderIdOptions
//           );
//           const customerPhoneHeight = tempDoc.heightOfString(
//             customerPhoneText,
//             orderIdOptions
//           );
//           totalHeight += customerNameHeight + customerPhoneHeight;
//           totalHeight += SECTION_SPACING_PT;
//         }
//       }

//       // Products Table Header
//       const productsHeaderText = "Product\nQty\nTotal";
//       const productsHeaderOptions = {
//         width: 130,
//         align: "left",
//         font: "Helvetica-Bold",
//         size: FONT_SIZE_SMALL,
//       };
//       const productsHeaderHeight = tempDoc.heightOfString(
//         "Product",
//         productsHeaderOptions
//       );
//       totalHeight += productsHeaderHeight;
//       totalHeight += SECTION_SPACING_PT;

//       // Products
//       order.products.forEach((item) => {
//         let productText = "";
//         if (typeof item.product === "string") {
//           productText = `Product ID: ${item.product}`;
//         } else if (isIProduct(item.product)) {
//           productText = `${item.product.phoneBrand.name} ${item.product.quality.name} ${item.product.phoneModel}`;
//         } else {
//           productText = "Unknown Product";
//         }

//         const productOptions = {
//           width: 130,
//           align: "left",
//           font: "Helvetica",
//           size: FONT_SIZE_SMALL,
//         };
//         const qtyOptions = {
//           width: 20,
//           align: "right",
//           font: "Helvetica",
//           size: FONT_SIZE_SMALL,
//         };
//         const totalOptions = {
//           width: 40,
//           align: "right",
//           font: "Helvetica",
//           size: FONT_SIZE_SMALL,
//         };

//         const productHeight = tempDoc.heightOfString(
//           productText,
//           productOptions
//         );
//         const qtyHeight = tempDoc.heightOfString(
//           item.quantity.toString(),
//           qtyOptions
//         );
//         const totalHeightItem = tempDoc.heightOfString(
//           `$${(item.price * item.quantity).toFixed(2)}`,
//           totalOptions
//         );

//         const maxHeight = Math.max(productHeight, qtyHeight, totalHeightItem);
//         totalHeight += maxHeight;
//         totalHeight += SECTION_SPACING_PT;
//         if (internal) totalHeight += SECTION_SPACING_PT * 15;
//       });

//       // Totals and Discount
//       const subtotal = order.products.reduce(
//         (sum, item) => sum + item.price * item.quantity,
//         0
//       );
//       const subtotalText = `Subtotal: $${subtotal.toFixed(2)}`;
//       const subtotalOptions = {
//         width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//         align: "right",
//         font: "Helvetica-Bold",
//         size: FONT_SIZE_SMALL,
//       };
//       const subtotalHeight = tempDoc.heightOfString(
//         subtotalText,
//         subtotalOptions
//       );
//       totalHeight += subtotalHeight;
//       totalHeight += SECTION_SPACING_PT;

//       const discount = parseFloat(order.orderDiscount) || 0;

//       if (discount > 0) {
//         const discountText = `Discount: -$${discount.toFixed(2)}`;
//         const discountHeight = tempDoc.heightOfString(
//           discountText,
//           subtotalOptions
//         );
//         totalHeight += discountHeight;
//         totalHeight += SECTION_SPACING_PT;
//       }

//       if (!internal) {
//         const total = order.totalAmount;

//         const totalText = `Total: $${total.toFixed(2)}`;
//         const totalOptions = {
//           width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//           align: "right",
//           font: "Helvetica-Bold",
//           size: FONT_SIZE_SMALL,
//         };
//         const totalHeightText = tempDoc.heightOfString(totalText, totalOptions);
//         totalHeight += totalHeightText;
//         totalHeight += SECTION_SPACING_PT;

//         // Payment Status
//         const paymentStatusText = "Payment Status: PAID";
//         const paymentStatusOptions = {
//           width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//           align: "center",
//           font: "Helvetica-Bold",
//           size: FONT_SIZE_SMALL,
//         };
//         const paymentStatusHeight = tempDoc.heightOfString(
//           paymentStatusText,
//           paymentStatusOptions
//         );
//         totalHeight += paymentStatusHeight;
//         totalHeight += SECTION_SPACING_PT;

//         // QR Code
//         const qrCodeHeight = 60; // Fixed height for QR code
//         totalHeight += qrCodeHeight;
//         totalHeight += SECTION_SPACING_PT;

//         // Thank You Message and Website
//         const thankYouText1 = "Thank you for your purchase!";
//         const thankYouText2 = `Use code "SAVE10" for 10% off your next purchase. Visit our website!`;
//         const thankYouText3 = "www.imafan.it";
//         const thankYouOptions1 = {
//           width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//           align: "center",
//           font: "Helvetica",
//           size: FONT_SIZE_SMALL,
//         };
//         const thankYouOptions2 = {
//           width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
//           align: "center",
//           font: "Helvetica-Bold",
//           size: FONT_SIZE_SMALL,
//         };
//         const thankYouHeight1 = tempDoc.heightOfString(
//           thankYouText1,
//           thankYouOptions1
//         );
//         const thankYouHeight2 = tempDoc.heightOfString(
//           thankYouText2,
//           thankYouOptions2
//         );
//         const thankYouHeight3 = tempDoc.heightOfString(
//           thankYouText3,
//           thankYouOptions1
//         );
//         totalHeight += thankYouHeight1 + thankYouHeight2 + thankYouHeight3;
//         totalHeight += SECTION_SPACING_PT;
//       }

//       totalHeight += MARGIN_BOTTOM_PT;

//       resolve(totalHeight);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

// /**
//  * Generates a PDF receipt with exact dynamic height.
//  * @param {Object} params - Object containing order data and internal flag.
//  * @param {IOrder} params.order - The order data.
//  * @param {boolean} [params.internal=false] - Flag indicating if it's an internal receipt.
//  */
// exports.generateReceipt = async function ({
//   order,
//   internal = false,
//   printerName,
// }) {
//   const tmpFileName = `${order._id}-${internal ? "internal" : "customer"}.pdf`;
//   const publicDir = path.join(__dirname, "../../", "public", "receipts");
//   if (!fs.existsSync(publicDir)) {
//     fs.mkdirSync(publicDir, { recursive: true });
//   }
//   const tmpFilePath = path.join(publicDir, tmpFileName);

//   // const tmpFilePath = path.join(__dirname, "../../", "tmp", tmpFileName); // File path where the PDF is saved

//   if (fs.existsSync(tmpFilePath)) {
//     console.log(`Receipt already exists at ${tmpFilePath}`);
//     await print({ tmpFileName, tmpFilePath, printerName });

//     return;
//   }

//   try {
//     // Calculate Totals
//     const subtotal = order.products.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0
//     );
//     const discount = parseFloat(order.orderDiscount) || 0;
//     const total = order.totalAmount;
//     const formattedDate = moment(order.orderDate).format(
//       "MMMM Do YYYY, h:mm:ss a"
//     );

//     // Calculate Exact Height
//     const dynamicHeight = await calculateExactHeight(order, internal);

//     // Initialize PDF Document with Exact Size
//     const doc = new PDFDocument({
//       size: [RECEIPT_WIDTH_PT, dynamicHeight], // Fixed width and dynamic height
//       margins: {
//         top: MARGIN_TOP_PT,
//         left: MARGIN_LEFT_PT,
//         right: MARGIN_RIGHT_PT,
//         bottom: MARGIN_BOTTOM_PT,
//       },
//     });

//     console.log(`Generating receipt at ${tmpFilePath}`);
//     const writeStream = fs.createWriteStream(tmpFilePath);
//     doc.pipe(writeStream);

//     // Add Logo or Company Name
//     const logoPath = path.join(__dirname, "../../public/images/logo-black.png");
//     if (fs.existsSync(logoPath)) {
//       const logoWidth = 130;
//       const logoHeight = 130 * 0.75; // Assuming aspect ratio
//       const logoX = (RECEIPT_WIDTH_PT - logoWidth) / 2;
//       const logoY = 20;
//       doc.image(logoPath, logoX, logoY, { width: logoWidth });
//       doc.moveDown(6); // Adjust based on actual content
//     } else {
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(FONT_SIZE_LARGE)
//         .text("Imafan", {
//           align: "center",
//         })
//         .moveDown();
//     }

//     // Add Date and Time
//     doc
//       .fontSize(FONT_SIZE_SMALL)
//       .font("Helvetica")
//       .text(`Date: ${formattedDate}`, { align: "center" });
//     if (internal) {
//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica")
//         .text(`Internal Copy`, { align: "center" });
//     }
//     doc.moveDown();

//     // Add Receipt Header
//     doc
//       .fontSize(FONT_SIZE_LARGE)
//       .font("Helvetica-Bold")
//       .text("Sales Receipt", { align: "center" });
//     doc.moveDown(0.5);

//     // Add Order ID
//     doc
//       .fontSize(FONT_SIZE_SMALL)
//       .font("Helvetica")
//       .text(`Order ID: ${order.day_id}`, { align: "center" });
//     doc.moveDown();

//     // Add Customer Information if not internal
//     if (!internal && order.customer) {
//       if (order.customer.name && order.customer.phone) {
//         doc
//           .fontSize(FONT_SIZE_SMALL)
//           .font("Helvetica")
//           .text(`Customer: ${order.customer.name}`, { align: "center" })
//           .text(`Phone: ${order.customer.phone}`, { align: "center" });
//         doc.moveDown();
//       }
//     }

//     // Add Products Table Header
//     const tableHeaderY = doc.y;
//     doc
//       .fontSize(FONT_SIZE_SMALL)
//       .font("Helvetica-Bold")
//       .text("Product", 10, tableHeaderY, { width: 120, align: "left" })
//       .text("Qty", 130, tableHeaderY, { width: 20, align: "right" })
//       .text("Total", 160, tableHeaderY, { width: 40, align: "right" });
//     doc.moveDown(0.3);

//     // Draw a line below the header
//     const lineY = doc.y;
//     doc
//       .moveTo(10, lineY)
//       .lineTo(RECEIPT_WIDTH_PT - 10, lineY)
//       .stroke("#000000");
//     doc.moveDown(0.5);

//     // Add Products
//     order.products.forEach((item, i) => {
//       let productText = "";
//       if (typeof item.product === "string") {
//         productText = `Product ID: ${item.product}`;
//       } else if (isIProduct(item.product)) {
//         productText = `${item.product.phoneBrand.name} ${item.product.quality.name} ${item.product.phoneModel}`;
//       } else {
//         productText = "Unknown Product";
//       }

//       const qtyText = item.quantity.toString();
//       const totalText = `$${(item.price * item.quantity).toFixed(2)}`;

//       // Calculate heights
//       const productHeight = doc.heightOfString(productText, {
//         width: 120,
//         align: "left",
//         font: "Helvetica",
//         size: FONT_SIZE_SMALL,
//       });
//       const qtyHeight = doc.heightOfString(qtyText, {
//         width: 20,
//         align: "right",
//         font: "Helvetica",
//         size: FONT_SIZE_SMALL,
//       });
//       const totalHeightText = doc.heightOfString(totalText, {
//         width: 40,
//         align: "right",
//         font: "Helvetica",
//         size: FONT_SIZE_SMALL,
//       });

//       const maxHeight = Math.max(productHeight, qtyHeight, totalHeightText);

//       const currentY = doc.y;

//       // Render text
//       doc
//         .font("Helvetica")
//         .fontSize(FONT_SIZE_SMALL)
//         .text(productText, 10, currentY, { width: 120, align: "left" })
//         .text(qtyText, 130, currentY, { width: 20, align: "right" })
//         .text(totalText, 160, currentY, { width: 40, align: "right" });

//       // // Draw line after each product except the last
//       // if (i !== order.products.length - 1) {
//       //   doc
//       //     .moveTo(10, currentY + maxHeight + 5)
//       //     .lineTo(RECEIPT_WIDTH_PT - 10, currentY + maxHeight + 5)
//       //     .stroke("#aaaaaa");
//       // }

//       doc.moveDown(1); // Adjust spacing based on maxHeight if necessary
//       if (internal) doc.moveDown(15); // Adjust spacing based on maxHeight if necessary
//     });

//     // Draw a final thicker line after the last product
//     doc
//       .moveTo(10, doc.y - 5)
//       .lineTo(RECEIPT_WIDTH_PT - 10, doc.y - 5)
//       .lineWidth(1)
//       .stroke("#000000");
//     doc.moveDown(0.5);

//     doc
//       .fontSize(FONT_SIZE_SMALL)
//       .font("Helvetica-Bold")
//       .text("Subtotal:", 10, doc.y, { continued: true })
//       .text(`$${subtotal.toFixed(2)}`, 0, doc.y, { align: "right" });
//     doc.moveDown(0.3);

//     if (discount > 0) {
//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica-Bold")
//         .text("Discount:", 10, doc.y, { continued: true })
//         .text(`-$${discount.toFixed(2)}`, 0, doc.y, { align: "right" });
//       doc.moveDown(0.3);
//     }

//     if (!internal) {
//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica-Bold")
//         .text("Total:", 10, doc.y, { continued: true })
//         .text(`$${total.toFixed(2)}`, 0, doc.y, { align: "right" });
//       doc.moveDown();

//       // Payment Status
//       const paymentStatusText = "Payment Status: PAID";
//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica-Bold")
//         .text(paymentStatusText, { align: "center" });
//       doc.moveDown();

//       // Add QR Code
//       const qrCodeURL = "https://imafan.com/active-orders";
//       const qrCodeImage = await QRCode.toDataURL(qrCodeURL);
//       const qrCodeBuffer = Buffer.from(qrCodeImage.split(",")[1], "base64");
//       const qrCodeTempPath = path.join(
//         __dirname,
//         "../../tmp",
//         `qr-active-orders.png`
//       );
//       if (!fs.existsSync(qrCodeTempPath))
//         fs.writeFileSync(qrCodeTempPath, qrCodeBuffer);
//       doc.image(qrCodeTempPath, RECEIPT_WIDTH_PT / 2 - 25, doc.y, {
//         width: 50,
//       });
//       doc.moveDown(4);

//       // Thank You Message and Website
//       const thankYouText1 = "Thank you for your purchase!";
//       const thankYouText2 = `Use code "SAVE10" for 10% off your next purchase. Visit our website!`;
//       const thankYouText3 = "www.imafan.it";

//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica")
//         .text(thankYouText1, { align: "center" })
//         .moveDown(0.3);
//       doc
//         .font("Helvetica-Bold")
//         .text(thankYouText2, { align: "center" })
//         .moveDown(0.3);
//       doc
//         .fontSize(FONT_SIZE_SMALL)
//         .font("Helvetica")
//         .text(thankYouText3, { align: "center" })
//         .moveDown();
//     }
//     // Finalize PDF and Clean Up
//     doc.end();
//     await print({ tmpFileName, tmpFilePath, printerName });
//   } catch (error) {
//     console.error("🚀 ~ exports.generateReceipt= ~ error:", error);
//   }
// };

// const print = async ({ tmpFileName, tmpFilePath, printerName }) => {
//   try {

//     console.log(`Receipt PDF generated successfully as ${tmpFilePath}`);
//     console.log(`Printing ${tmpFileName}`);
//     await sleep(500)
//     await ptp.print(tmpFilePath, {
//       printer: printerName,
//       unix: ["-o fit-to-page"],
//     });
//     console.log(`Printed ${tmpFileName}`);

//     console.log(`Receipt PDF generated successfully at ${tmpFilePath}`);
//   }
//   catch (err) {
//     console.error("🚀 ~ exports.print= ~ error:", err);
//   }
// };
const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");
const moment = require("moment");
const path = require("path");
// const ptp = require("pdf-to-printer2");  // Not needed anymore
const { sleep } = require("./sleep");

// Constants for measurements
const MM_TO_PT = 72 / 25.4; // 1mm = 2.8346 points
const RECEIPT_WIDTH_MM = 72; // Fixed width in mm
const RECEIPT_WIDTH_PT = RECEIPT_WIDTH_MM * MM_TO_PT; // Convert to points

// Font sizes in points
const FONT_SIZE_SMALL = 10;
const FONT_SIZE_MEDIUM = 12;
const FONT_SIZE_LARGE = 16;

// Margins in points
const MARGIN_TOP_PT = 0;
const MARGIN_LEFT_PT = 10;
const MARGIN_RIGHT_PT = 10;
const MARGIN_BOTTOM_PT = 20;

// Spacing between sections
const SECTION_SPACING_PT = 5;

/**
 * Type guard to check if a variable is of type IProduct.
 * @param product The product to check.
 * @returns True if product is IProduct, false otherwise.
 */
function isIProduct(product) {
  return (
    typeof product === "object" &&
    product !== null &&
    "phoneBrand" in product &&
    "quality" in product &&
    "phoneModel" in product
  );
}

/**
 * Calculates the exact height required for the receipt based on content.
 * Updated so that we set font and fontSize on the document
 * before each call to heightOfString.
 * @param {Object} order - The order data.
 * @param {boolean} internal - Flag indicating if it's an internal receipt.
 * @returns {number} - Total height in points.
 */
async function calculateExactHeight(order, internal) {
  return new Promise((resolve, reject) => {
    try {
      // Initialize a temporary PDF document for height calculation
      const tempDoc = new PDFDocument({
        size: [RECEIPT_WIDTH_PT, 1000], // Temporary height
        margins: {
          top: MARGIN_TOP_PT,
          left: MARGIN_LEFT_PT,
          right: MARGIN_RIGHT_PT,
          bottom: MARGIN_BOTTOM_PT,
        },
      });

      let totalHeight = MARGIN_TOP_PT;

      // Logo or Company Name
      const logoPath = path.join(__dirname, "../../public/images/logo-black.png");
      if (fs.existsSync(logoPath)) {
        // Approximate logo height
        const logoHeight = 130 * 0.75;
        totalHeight += logoHeight;
      } else {
        tempDoc.font("Helvetica-Bold").fontSize(FONT_SIZE_LARGE);
        const text = "Imafan";
        const height = tempDoc.heightOfString(text, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        totalHeight += height;
      }
      totalHeight += SECTION_SPACING_PT;

      // Date and Time
      tempDoc.font("Helvetica").fontSize(FONT_SIZE_SMALL);
      const formattedDate = moment(order.orderDate).format("MMMM Do YYYY, h:mm:ss a");
      const dateText = `Date: ${formattedDate}`;
      const dateHeight = tempDoc.heightOfString(dateText, {
        width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
        align: "center",
      });
      totalHeight += dateHeight;

      if (internal) {
        const internalText = "Internal Copy";
        const internalHeight = tempDoc.heightOfString(internalText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        totalHeight += internalHeight;
      }

      totalHeight += SECTION_SPACING_PT * 15;

      // Receipt Header
      tempDoc.font("Helvetica-Bold").fontSize(FONT_SIZE_LARGE);
      const headerText = "Sales Receipt";
      const headerHeight = tempDoc.heightOfString(headerText, {
        width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
        align: "center",
      });
      totalHeight += headerHeight;
      totalHeight += SECTION_SPACING_PT;

      // Order ID
      tempDoc.font("Helvetica").fontSize(FONT_SIZE_SMALL);
      const orderIdText = `Order ID: ${order.day_id}`;
      const orderIdHeight = tempDoc.heightOfString(orderIdText, {
        width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
        align: "center",
      });
      totalHeight += orderIdHeight;
      totalHeight += SECTION_SPACING_PT;

      // Customer Information (if not internal)
      if (!internal && order.customer && order.customer.name && order.customer.phone) {
        const customerNameText = `Customer: ${order.customer.name}`;
        const customerPhoneText = `Phone: ${order.customer.phone}`;
        const customerNameHeight = tempDoc.heightOfString(customerNameText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        const customerPhoneHeight = tempDoc.heightOfString(customerPhoneText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        totalHeight += customerNameHeight + customerPhoneHeight;
        totalHeight += SECTION_SPACING_PT;
      }

      // Products Table Header
      tempDoc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL);
      const productHeaderHeight = tempDoc.heightOfString("Product", {
        width: 130,
        align: "left",
      });
      totalHeight += productHeaderHeight;
      totalHeight += SECTION_SPACING_PT;

      // Products
      order.products.forEach((item) => {
        let productText = "";
        if (typeof item.product === "string") {
          productText = `Product ID: ${item.product}`;
        } else if (isIProduct(item.product)) {
          productText = `${item.product.phoneBrand.name} ${item.product.quality.name} ${item.product.phoneModel}`;
        } else {
          productText = "Unknown Product";
        }
        tempDoc.font("Helvetica").fontSize(FONT_SIZE_SMALL);
        const productHeight = tempDoc.heightOfString(productText, {
          width: 130,
          align: "left",
        });
        const qtyHeight = tempDoc.heightOfString(item.quantity.toString(), {
          width: 20,
          align: "right",
        });
        const totalHeightItem = tempDoc.heightOfString(`$${(item.price * item.quantity).toFixed(2)}`, {
          width: 40,
          align: "right",
        });
        const maxHeight = Math.max(productHeight, qtyHeight, totalHeightItem);
        totalHeight += maxHeight;
        totalHeight += SECTION_SPACING_PT;
        if (internal) totalHeight += SECTION_SPACING_PT * 15;
      });

      // Totals and Discount
      tempDoc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL);
      const subtotalText = `Subtotal: $${order.products
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2)}`;
      const subtotalHeight = tempDoc.heightOfString(subtotalText, {
        width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
        align: "right",
      });
      totalHeight += subtotalHeight;
      totalHeight += SECTION_SPACING_PT;

      const discount = parseFloat(order.orderDiscount) || 0;
      if (discount > 0) {
        const discountText = `Discount: -$${discount.toFixed(2)}`;
        const discountHeight = tempDoc.heightOfString(discountText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "right",
        });
        totalHeight += discountHeight;
        totalHeight += SECTION_SPACING_PT;
      }

      if (!internal) {
        const totalText = `Total: $${order.totalAmount.toFixed(2)}`;
        const totalTextHeight = tempDoc.heightOfString(totalText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "right",
        });
        totalHeight += totalTextHeight;
        totalHeight += SECTION_SPACING_PT;

        const paymentStatusText = "Payment Status: PAID";
        const paymentStatusHeight = tempDoc.heightOfString(paymentStatusText, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        totalHeight += paymentStatusHeight;
        totalHeight += SECTION_SPACING_PT;

        // QR Code fixed height
        const qrCodeHeight = 60;
        totalHeight += qrCodeHeight;
        totalHeight += SECTION_SPACING_PT;

        // Thank You Message and Website
        tempDoc.font("Helvetica").fontSize(FONT_SIZE_SMALL);
        const thankYouText1 = "Thank you for your purchase!";
        const thankYouText2 = `Use code "SAVE10" for 10% off your next purchase. Visit our website!`;
        const thankYouText3 = "www.imafan.it";
        const thankYouHeight1 = tempDoc.heightOfString(thankYouText1, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        const thankYouHeight2 = tempDoc.heightOfString(thankYouText2, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        const thankYouHeight3 = tempDoc.heightOfString(thankYouText3, {
          width: RECEIPT_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT,
          align: "center",
        });
        totalHeight += thankYouHeight1 + thankYouHeight2 + thankYouHeight3;
        totalHeight += SECTION_SPACING_PT;
      }

      totalHeight += MARGIN_BOTTOM_PT;
      resolve(totalHeight);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a PDF receipt with exact dynamic height and returns its public URL.
 * @param {Object} params - Object containing order data and internal flag.
 * @param {IOrder} params.order - The order data.
 * @param {boolean} [params.internal=false] - Flag indicating if it's an internal receipt.
 * @returns {string} - Public URL to the generated PDF.
 */
exports.generateReceipt = async function ({ order, internal = false }) {
  const isVercel = process.env.VERCEL ;
  const tmpFileName = `${order._id}-${internal ? "internal" : "customer"}.pdf`;
  const publicDir = path.join(__dirname, "../../", "public", "receipts");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const tmpFilePath = path.join(publicDir, tmpFileName);

  // If the receipt already exists, return its URL immediately
  if (fs.existsSync(tmpFilePath)) {
    const baseUrl = process.env.BASE_URL || "http://localhost:3344";
    return `${baseUrl}/public/receipts/${tmpFileName}`;
  }

  try {
    // Calculate Totals and Formatting
    const subtotal = order.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = parseFloat(order.orderDiscount) || 0;
    const total = order.totalAmount;
    const formattedDate = moment(order.orderDate).format("MMMM Do YYYY, h:mm:ss a");

    // Calculate Dynamic Height
    const dynamicHeight = await calculateExactHeight(order, internal);

    // Initialize PDF Document with Exact Size
    const doc = new PDFDocument({
      size: [RECEIPT_WIDTH_PT, dynamicHeight],
      margins: {
        top: MARGIN_TOP_PT,
        left: MARGIN_LEFT_PT,
        right: MARGIN_RIGHT_PT,
        bottom: MARGIN_BOTTOM_PT,
      },
    });

    console.log(`Generating receipt at ${tmpFilePath}`);
    const writeStream = fs.createWriteStream(tmpFilePath);
    doc.pipe(writeStream);

    // --- Add PDF Content (Logo, Date, Order Details, etc.) ---

    // Logo or Company Name
    const logoPath = path.join(__dirname, "../../public/images/logo-black.png");
    if (fs.existsSync(logoPath)) {
      const logoWidth = 130;
      const logoX = (RECEIPT_WIDTH_PT - logoWidth) / 2;
      const logoY = 20;
      doc.image(logoPath, logoX, logoY, { width: logoWidth });
      doc.moveDown(6);
    } else {
      doc.font("Helvetica-Bold")
        .fontSize(FONT_SIZE_LARGE)
        .text("Imafan", { align: "center" })
        .moveDown();
    }

    doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
      .text(`Date: ${formattedDate}`, { align: "center" });
    if (internal) {
      doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
        .text("Internal Copy", { align: "center" });
    }
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_LARGE)
      .text("Sales Receipt", { align: "center" });
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
      .text(`Order ID: ${order.day_id}`, { align: "center" });
    doc.moveDown();

    if (!internal && order.customer && order.customer.name && order.customer.phone) {
      doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
        .text(`Customer: ${order.customer.name}`, { align: "center" })
        .text(`Phone: ${order.customer.phone}`, { align: "center" });
      doc.moveDown();
    }

    // Products Table Header
    const tableHeaderY = doc.y;
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
      .text("Product", 10, tableHeaderY, { width: 120, align: "left" })
      .text("Qty", 130, tableHeaderY, { width: 20, align: "right" })
      .text("Total", 160, tableHeaderY, { width: 40, align: "right" });
    doc.moveDown(0.3);

    // Draw a line below the header
    const lineY = doc.y;
    doc.moveTo(10, lineY)
      .lineTo(RECEIPT_WIDTH_PT - 10, lineY)
      .stroke("#000000");
    doc.moveDown(0.5);

    // Products
    order.products.forEach((item) => {
      let productText = "";
      if (typeof item.product === "string") {
        productText = `Product ID: ${item.product}`;
      } else if (isIProduct(item.product)) {
        productText = `${item.product.phoneBrand.name} ${item.product.quality.name} ${item.product.phoneModel}`;
      } else {
        productText = "Unknown Product";
      }
      const qtyText = item.quantity.toString();
      const totalText = `$${(item.price * item.quantity).toFixed(2)}`;

      const currentY = doc.y;
      doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
        .text(productText, 10, currentY, { width: 120, align: "left" })
        .text(qtyText, 130, currentY, { width: 20, align: "right" })
        .text(totalText, 160, currentY, { width: 40, align: "right" });
      doc.moveDown(1);
    });

    // Final Totals, Discounts, Payment Status, QR Code, Thank You Message, etc.
    doc.moveTo(10, doc.y - 5)
      .lineTo(RECEIPT_WIDTH_PT - 10, doc.y - 5)
      .lineWidth(1)
      .stroke("#000000");
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
      .text("Subtotal:", 10, doc.y, { continued: true })
      .text(`$${subtotal.toFixed(2)}`, 0, doc.y, { align: "right" });
    doc.moveDown(0.3);

    if (discount > 0) {
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
        .text("Discount:", 10, doc.y, { continued: true })
        .text(`-$${discount.toFixed(2)}`, 0, doc.y, { align: "right" });
      doc.moveDown(0.3);
    }

    if (!internal) {
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
        .text("Total:", 10, doc.y, { continued: true })
        .text(`$${total.toFixed(2)}`, 0, doc.y, { align: "right" });
      doc.moveDown();

      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
        .text("Payment Status: PAID", { align: "center" });
      doc.moveDown();

      // QR Code
      const qrCodeURL = "https://imafan.com/active-orders";
      const qrCodeImage = await QRCode.toDataURL(qrCodeURL);
      const qrCodeBuffer = Buffer.from(qrCodeImage.split(",")[1], "base64");

      // Ensure the tmp directory exists before writing
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const qrCodeTempPath = path.join(tmpDir, "qr-active-orders.png");
      if (!fs.existsSync(qrCodeTempPath)) {
        fs.writeFileSync(qrCodeTempPath, qrCodeBuffer);
      }
      doc.image(qrCodeTempPath, RECEIPT_WIDTH_PT / 2 - 25, doc.y, { width: 50 });
      doc.moveDown(4);

      // Thank You Message and Website
      const thankYouText1 = "Thank you for your purchase!";
      const thankYouText2 = `Use code "SAVE10" for 10% off your next purchase. Visit our website!`;
      const thankYouText3 = "www.imafan.it";
      doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
        .text(thankYouText1, { align: "center" })
        .moveDown(0.3);
      doc.font("Helvetica-Bold")
        .text(thankYouText2, { align: "center" })
        .moveDown(0.3);
      doc.font("Helvetica").fontSize(FONT_SIZE_SMALL)
        .text(thankYouText3, { align: "center" })
        .moveDown();
    }
    // --- End PDF Content ---

    // Finalize the PDF
    doc.end();

    // Wait for the file to finish writing
    await new Promise((resolve) => writeStream.on("finish", resolve));

    // Build and return the public URL
    const baseUrl = process.env.BASE_URL || "http://localhost:3344";
    const receiptUrl = `${baseUrl}/public/receipts/${tmpFileName}`;
    console.log(`Receipt available at: ${receiptUrl}`);
    return receiptUrl;
  } catch (error) {
    console.error("Error generating receipt:", error);
    throw error;
  }
};
