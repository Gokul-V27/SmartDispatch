package com.smartdispatch.service;

import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URL;
import java.util.*;

/**
 * AI Vision Service — Image comparison engine.
 *
 * Compares a worker's captured photo against the admin-uploaded reference image using:
 * 1. Color Histogram Analysis — extracts dominant color bands, compares distributions
 * 2. Perceptual Hashing (pHash) — resizes to 8x8 grayscale, computes DCT-based hash
 * 3. Structural Comparison — normalized pixel difference after resize
 *
 * Returns a similarity score (0.0 - 1.0) and detailed breakdown.
 * Score >= 0.70 = PASS, 0.50-0.69 = WARN, < 0.50 = FAIL
 */
@Service
public class VisionService {

    private static final int HASH_SIZE = 8;  // 8x8 = 64-bit perceptual hash
    private static final int HIST_BINS = 16; // Color histogram bins per channel
    private static final int RESIZE_DIM = 64; // Resize for pixel comparison

    /**
     * Compare two images and return a detailed comparison result.
     *
     * @param referenceImage  Admin-uploaded reference (BufferedImage)
     * @param capturedImage   Worker's captured photo (BufferedImage)
     * @return Map with scores and overall result
     */
    public Map<String, Object> compareImages(BufferedImage referenceImage, BufferedImage capturedImage) {
        if (referenceImage == null || capturedImage == null) {
            return Map.of("error", "One or both images are null", "result", "FAIL", "score", 0.0);
        }

        // 1. Color Histogram Similarity
        double colorScore = compareColorHistograms(referenceImage, capturedImage);

        // 2. Perceptual Hash Similarity
        double hashScore = comparePerceptualHash(referenceImage, capturedImage);

        // 3. Structural Pixel Similarity
        double structuralScore = compareStructural(referenceImage, capturedImage);

        // 4. Dominant Color Match
        Map<String, Object> dominantRef = extractDominantColor(referenceImage);
        Map<String, Object> dominantCap = extractDominantColor(capturedImage);
        double dominantColorSimilarity = compareDominantColors(dominantRef, dominantCap);

        // Weighted overall score
        double overallScore = (colorScore * 0.30) + (hashScore * 0.30) + (structuralScore * 0.20) + (dominantColorSimilarity * 0.20);

        // Determine result
        String result;
        if (overallScore >= 0.70) result = "PASS";
        else if (overallScore >= 0.50) result = "WARN";
        else result = "FAIL";

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("result", result);
        response.put("overallScore", Math.round(overallScore * 100.0) / 100.0);
        response.put("colorHistogramScore", Math.round(colorScore * 100.0) / 100.0);
        response.put("perceptualHashScore", Math.round(hashScore * 100.0) / 100.0);
        response.put("structuralScore", Math.round(structuralScore * 100.0) / 100.0);
        response.put("dominantColorScore", Math.round(dominantColorSimilarity * 100.0) / 100.0);
        response.put("referenceDominantColor", dominantRef.get("colorName"));
        response.put("capturedDominantColor", dominantCap.get("colorName"));
        response.put("confidence", Math.round(overallScore * 100.0));
        return response;
    }

    /**
     * Compare color histograms using Bhattacharyya distance.
     */
    private double compareColorHistograms(BufferedImage img1, BufferedImage img2) {
        double[] hist1 = computeColorHistogram(img1);
        double[] hist2 = computeColorHistogram(img2);

        // Bhattacharyya coefficient (1.0 = identical, 0.0 = completely different)
        double sum = 0;
        for (int i = 0; i < hist1.length; i++) {
            sum += Math.sqrt(hist1[i] * hist2[i]);
        }
        return sum;
    }

    private double[] computeColorHistogram(BufferedImage img) {
        int totalBins = HIST_BINS * 3; // R, G, B channels
        double[] histogram = new double[totalBins];
        int totalPixels = img.getWidth() * img.getHeight();

        for (int y = 0; y < img.getHeight(); y++) {
            for (int x = 0; x < img.getWidth(); x++) {
                Color c = new Color(img.getRGB(x, y));
                histogram[c.getRed() * HIST_BINS / 256]++;
                histogram[HIST_BINS + c.getGreen() * HIST_BINS / 256]++;
                histogram[2 * HIST_BINS + c.getBlue() * HIST_BINS / 256]++;
            }
        }

        // Normalize
        for (int i = 0; i < totalBins; i++) {
            histogram[i] /= totalPixels;
        }
        return histogram;
    }

    /**
     * Perceptual hash comparison using average hash (aHash).
     * Resize → grayscale → compute mean → binary hash → Hamming distance.
     */
    private double comparePerceptualHash(BufferedImage img1, BufferedImage img2) {
        long hash1 = computeAverageHash(img1);
        long hash2 = computeAverageHash(img2);

        int hammingDistance = Long.bitCount(hash1 ^ hash2);
        int totalBits = HASH_SIZE * HASH_SIZE;
        return 1.0 - ((double) hammingDistance / totalBits);
    }

    private long computeAverageHash(BufferedImage img) {
        // Resize to 8x8
        BufferedImage resized = resize(img, HASH_SIZE, HASH_SIZE);

        // Convert to grayscale and compute average
        int[] gray = new int[HASH_SIZE * HASH_SIZE];
        int sum = 0;
        for (int y = 0; y < HASH_SIZE; y++) {
            for (int x = 0; x < HASH_SIZE; x++) {
                Color c = new Color(resized.getRGB(x, y));
                int g = (int) (0.299 * c.getRed() + 0.587 * c.getGreen() + 0.114 * c.getBlue());
                gray[y * HASH_SIZE + x] = g;
                sum += g;
            }
        }
        int avg = sum / (HASH_SIZE * HASH_SIZE);

        // Compute hash: 1 if pixel > average, 0 otherwise
        long hash = 0;
        for (int i = 0; i < HASH_SIZE * HASH_SIZE; i++) {
            if (gray[i] > avg) hash |= (1L << i);
        }
        return hash;
    }

    /**
     * Structural similarity — normalized pixel difference after resize.
     */
    private double compareStructural(BufferedImage img1, BufferedImage img2) {
        BufferedImage r1 = resize(img1, RESIZE_DIM, RESIZE_DIM);
        BufferedImage r2 = resize(img2, RESIZE_DIM, RESIZE_DIM);

        long totalDiff = 0;
        int pixels = RESIZE_DIM * RESIZE_DIM;

        for (int y = 0; y < RESIZE_DIM; y++) {
            for (int x = 0; x < RESIZE_DIM; x++) {
                Color c1 = new Color(r1.getRGB(x, y));
                Color c2 = new Color(r2.getRGB(x, y));
                int dr = Math.abs(c1.getRed() - c2.getRed());
                int dg = Math.abs(c1.getGreen() - c2.getGreen());
                int db = Math.abs(c1.getBlue() - c2.getBlue());
                totalDiff += (dr + dg + db);
            }
        }

        double maxDiff = pixels * 3.0 * 255.0;
        return 1.0 - (totalDiff / maxDiff);
    }

    /**
     * Extract the dominant color from an image.
     */
    public Map<String, Object> extractDominantColor(BufferedImage img) {
        long rSum = 0, gSum = 0, bSum = 0;
        int total = img.getWidth() * img.getHeight();

        for (int y = 0; y < img.getHeight(); y++) {
            for (int x = 0; x < img.getWidth(); x++) {
                Color c = new Color(img.getRGB(x, y));
                rSum += c.getRed();
                gSum += c.getGreen();
                bSum += c.getBlue();
            }
        }

        int r = (int) (rSum / total);
        int g = (int) (gSum / total);
        int b = (int) (bSum / total);
        String colorName = classifyColor(r, g, b);

        return Map.of(
            "r", r, "g", g, "b", b,
            "hex", String.format("#%02X%02X%02X", r, g, b),
            "colorName", colorName
        );
    }

    /**
     * Compare two dominant colors using Euclidean distance in RGB space.
     */
    private double compareDominantColors(Map<String, Object> c1, Map<String, Object> c2) {
        int r1 = (int) c1.get("r"), g1 = (int) c1.get("g"), b1 = (int) c1.get("b");
        int r2 = (int) c2.get("r"), g2 = (int) c2.get("g"), b2 = (int) c2.get("b");

        double distance = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
        double maxDistance = Math.sqrt(3 * Math.pow(255, 2)); // ~441.67
        return 1.0 - (distance / maxDistance);
    }

    /**
     * Classify an RGB color into a human-readable name.
     */
    private String classifyColor(int r, int g, int b) {
        // Grayscale check
        int maxC = Math.max(r, Math.max(g, b));
        int minC = Math.min(r, Math.min(g, b));
        int saturation = maxC - minC;

        if (maxC < 50) return "Black";
        if (minC > 200 && saturation < 30) return "White";
        if (saturation < 30) return maxC > 128 ? "Light Gray" : "Dark Gray";

        // HSL-based classification
        float[] hsb = Color.RGBtoHSB(r, g, b, null);
        float hue = hsb[0] * 360;

        if (hue < 15 || hue >= 345) return "Red";
        if (hue < 45) return "Orange";
        if (hue < 75) return "Yellow";
        if (hue < 160) return "Green";
        if (hue < 200) return "Cyan";
        if (hue < 260) return "Blue";
        if (hue < 290) return "Purple";
        if (hue < 345) return "Pink";
        return "Unknown";
    }

    /**
     * Load a BufferedImage from a URL string.
     */
    public BufferedImage loadImageFromUrl(String urlStr) {
        try {
            return ImageIO.read(new URL(urlStr));
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Load a BufferedImage from a byte array.
     */
    public BufferedImage loadImageFromBytes(byte[] data) {
        try {
            return ImageIO.read(new ByteArrayInputStream(data));
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Resize a BufferedImage to target dimensions.
     */
    private BufferedImage resize(BufferedImage img, int w, int h) {
        BufferedImage resized = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(img, 0, 0, w, h, null);
        g.dispose();
        return resized;
    }
}
