import React from 'react';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Vehicle } from '../../../types';

interface DeleteVehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteVehicleModal: React.FC<DeleteVehicleModalProps> = ({
  vehicle,
  onClose,
  onConfirm,
}) => {
  if (!vehicle) return null;

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xác nhận ngừng khai thác xe"
      message={`Bạn có chắc chắn muốn ngừng khai thác phương tiện ${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model})? Trạng thái xe sẽ chuyển sang DECOMMISSIONED để bảo toàn dữ liệu tài chính lịch sử.`}
      confirmText="Xác nhận ngừng khai thác"
      isDangerous={true}
    />
  );
};

export default DeleteVehicleModal;