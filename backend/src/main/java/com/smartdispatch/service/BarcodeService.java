package com.smartdispatch.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;

/**
 * Generates barcodes and QR codes for dispatch labels.
 *
 * Barcode: Code128 — encodes order number (ORD-2024-8821)
 * QR Code: encodes tracking URL (https://yoursite.com/tracking/ORD-2024-8821)
 */
@Service
public class BarcodeService {

    private static final String TRACKING_BASE_URL = "http://localhost:3000/tracking/";

    /**
     * Generate a Code128 barcode image for an order number.
     * Returns PNG bytes.
     */
    public byte[] generateBarcode(String orderNumber, int width, int height) throws WriterException, IOException {
        Code128Writer writer = new Code128Writer();
        BitMatrix matrix = writer.encode(orderNumber, BarcodeFormat.CODE_128, width, height);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", out);
        return out.toByteArray();
    }

    /**
     * Generate a QR code that encodes the tracking URL.
     * Returns PNG bytes.
     */
    public byte[] generateQrCode(String orderNumber, int size) throws WriterException, IOException {
        String trackingUrl = TRACKING_BASE_URL + orderNumber;
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(trackingUrl, BarcodeFormat.QR_CODE, size, size,
                Map.of(EncodeHintType.MARGIN, 1));
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", out);
        return out.toByteArray();
    }

    /** Generate barcode as base64 data URL for embedding in HTML/PDF */
    public String generateBarcodeBase64(String orderNumber) throws WriterException, IOException {
        byte[] bytes = generateBarcode(orderNumber, 300, 60);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
    }

    /** Generate QR code as base64 data URL */
    public String generateQrCodeBase64(String orderNumber) throws WriterException, IOException {
        byte[] bytes = generateQrCode(orderNumber, 200);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
    }

    /**
     * Generate a complete dispatch label image.
     * Contains: order number, barcode, QR code, customer address, item summary.
     */
    public byte[] generateLabelImage(String orderNumber, String customerName,
                                      String address, String itemSummary) throws WriterException, IOException {
        int w = 400, h = 560;
        BufferedImage label = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = label.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // White background
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, w, h);

        // Header stripe
        g.setColor(new Color(249, 115, 22)); // Orange #F97316
        g.fillRect(0, 0, w, 50);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 18));
        g.drawString("SMARTDISPATCH", 20, 33);

        // Order number
        g.setColor(Color.BLACK);
        g.setFont(new Font("Monospaced", Font.BOLD, 20));
        g.drawString(orderNumber, 20, 80);

        // Barcode
        byte[] barcodeBytes = generateBarcode(orderNumber, 360, 60);
        BufferedImage barcodeImg = ImageIO.read(new java.io.ByteArrayInputStream(barcodeBytes));
        g.drawImage(barcodeImg, 20, 95, null);

        // Divider
        g.setColor(Color.LIGHT_GRAY);
        g.drawLine(20, 170, w - 20, 170);

        // Ship To
        g.setColor(new Color(100, 100, 100));
        g.setFont(new Font("SansSerif", Font.PLAIN, 10));
        g.drawString("SHIP TO:", 20, 190);

        g.setColor(Color.BLACK);
        g.setFont(new Font("SansSerif", Font.BOLD, 14));
        g.drawString(customerName, 20, 210);

        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        int y = 230;
        for (String line : address.split("\n")) {
            g.drawString(line, 20, y);
            y += 18;
        }

        // Divider
        g.setColor(Color.LIGHT_GRAY);
        g.drawLine(20, y + 5, w - 20, y + 5);
        y += 20;

        // Items
        g.setColor(new Color(100, 100, 100));
        g.setFont(new Font("SansSerif", Font.PLAIN, 10));
        g.drawString("ITEMS:", 20, y);
        y += 15;
        g.setColor(Color.BLACK);
        g.setFont(new Font("SansSerif", Font.PLAIN, 11));
        for (String item : itemSummary.split("\n")) {
            g.drawString(item, 20, y);
            y += 16;
        }

        // QR code at bottom-right
        byte[] qrBytes = generateQrCode(orderNumber, 120);
        BufferedImage qrImg = ImageIO.read(new java.io.ByteArrayInputStream(qrBytes));
        g.drawImage(qrImg, w - 140, h - 150, null);

        // Track label under QR
        g.setColor(new Color(100, 100, 100));
        g.setFont(new Font("SansSerif", Font.PLAIN, 8));
        g.drawString("SCAN TO TRACK", w - 130, h - 22);

        // Footer
        g.setColor(new Color(200, 200, 200));
        g.drawLine(0, h - 15, w, h - 15);
        g.setColor(new Color(150, 150, 150));
        g.setFont(new Font("SansSerif", Font.PLAIN, 8));
        g.drawString("SmartDispatch Verification System v1.0", 20, h - 4);

        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(label, "PNG", out);
        return out.toByteArray();
    }
}
