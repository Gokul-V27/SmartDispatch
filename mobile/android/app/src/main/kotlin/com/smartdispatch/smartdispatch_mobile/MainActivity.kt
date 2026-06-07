package com.smartdispatch.smartdispatch_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        val channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.smartdispatch.smartdispatch_mobile/arcore_measure")
        val plugin = ArCoreMeasurePlugin(this)
        channel.setMethodCallHandler(plugin)
    }
}
