import { useState } from 'react';
import { vehicleService, CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { userService } from '../../user/services/userService';
import { Vehicle, VehicleStatus, User } from '../../../types';
import { useToast } from '../../../context/ToastContext';

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  return fallback;
};

/**
 * Lifecycle of the driver list loaded for the assign modal:
 * - `idle`: modal not opened yet
 * - `loading`: request in flight
 * - `ready`: list loaded (may still be empty)
 * - `error`: request failed (user-service unreachable) — show retry instead of "no drivers"
 */
export type DriversStatus = 'idle' | 'loading' | 'ready' | 'error';

export const useVehicleActions = (onChanged: () => void) => {
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isTripHistoryOpen, setIsTripHistoryOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [driversStatus, setDriversStatus] = useState<DriversStatus>('idle');

  const loadDrivers = async () => {
    setDriversStatus('loading');
    try {
      const drivers = await userService.getUsers('DRIVER');
      setAvailableDrivers(drivers);
      setDriversStatus('ready');
    } catch {
      try {
        setAvailableDrivers(await userService.getAvailableDrivers());
        setDriversStatus('ready');
      } catch {
        setAvailableDrivers([]);
        setDriversStatus('error');
      }
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    void loadDrivers();
  };
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsEditModalOpen(true);
    void loadDrivers();
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const openDetailModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setDetailVehicle(v);
    setIsDetailModalOpen(true);
  };
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailVehicle(null);
  };

  const openAssignModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsAssignModalOpen(true);
    void loadDrivers();
  };
  const closeAssignModal = () => setIsAssignModalOpen(false);

  const openReturnModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsReturnModalOpen(true);
  };
  const closeReturnModal = () => setIsReturnModalOpen(false);

  const openTripHistoryModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsTripHistoryOpen(true);
  };
  const closeTripHistoryModal = () => setIsTripHistoryOpen(false);

  const handleCreate = async (
    data: CreateVehicleData | UpdateVehicleData,
    driverId?: number | null,
    status?: VehicleStatus
  ) => {
    try {
      const created = await vehicleService.createVehicle(data as CreateVehicleData);

      // Cập nhật tình trạng xe nếu khác AVAILABLE
      if (status && status !== 'AVAILABLE') {
        try {
          await vehicleService.updateStatus(created.id, status);
        } catch {
          console.warn('Update initial status failed');
        }
      }

      // Nếu người dùng chọn gán tài xế ngay khi tạo xe
      if (driverId) {
        try {
          const driversList = availableDrivers.length ? availableDrivers : await userService.getUsers('DRIVER');
          const driver = driversList.find((d) => d.id === driverId);
          if (driver) {
            await vehicleService.assignDriver(created.id, driver.id, driver.fullName, driver.email);
            showToast('success', `Đã thêm xe ${created.licensePlate} và bàn giao cho tài xế ${driver.fullName}!`);
          } else {
            showToast('success', `Thêm phương tiện ${created.licensePlate} thành công!`);
          }
        } catch {
          showToast('success', `Thêm xe ${created.licensePlate} thành công (vui lòng bàn giao tài xế sau).`);
        }
      } else {
        showToast('success', `Thêm phương tiện ${created.licensePlate} thành công!`);
      }

      setIsAddModalOpen(false);
      onChanged();
    } catch (err: unknown) {
      showToast('error', extractErrorMessage(err, 'Không thể thêm phương tiện'));
    }
  };

  const handleUpdate = async (
    data: CreateVehicleData | UpdateVehicleData,
    newDriverId?: number | null,
    newStatus?: VehicleStatus
  ) => {
    if (!selectedVehicle) return;
    try {
      await vehicleService.updateVehicle(selectedVehicle.id, data as UpdateVehicleData);

      // Cập nhật tình trạng xe nếu có thay đổi
      if (newStatus && newStatus !== selectedVehicle.status) {
        try {
          await vehicleService.updateStatus(selectedVehicle.id, newStatus);
        } catch {
          console.warn('Update vehicle status failed');
        }
      }

      const currentDriverId = selectedVehicle.assignedDriverId;
      if (newDriverId !== undefined && newDriverId !== currentDriverId) {
        const odo = (data as UpdateVehicleData).currentOdometer ?? selectedVehicle.currentOdometer;

        if (currentDriverId && !newDriverId) {
          // Thu hồi xe về trạng thái không có tài xế
          try {
            await vehicleService.returnVehicle(selectedVehicle.id, odo, 'Thu hồi xe từ giao diện chỉnh sửa');
          } catch (retErr) {
            console.warn('Return vehicle failed:', retErr);
          }
        } else if (newDriverId) {
          // Bàn giao cho tài xế mới
          try {
            if (currentDriverId) {
              await vehicleService.returnVehicle(selectedVehicle.id, odo, 'Đổi tài xế từ giao diện chỉnh sửa');
            }
            const driversList = availableDrivers.length ? availableDrivers : await userService.getUsers('DRIVER');
            const driver = driversList.find((d) => d.id === newDriverId);
            if (driver) {
              await vehicleService.assignDriver(selectedVehicle.id, driver.id, driver.fullName, driver.email);
            }
          } catch (assignErr) {
            console.warn('Re-assigning driver failed:', assignErr);
          }
        }
      }

      showToast('success', `Cập nhật thông tin xe ${selectedVehicle.licensePlate} thành công!`);
      setIsEditModalOpen(false);
      onChanged();
    } catch (err: unknown) {
      showToast('error', extractErrorMessage(err, 'Không thể cập nhật thông tin xe'));
    }
  };

  const handleAssign = async (driverId: number, driverName: string, driverEmail?: string) => {
    if (!selectedVehicle) return;
    try {
      await vehicleService.assignDriver(selectedVehicle.id, driverId, driverName, driverEmail);
      showToast('success', `Đã bàn giao xe ${selectedVehicle.licensePlate} cho tài xế ${driverName}!`);
      setIsAssignModalOpen(false);
      onChanged();
    } catch {
      showToast('error', 'Không thể bàn giao xe');
    }
  };

  const handleReturn = async (newOdometer: number, notes: string) => {
    if (!selectedVehicle) return;
    try {
      const updated = await vehicleService.returnVehicle(selectedVehicle.id, newOdometer, notes);
      if (updated.status === 'MAINTENANCE') {
        showToast('warning', `Xe ${updated.licensePlate} đã vượt ngưỡng bảo dưỡng 5.000 km và chuyển sang BẢO DƯỠNG!`);
      } else {
        showToast('success', `Bàn giao lại xe ${updated.licensePlate} thành công! Số km: ${newOdometer.toLocaleString('vi-VN')} km`);
      }
      setIsReturnModalOpen(false);
      onChanged();
    } catch (err: unknown) {
      showToast('error', extractErrorMessage(err, 'Không thể bàn giao lại xe'));
    }
  };

  const handleFinishMaintenance = async (v: Vehicle) => {
    await handleChangeStatus(v, 'AVAILABLE');
  };

  const handleChangeStatus = async (v: Vehicle, status: VehicleStatus) => {
    if (v.status === status) return;
    try {
      await vehicleService.updateStatus(v.id, status);
      if (status === 'MAINTENANCE') {
        showToast('success', `Đã đưa xe ${v.licensePlate} vào bảo dưỡng. Trạng thái chuyển sang BẢO DƯỠNG.`);
      } else {
        showToast('success', `Đã hoàn thành bảo dưỡng cho xe ${v.licensePlate}! Trạng thái chuyển sang SẴN SÀNG.`);
      }
      onChanged();
    } catch (err: unknown) {
      showToast('error', extractErrorMessage(err, 'Không thể cập nhật trạng thái xe'));
    }
  };

  const confirmDelete = async () => {
    if (!deletingVehicle) return;
    try {
      await vehicleService.deleteVehicle(deletingVehicle.id);
      showToast('success', `Đã ngừng khai thác xe ${deletingVehicle.licensePlate} (DECOMMISSIONED).`);
      setDeletingVehicle(null);
      onChanged();
    } catch {
      showToast('error', 'Không thể xóa xe');
    }
  };

  return {
    isAddModalOpen,
    isEditModalOpen,
    isDetailModalOpen,
    isAssignModalOpen,
    isReturnModalOpen,
    isTripHistoryOpen,
    selectedVehicle,
    detailVehicle,
    deletingVehicle,
    availableDrivers,
    driversStatus,
    reloadDrivers: loadDrivers,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDetailModal,
    closeDetailModal,
    openAssignModal,
    closeAssignModal,
    openReturnModal,
    closeReturnModal,
    openTripHistoryModal,
    closeTripHistoryModal,
    requestDelete: setDeletingVehicle,
    closeDeleteModal: () => setDeletingVehicle(null),
    handleCreate,
    handleUpdate,
    handleAssign,
    handleReturn,
    handleFinishMaintenance,
    handleChangeStatus,
    confirmDelete,
  };
};

export type VehicleActions = ReturnType<typeof useVehicleActions>;

export default useVehicleActions;