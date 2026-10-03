package com.vms.vehicle.repository;

import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    boolean existsByLicensePlate(String licensePlate);
    List<Vehicle> findAllByStatus(VehicleStatus status);
    List<Vehicle> findAllByStatusNot(VehicleStatus status);
}
