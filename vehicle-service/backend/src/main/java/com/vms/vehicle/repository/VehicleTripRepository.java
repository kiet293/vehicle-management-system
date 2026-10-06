package com.vms.vehicle.repository;

import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.VehicleTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleTripRepository extends JpaRepository<VehicleTrip, Long> {

    List<VehicleTrip> findAllByVehicleIdOrderByStartedAtDesc(Long vehicleId);

    Optional<VehicleTrip> findFirstByVehicleIdAndStatusOrderByStartedAtDesc(Long vehicleId, TripStatus status);
}