package com.smartdispatch.smartdispatch_mobile

import android.app.Activity
import com.google.ar.core.*
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import kotlin.math.*

class ArCoreMeasurePlugin(private val activity: Activity) : MethodChannel.MethodCallHandler {

    private var arSession: Session? = null

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "checkSupported" -> {
                val avail = ArCoreApk.getInstance().checkAvailability(activity)
                result.success(avail.isSupported)
            }
            "init"    -> result.success(initSession())
            "measure" -> {
                val bbX1        = call.argument<Int>("bbX1")        ?: 0
                val bbY1        = call.argument<Int>("bbY1")        ?: 0
                val bbX2        = call.argument<Int>("bbX2")        ?: 480
                val bbY2        = call.argument<Int>("bbY2")        ?: 640
                val imageWidth  = call.argument<Int>("imageWidth")  ?: 480
                val imageHeight = call.argument<Int>("imageHeight") ?: 640
                result.success(measure(bbX1, bbY1, bbX2, bbY2, imageWidth, imageHeight))
            }
            "dispose" -> { disposeSession(); result.success(null) }
            else      -> result.notImplemented()
        }
    }

    // ── Session lifecycle ─────────────────────────────────────────────────────

    private fun initSession(): Boolean {
        val avail = ArCoreApk.getInstance().checkAvailability(activity)
        if (!avail.isSupported) return false

        return try {
            val session = Session(activity)
            val config  = Config(session).apply {
                depthMode  = Config.DepthMode.AUTOMATIC
                // BLOCKING update so measure() always gets a fresh depth frame
                // without spinning in a loop waiting for one.
                updateMode = Config.UpdateMode.BLOCKING
                focusMode  = Config.FocusMode.FIXED  // faster than AUTO (no AF sweep time)
            }

            if (!session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                session.close(); return false
            }

            session.configure(config)
            session.resume()
            arSession = session
            true
        } catch (e: Exception) { false }
    }

    private fun disposeSession() {
        arSession?.close()
        arSession = null
    }

    // ── Core measurement ──────────────────────────────────────────────────────

    private fun measure(
        bbX1: Int, bbY1: Int, bbX2: Int, bbY2: Int,
        imageWidth: Int, imageHeight: Int,
    ): Map<String, Any> {

        val session = arSession ?: return mapOf("error" to "ARCore session not initialised")

        // With BLOCKING update mode this returns immediately with the newest frame.
        val frame = try { session.update() }
        catch (e: Exception) { return mapOf("error" to "Frame update failed: ${e.message}") }

        // Acquire depth image — guaranteed available when DepthMode == AUTOMATIC
        val depthImage = try { frame.acquireDepthImage16Bits() }
        catch (e: Exception) { return mapOf("error" to "Depth unavailable: ${e.message}") }

        val depthW  = depthImage.width   // typically 240 or 160
        val depthH  = depthImage.height  // typically 180 or 120
        val depthBuf = depthImage.planes[0].buffer.asShortBuffer()

        // Scale bounding-box from camera-image space → depth-image space
        val scaleX = depthW.toFloat() / imageWidth
        val scaleY = depthH.toFloat() / imageHeight

        val dx1 = (bbX1 * scaleX).toInt().coerceIn(0, depthW - 1)
        val dy1 = (bbY1 * scaleY).toInt().coerceIn(0, depthH - 1)
        val dx2 = (bbX2 * scaleX).toInt().coerceIn(0, depthW - 1)
        val dy2 = (bbY2 * scaleY).toInt().coerceIn(0, depthH - 1)

        // Camera intrinsics (in camera-image space) → scaled to depth-image space
        val intr = frame.camera.imageIntrinsics
        val fx = intr.focalLength[0]    * scaleX
        val fy = intr.focalLength[1]    * scaleY
        val cx = intr.principalPoint[0] * scaleX
        val cy = intr.principalPoint[1] * scaleY

        // ── FAST point cloud: step=3 instead of 2 (3× fewer points, still accurate) ──
        // Pre-allocate array to avoid list resizing GC pressure
        val maxPts = ((dy2 - dy1 + 3) / 3) * ((dx2 - dx1 + 3) / 3)
        val xs = FloatArray(maxPts); val ys = FloatArray(maxPts); val zs = FloatArray(maxPts)
        var count = 0
        val step = 3

        for (v in dy1..dy2 step step) {
            for (u in dx1..dx2 step step) {
                val depthMm = depthBuf[v * depthW + u].toInt() and 0xFFFF
                if (depthMm < 100 || depthMm > 4000) continue  // 4m max (faster reject)
                val d = depthMm * 0.001f
                xs[count] = (u - cx) * d / fx
                ys[count] = (v - cy) * d / fy
                zs[count] = d
                count++
            }
        }

        depthImage.close()

        if (count < 15) {
            return mapOf("error" to "Not enough depth points ($count). Move closer.")
        }

        // ── OBB via fast PCA on primitive arrays (no boxing) ──────────────────
        val (length, width, height) = computeOBB(xs, ys, zs, count)

        return mapOf(
            "length" to roundTo1(length * 100.0),
            "width"  to roundTo1(width  * 100.0),
            "height" to roundTo1(height * 100.0),
        )
    }

    // ── OBB via PCA — operates on pre-allocated primitive float arrays ─────────

    private fun computeOBB(
        xs: FloatArray, ys: FloatArray, zs: FloatArray, n: Int,
    ): Triple<Double, Double, Double> {

        val nd = n.toDouble()
        var mx = 0.0; var my = 0.0; var mz = 0.0
        for (i in 0 until n) { mx += xs[i]; my += ys[i]; mz += zs[i] }
        mx /= nd; my /= nd; mz /= nd

        var cxx = 0.0; var cxy = 0.0; var cxz = 0.0
        var cyy = 0.0; var cyz = 0.0; var czz = 0.0
        for (i in 0 until n) {
            val dx = xs[i] - mx; val dy = ys[i] - my; val dz = zs[i] - mz
            cxx += dx*dx; cxy += dx*dy; cxz += dx*dz
            cyy += dy*dy; cyz += dy*dz; czz += dz*dz
        }
        cxx /= nd; cxy /= nd; cxz /= nd; cyy /= nd; cyz /= nd; czz /= nd

        val cov = arrayOf(
            doubleArrayOf(cxx, cxy, cxz),
            doubleArrayOf(cxy, cyy, cyz),
            doubleArrayOf(cxz, cyz, czz),
        )

        val axes = Array(3) { DoubleArray(3) }
        for (k in 0..2) {
            axes[k] = dominantEigenvector(cov)
            deflate(cov, axes[k])
        }

        val extents = DoubleArray(3)
        for (k in 0..2) {
            var minP =  Double.MAX_VALUE
            var maxP = -Double.MAX_VALUE
            val ax = axes[k][0]; val ay = axes[k][1]; val az = axes[k][2]
            for (i in 0 until n) {
                val p = xs[i]*ax + ys[i]*ay + zs[i]*az
                if (p < minP) minP = p
                if (p > maxP) maxP = p
            }
            extents[k] = maxP - minP
        }

        extents.sortDescending()
        return Triple(extents[0], extents[1], extents[2])
    }

    // Power iteration — 16 rounds is sufficient for 3×3 matrices
    private fun dominantEigenvector(m: Array<DoubleArray>): DoubleArray {
        var v = doubleArrayOf(1.0, 1.0, 1.0)
        repeat(16) {
            val mv = doubleArrayOf(
                m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
                m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
                m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
            )
            val norm = sqrt(mv[0]*mv[0] + mv[1]*mv[1] + mv[2]*mv[2])
            if (norm < 1e-10) return v
            v = doubleArrayOf(mv[0]/norm, mv[1]/norm, mv[2]/norm)
        }
        return v
    }

    private fun deflate(m: Array<DoubleArray>, e: DoubleArray) {
        val lambda = e[0]*(m[0][0]*e[0]+m[0][1]*e[1]+m[0][2]*e[2]) +
                     e[1]*(m[1][0]*e[0]+m[1][1]*e[1]+m[1][2]*e[2]) +
                     e[2]*(m[2][0]*e[0]+m[2][1]*e[1]+m[2][2]*e[2])
        for (i in 0..2) for (j in 0..2) m[i][j] -= lambda * e[i] * e[j]
    }

    private fun roundTo1(v: Double): Double = (v * 10.0).roundToInt() / 10.0
}
