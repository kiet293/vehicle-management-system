package com.vms.vehicle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Trip log: one record per driver dispatch / vehicle return, kept for auditing.
 * The driver reference is a soft reference (no foreign key) because drivers
 * live in user_db, which this service must not reach into.
 */
@Entity
@Table(name = "vehicle_trips", indexes = {
        @Index(name = "idx_trip_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_trip_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "vehicle_plate", nullable = false, length = 20)
    private String vehiclePlate;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "start_odometer", nullable = false)
    private Integer startOdometer;

    @Column(name = "end_odometer")
    private Integer endOdometer;

    @Column(name = "distance_km")
    private Integer distanceKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}