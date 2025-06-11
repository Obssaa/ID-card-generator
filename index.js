import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import csv from "csv-parser";
import PDFDocument from "pdfkit";
import sharp from "sharp";

const TEMPLATE_PATH = "./assets/ute_id_template.png";
const PHOTO_DIR = "./assets/photos/";
const CSV_PATH = "./data/employees.csv";
const OUTPUT_PDF = "./output/ids.pdf";

const ID_CARD_WIDTH = 336;  // ~3.5 inches at 96 dpi
const ID_CARD_HEIGHT = 210; // ~2.2 inches

async function generateIDCards() {
  const doc = new PDFDocument({ size: [ID_CARD_WIDTH, ID_CARD_HEIGHT] });
  doc.pipe(fs.createWriteStream(OUTPUT_PDF));

  const employees = [];

  await new Promise((resolve) => {
    createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        employees.push(row);
      })
      .on("end", resolve);
  });

  for (let i = 0; i < employees.length; i++) {
    const { name, title, photo } = employees[i];

    if (i !== 0) doc.addPage();

    // Add ID template background
    doc.image(TEMPLATE_PATH, 0, 0, { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT });

    // Add employee photo
    const photoPath = path.join(PHOTO_DIR, photo);
    const resizedPhotoPath = `./tmp/${i}_resized.jpg`;

    await sharp(photoPath)
      .resize(70, 70)
      .toFile(resizedPhotoPath);

    doc.image(resizedPhotoPath, 20, 20);

    // Add text
    doc.fontSize(12).fillColor("black").text(name, 100, 30);
    doc.fontSize(10).fillColor("gray").text(title, 100, 50);

    fs.unlinkSync(resizedPhotoPath); // Clean up
  }

  doc.end();
  console.log("✅ PDF created at:", OUTPUT_PDF);
}

generateIDCards();
