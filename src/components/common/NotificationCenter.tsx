// ==============================================================================
// HIPOTECALY: Centro Unificado de Notificaciones (In-App Notification Center)
// ==============================================================================

import React, { useState } from 'react';
import { Bell, Check, ExternalLink, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AutomationEngine, InAppNotification } from '../../lib/automationEngine';

interface NotificationCenterProps {
  tenantId: string;
  role?: 'borrower' | 'lender' | 'analyst' | 'admin';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ tenantId, role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    AutomationEngine.getNotifications(tenantId, role)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    // Refrescar notificaciones al abrir
    setNotifications(AutomationEngine.getNotifications(tenantId, role));
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    AutomationEngine.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getPriorityBadge = (priority: InAppNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">Urgente</span>;
      case 'high':
        return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Alta</span>;
      default:
        return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Info</span>;
    }
  };

  const getPriorityIcon = (priority: InAppNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
      case 'high':
        return <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative inline-block text-left" data-testid="notification-center">
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:text-navy rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 border border-slate-border divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-4 flex items-center justify-between bg-slate-50 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-navy" />
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Centro de Notificaciones</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              {unreadCount} sin leer
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No tienes notificaciones pendientes.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 hover:bg-slate-50/80 transition-colors flex items-start space-x-3 ${
                    !item.read ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {getPriorityIcon(item.priority)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-xs text-navy font-semibold truncate block">
                        {item.title}
                      </strong>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {item.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex items-center space-x-2">
                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            className="text-navy hover:text-brand-green font-semibold flex items-center space-x-1"
                          >
                            <span>Ver caso</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!item.read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-brand-green hover:underline flex items-center space-x-0.5"
                            title="Marcar como leída"
                          >
                            <Check className="w-3 h-3" />
                            <span>Leída</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 text-center rounded-b-2xl">
            <span className="text-[10px] text-slate-400">
              Motor de Automatizaciones HIPOTECALY
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
