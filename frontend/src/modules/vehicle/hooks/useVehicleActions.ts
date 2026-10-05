import { useState } from 'react';
import { vehicleService, CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { userService } from '../../user/services/userService';
import { Vehicle, User } from '../../../types';
import { useToast } from '../../../context/ToastContext';

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  return fallback;
};

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

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const openAssignModal = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsAssignModalOpen(true);
    try {
      setAvailableDrivers(await userService.getAvailableDrivers());
    } catch {
      setAvailableDrivers([]);
    }
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
    } catch {
      showToast('error', 'Không thể cập nhật thông tin xe');
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
    try {
      await vehicleService.updateStatus(v.id, 'AVAILABLE');
      showToast('success', `Đã hoàn thành bảo dưỡng cho xe ${v.licensePlate}! Trạng thái chuyển sang SẴN SÀNG.`);
      onChanged();
    } catch {
      showToast('error', 'Không thể cập nhật trạng thái');
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
    confirmDelete,
  };
};

export type VehicleActions = ReturnType<typeof useVehicleActions>;

export default useVehicleActions;