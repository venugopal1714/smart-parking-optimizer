import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = 'http://localhost:5000/api';

  Future<List<dynamic>> getSlots() async {
    final response = await http.get(Uri.parse('$baseUrl/slots'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    }
    throw Exception('Failed to load slots');
  }

  Future<bool> updateSlotStatus(int slotId, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/slots/$slotId/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': status}),
    );
    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>> getPrediction({bool useFallback = false}) async {
    final url = '$baseUrl/prediction?use_fallback=$useFallback';
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load prediction');
  }
}