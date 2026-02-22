class ParkingSlot {
  final int id;
  final String slotNumber;
  final String floor;
  final String slotType;
  String status;
  String? vehicleNumber;
  DateTime? updatedAt;

  ParkingSlot({
    required this.id,
    required this.slotNumber,
    required this.floor,
    required this.slotType,
    required this.status,
    this.vehicleNumber,
    this.updatedAt,
  });

  factory ParkingSlot.fromJson(Map<String, dynamic> json) {
    return ParkingSlot(
      id: json['id'],
      slotNumber: json['slot_number'],
      floor: json['floor'] ?? 'G',
      slotType: json['slot_type'] ?? 'regular',
      status: json['status'] ?? 'available',
      vehicleNumber: json['vehicle_number'],
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, Color> get statusColors => {
        'available': const Color(0xFF52c41a),
        'occupied': const Color(0xFFff4d4f),
        'reserved': const Color(0xFFfa8c16),
        'maintenance': const Color(0xFF8c8c8c),
      };

  bool get isAvailable => status == 'available';
  bool get isOccupied => status == 'occupied';
}

// Needed for Color in model file
import 'package:flutter/material.dart';
