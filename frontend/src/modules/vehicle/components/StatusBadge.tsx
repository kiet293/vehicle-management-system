import React from 'react';
import { CheckCircle2, Clock, Wrench } from 'lucide-react';
import { VehicleStatus } from '../../../types';

interface StatusBadgeProps {
  status: VehicleStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'AVAILABLE') {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={12} /> SẴN SÀNG
      </span>
    );
  }
  if (status === 'IN_USE') {
    return (
      <span className="badge badge-info">
        <Clock size={12} /> ĐANG SỬ DỤNG
      </span>
    );
  }
  if (status === 'MAINTENANCE') {
    return (
      <span className="badge badge-warning">
        <Wrench size={12} /> BẢO DƯỠNG
      </span>
    );
  }
  return <span className="badge badge-danger">NGỪNG KHAI THÁC</span>;
};

export default StatusBadge;