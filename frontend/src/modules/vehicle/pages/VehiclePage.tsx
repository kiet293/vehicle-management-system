import React, { useCallback } from 'react';
import { Car, Search } from 'lucide-react';
import { Vehicle } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { Skeleton, TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { useVehicleFleet } from '../hooks/useVehicleFleet';
import { useVehicleActions } from '../hooks/useVehicleActions';
import { ErrorBanner } from '../components/ErrorBanner';
import { VehiclePageHeader } from '../components/VehiclePageHeader';
import { VehicleFilters } from '../components/VehicleFilters';
import { VehicleCardGrid } from '../components/VehicleCardGrid';
import { VehicleDataTable } from '../components/VehicleDataTable';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { AssignDriverModal } from '../components/AssignDriverModal';
import { ReturnVehicleModal } from '../components/ReturnVehicleModal';
import { DeleteVehicleModal } from '../components/DeleteVehicleModal';
import { VehicleTripHistoryModal } from '../components/VehicleTripHistoryModal';

export const VehiclePage: React.FC = () => {
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';

  const {
    vehicles,
    isLoading,
    errorBanner,
    fetchVehicles,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    brandFilter,
    setBrandFilter,
    brands,
    viewMode,
    setViewMode,
    clearFilters,
    hasActiveFilter,
    loadBrands,
  } = useVehicleFleet();

  // Refresh both the vehicle list and the brand dropdown after any mutation
  // so a newly created / renamed / deleted brand is reflected immediately.
  const refreshAll = useCallback(() => {
    void fetchVehicles();
    void loadBrands();
  }, [fetchVehicles, loadBrands]);

  const actions = useVehicleActions(refreshAll);

  const rowActionProps = {
    isDriver,
    onAssign: actions.openAssignModal,
    onReturn: actions.openReturnModal,
    onFinishMaintenance: actions.handleFinishMaintenance,
    onEdit: actions.openEditModal,
    onDelete: actions.requestDelete,
    onViewTrips: actions.openTripHistoryModal,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ErrorBanner message={errorBanner} onRetry={refreshAll} />

      <VehiclePageHeader canAdd={!isDriver} onAdd={actions.openAddModal} />

      <VehicleFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        brandFilter={brandFilter}
        onBrandChange={setBrandFilter}
        brands={brands}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        viewMode === 'GRID' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: '320px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Skeleton height="150px" borderRadius="12px" />
                <Skeleton height="24px" width="60%" />
                <Skeleton height="16px" width="40%" />
                <Skeleton height="36px" width="100%" style={{ marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : (
          <TableSkeleton rows={5} columns={7} />
        )
      ) : vehicles.length === 0 ? (
        hasActiveFilter ? (
          <EmptyState
            icon={<Search size={28} />}
            title="Không tìm thấy phương tiện nào"
            description="Không tìm thấy xe nào khớp với tiêu chí tìm kiếm."
            actionText="Xóa bộ lọc"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={<Car size={28} />}
            title="Chưa có phương tiện nào trong hạm đội"
            description="Bắt đầu đăng ký phương tiện đầu tiên để quản lý lộ trình và chi phí."
            actionText={isDriver ? undefined : '+ Thêm phương tiện đầu tiên'}
            onAction={actions.openAddModal}
          />
        )
      ) : viewMode === 'GRID' ? (
        <VehicleCardGrid vehicles={vehicles} {...rowActionProps} />
      ) : (
        <VehicleDataTable vehicles={vehicles} {...rowActionProps} />
      )}

      <VehicleFormModal
        isOpen={actions.isAddModalOpen}
        onClose={actions.closeAddModal}
        mode="CREATE"
        vehicle={null}
        onSubmit={actions.handleCreate}
      />

      {actions.selectedVehicle && (
        <VehicleFormModal
          isOpen={actions.isEditModalOpen}
          onClose={actions.closeEditModal}
          mode="EDIT"
          vehicle={actions.selectedVehicle}
          onSubmit={actions.handleUpdate}
        />
      )}

      <AssignDriverModal
        isOpen={actions.isAssignModalOpen}
        onClose={actions.closeAssignModal}
        vehicle={actions.selectedVehicle}
        drivers={actions.availableDrivers}
        driversStatus={actions.driversStatus}
        onRetryDrivers={actions.reloadDrivers}
        onAssign={actions.handleAssign}
      />

      <ReturnVehicleModal
        isOpen={actions.isReturnModalOpen}
        onClose={actions.closeReturnModal}
        vehicle={actions.selectedVehicle}
        onReturn={actions.handleReturn}
      />

      <DeleteVehicleModal
        vehicle={actions.deletingVehicle}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.confirmDelete}
      />

      {actions.selectedVehicle && (
        <VehicleTripHistoryModal
          isOpen={actions.isTripHistoryOpen}
          onClose={actions.closeTripHistoryModal}
          vehicle={actions.selectedVehicle as Vehicle}
        />
      )}
    </div>
  );
};

export default VehiclePage;