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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isTripHistoryOpen, setIsTripHistoryOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [driversStatus, setDriversStatus] = useState<DriversStatus>('idle');

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const loadDrivers = async () => {
    setDriversStatus('loading');
    try {
      setAvailableDrivers(await userService.getAvailableDrivers());
      setDriversStatus('ready');
    } catch {
      setAvailableDrivers([]);
      setDriversStatus('error');
    }
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

  const handleCreate = async (data: CreateVehicleData | UpdateVehicleData) => {
    try {
      const created = await vehicleService.createVehicle(data as CreateVehicleData);
      showToast('success', `Thêm phương tiện ${created.licensePlate} thành công!`);
      setIsAddModalOpen(false);
      onChanged();
    } catch (err: unknown) {
      showToast('error', extractErrorMessage(err, 'Không thể thêm phương tiện'));
    }
  };

  const handleUpdate = async (data: CreateVehicleData | UpdateVehicleData) => {
    if (!selectedVehicle) return;
    try {
      await vehicleService.updateVehicle(selectedVehicle.id, data as UpdateVehicleData);
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
    isAssignModalOpen,
    isReturnModalOpen,
    isTripHistoryOpen,
    selectedVehicle,
    deletingVehicle,
    availableDrivers,
    driversStatus,
    reloadDrivers: loadDrivers,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
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