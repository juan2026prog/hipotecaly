import React from 'react';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { EmptyState } from '../../components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export const LenderMessagesPage: React.FC = () => {
  return (
    <LenderLayout title="Centro de Mensajes">
      <div className="space-y-6 text-left">
        <p className="text-xs sm:text-sm text-slate-muted">
          Comunicaciones directas y notificaciones operativas con el equipo de análisis y el prestatario.
        </p>

        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card">
          <EmptyState
            icon={MessageSquare}
            title="No tenés mensajes pendientes"
            description="Las consultas sobre expedientes activos, aclaraciones notariales o respuestas de solicitantes aparecerán centralizadas aquí."
          />
        </div>
      </div>
    </LenderLayout>
  );
};
