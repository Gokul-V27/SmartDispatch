import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _userId;
  String? _userName;
  String? _role;
  String? _workerId;

  bool get isLoggedIn => _token != null;
  String? get token => _token;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get role => _role;
  String? get workerId => _workerId;

  AuthService() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _userId = prefs.getString('user_id');
    _userName = prefs.getString('user_name');
    _role = prefs.getString('user_role');
    _workerId = prefs.getString('worker_id');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    final api = ApiService();
    final data = await api.login(email, password);
    if (data != null && data.containsKey('token')) {
      _token = data['token'];
      final user = data['user'];
      _userId = user['id'];
      _userName = user['name'];
      _role = user['role'];
      _workerId = user['workerId'] ?? '';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_id', _userId!);
      await prefs.setString('user_name', _userName!);
      await prefs.setString('user_role', _role!);
      await prefs.setString('worker_id', _workerId!);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> pinLogin(String workerId, String pin) async {
    final api = ApiService();
    final data = await api.pinLogin(workerId, pin);
    if (data != null && data.containsKey('token')) {
      _token = data['token'];
      final user = data['user'];
      _userId = user['id'];
      _userName = user['name'];
      _role = user['role'];
      _workerId = user['workerId'] ?? workerId;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('user_id', _userId!);
      await prefs.setString('user_name', _userName!);
      await prefs.setString('user_role', _role!);
      await prefs.setString('worker_id', _workerId!);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _userId = null;
    _userName = null;
    _role = null;
    _workerId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
