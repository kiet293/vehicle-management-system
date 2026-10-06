package com.vms.vehicle.repository;

import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    boolean existsByLicensePlate(String licensePlate);

    List<Vehicle> findAllByStatus(VehicleStatus status);

    List<Vehicle> findAllByStatusNot(VehicleStatus status);

    @Query("SELECT DISTINCT v.brand FROM Vehicle v WHERE v.brand IS NOT NULL AND v.brand <> '' ORDER BY v.brand ASC")
    List<String> findDistinctBrands();
}
