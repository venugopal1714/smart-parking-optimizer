import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SlotListScreen extends StatefulWidget {
  const SlotListScreen({super.key});

  @override
  State<SlotListScreen> createState() => _SlotListScreenState();
}

class _SlotListScreenState extends State<SlotListScreen> {
  List<Map<String, dynamic>> _slots = [];
  bool _loading = true;
  String _filterFloor = 'All';
  List<String> _floors = ['All'];

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService().getSlots();
      final floors = ['All', ...{...data.map((s) => s['floor']?.toString() ?? 'G')}.toList()..sort()];
      setState(() {
        _slots = List<Map<String, dynamic>>.from(data);
        _floors = floors;
        _loading = false;
      });
    } catch (e) {
      // Demo data when backend unavailable
      setState(() {
        _slots = List.generate(20, (i) {
          final floor = ['A', 'B', 'C', 'D'][i ~/ 5];
          return {
            'id': i + 1,
            'slot_number': '$floor-0${(i % 5) + 1}',
            'floor': floor,
            'slot_type': (i % 5 == 4) ? 'ev' : (i % 5 == 3) ? 'handicap' : 'regular',
            'status': ['available', 'occupied', 'available', 'reserved', 'available'][i % 5],
            'vehicle_number': null,
          };
        });
        _floors = ['All', 'A', 'B', 'C', 'D'];
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(Map<String, dynamic> slot, String newStatus) async {
    String? vehicleNum;
    if (newStatus == 'occupied') {
      vehicleNum = await _showVehicleDialog();
      if (vehicleNum == null) return; // cancelled
    }

    try {
      await ApiService().updateSlotStatus(slot['id'], newStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${slot['slot_number']} → $newStatus'),
            backgroundColor: _statusColor(newStatus),
          ),
        );
      }
      _loadSlots();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<String?> _showVehicleDialog() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enter Vehicle Number'),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            hintText: 'MH01AB1234',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, controller.text.toUpperCase()),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'available': return Colors.green;
      case 'occupied': return Colors.red;
      case 'reserved': return Colors.orange;
      case 'maintenance': return Colors.grey;
      default: return Colors.blue;
    }
  }

  IconData _slotTypeIcon(String type) {
    switch (type) {
      case 'ev': return Icons.electric_car;
      case 'handicap': return Icons.accessible;
      default: return Icons.directions_car;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filterFloor == 'All'
        ? _slots
        : _slots.where((s) => s['floor'] == _filterFloor).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Parking Slots'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadSlots),
        ],
      ),
      body: Column(
        children: [
          // Floor Filter
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _floors.map((f) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f),
                    selected: _filterFloor == f,
                    onSelected: (_) => setState(() => _filterFloor = f),
                    selectedColor: Colors.blue.shade100,
                  ),
                )).toList(),
              ),
            ),
          ),

          // Slots List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadSlots,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: filtered.length,
                      itemBuilder: (ctx, i) {
                        final slot = filtered[i];
                        final status = slot['status'] ?? 'available';
                        final color = _statusColor(status);

                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: color.withOpacity(0.15),
                              child: Icon(_slotTypeIcon(slot['slot_type'] ?? 'regular'), color: color),
                            ),
                            title: Text(
                              slot['slot_number'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  margin: const EdgeInsets.only(top: 2),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(status.toUpperCase(),
                                      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                                if (slot['vehicle_number'] != null)
                                  Text('🚗 ${slot['vehicle_number']}', style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                            trailing: _buildStatusButtons(slot, status),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusButtons(Map<String, dynamic> slot, String currentStatus) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert),
      onSelected: (v) => _updateStatus(slot, v),
      itemBuilder: (ctx) => [
        if (currentStatus != 'available')
          const PopupMenuItem(value: 'available', child: Row(children: [
            Icon(Icons.check_circle, color: Colors.green, size: 18),
            SizedBox(width: 8), Text('Mark Available'),
          ])),
        if (currentStatus != 'occupied')
          const PopupMenuItem(value: 'occupied', child: Row(children: [
            Icon(Icons.block, color: Colors.red, size: 18),
            SizedBox(width: 8), Text('Mark Occupied'),
          ])),
        if (currentStatus != 'maintenance')
          const PopupMenuItem(value: 'maintenance', child: Row(children: [
            Icon(Icons.build, color: Colors.grey, size: 18),
            SizedBox(width: 8), Text('Set Maintenance'),
          ])),
      ],
    );
  }
}
