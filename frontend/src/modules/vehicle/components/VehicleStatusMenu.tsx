import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, Wrench } from 'lucide-react';
import { Vehicle, VehicleStatus } from '../../../types';

interface VehicleStatusMenuProps {
  vehicle: Vehicle;
  onChangeStatus: (v: Vehicle, status: VehicleStatus) => void;
}

interface MenuTarget {
  status: VehicleStatus;
  label: string;
}

const getMenuTarget = (status: VehicleStatus): MenuTarget | null => {
  if (status === 'AVAILABLE') {
    return { status: 'MAINTENANCE', label: 'Đưa vào bảo dưỡng' };
  }
  if (status === 'MAINTENANCE') {
    return { status: 'AVAILABLE', label: 'Xong bảo dưỡng' };
  }
  return null;
};

const MENU_WIDTH = 196;
const MENU_HEIGHT = 92;
const GAP = 8;

export const VehicleStatusMenu: React.FC<VehicleStatusMenuProps> = ({ vehicle, onChangeStatus }) => {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const target = getMenuTarget(vehicle.status);

  const close = useCallback(() => setAnchor(null), []);

  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (anchor) {
      close();
      return;
    }
    const below = window.innerHeight - rect.bottom;
    const top = below < MENU_HEIGHT + GAP ? rect.top - MENU_HEIGHT - GAP : rect.bottom + GAP;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setAnchor({ top, left });
  };

  useEffect(() => {
    if (!anchor) return;
    const handleOutside = (event: MouseEvent) => {
      if (
        !containerRef.current?.contains(event.target as Node) &&
        !document.getElementById(`status-menu-popup-${vehicle.id}`)?.contains(event.target as Node)
      ) {
        close();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const handleViewportChange = () => close();
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [anchor, close, vehicle.id]);

  useEffect(() => {
    setAnchor(null);
  }, [vehicle.status]);

  if (!target) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={toggle}
        className="btn btn-secondary btn-icon"
        style={{ width: '24px', height: '24px', borderRadius: '8px' }}
        title="Chuyển trạng thái xe"
        aria-label={`Chuyển trạng thái xe ${vehicle.licensePlate}`}
        aria-expanded={!!anchor}
        aria-haspopup="menu"
      >
        <ChevronDown size={14} />
      </button>

      {anchor &&
        createPortal(
          <div
            id={`status-menu-popup-${vehicle.id}`}
            role="menu"
            style={{
              position: 'fixed',
              top: anchor.top,
              left: anchor.left,
              zIndex: 200,
              width: `${MENU_WIDTH}px`,
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.375rem',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', padding: '0.25rem 0.5rem 0.375rem' }}>
              TRẠNG THÁI {vehicle.licensePlate}
            </div>
            <button
              onClick={() => {
                close();
                onChangeStatus(vehicle, target.status);
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }}
              role="menuitem"
            >
              {target.status === 'MAINTENANCE' ? <Wrench size={14} /> : <CheckCircle2 size={14} />}
              {target.label}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default VehicleStatusMenu;