import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final slots = await ApiService().getSlots();
      final total = slots.length;
      final available = slots.where((s) => s['status'] == 'available').length;
      final occupied = slots.where((s) => s['status'] == 'occupied').length;
      final reserved = slots.where((s) => s['status'] == 'reserved').length;
      setState(() {
        _stats = {
          'total': total, 'available': available,
          'occupied': occupied, 'reserved': reserved,
          'occupancy': total > 0 ? (occupied / total * 100).round() : 0
        };
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _stats = {'total': 20, 'available': 10, 'occupied': 6, 'reserved': 3, 'occupancy': 30};
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🚗 SmartPark Guard'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadStats),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadStats,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Live Parking Status',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),

                    // Stats Grid
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _StatCard('Total Slots', '${_stats!['total']}', Colors.blue),
                        _StatCard('Available', '${_stats!['available']}', Colors.green),
                        _StatCard('Occupied', '${_stats!['occupied']}', Colors.red),
                        _StatCard('Reserved', '${_stats!['reserved']}', Colors.orange),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Occupancy Meter
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Occupancy Rate',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(
                              value: (_stats!['occupancy'] as int) / 100,
                              minHeight: 20,
                              borderRadius: BorderRadius.circular(10),
                              backgroundColor: Colors.grey.shade200,
                              color: _stats!['occupancy'] > 70
                                  ? Colors.red
                                  : _stats!['occupancy'] > 50
                                      ? Colors.orange
                                      : Colors.green,
                            ),
                            const SizedBox(height: 8),
                            Text('${_stats!['occupancy']}% Occupied',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Guard Quick Tips
                    Card(
                      color: Colors.blue.shade50,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('📋 Guard Instructions',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            SizedBox(height: 8),
                            Text('• Go to Slots tab to update slot status'),
                            Text('• Mark occupied when vehicle enters'),
                            Text('• Mark available when vehicle exits'),
                            Text('• Check AI Prediction for expected traffic'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;

  const _StatCard(this.title, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(value,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
            Text(title, style: const TextStyle(fontSize: 13, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
