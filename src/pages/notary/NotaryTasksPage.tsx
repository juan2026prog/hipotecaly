import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  Clock,
  Filter,
} from 'lucide-react';

interface TaskItem {
  id: string;
  caseId: string;
  applicant: string;
  title: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'completed';
}

export const NotaryTasksPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      caseId: 'HIP-2026-00158',
      applicant: 'Martín López Arispe',
      title: 'Solicitar ampliación de certificado registral de Actos Personales',
      category: 'Registros',
      urgency: 'high',
      dueDate: 'Hoy',
      status: 'pending',
    },
    {
      id: 'task-2',
      caseId: 'HIP-2026-00144',
      applicant: 'Ana Pereira Ramos',
      title: 'Revisión final de borrador de escritura de hipoteca (v3)',
      category: 'Escrituración',
      urgency: 'medium',
      dueDate: 'Mañana',
      status: 'pending',
    },
    {
      id: 'task-3',
      caseId: 'HIP-2026-00152',
      applicant: 'Lucía Vázquez Bell',
      title: 'Validar testimonio de declaratoria de herederos en sucesión',
      category: 'Títulos',
      urgency: 'high',
      dueDate: '12 Sep 2026',
      status: 'pending',
    },
    {
      id: 'task-4',
      caseId: 'HIP-2026-00160',
      applicant: 'Gonzalo Fernández Silva',
      title: 'Cotejar cédula catastral y plano de mensura en DNC',
      category: 'Catastro',
      urgency: 'low',
      dueDate: '16 Sep 2026',
      status: 'pending',
    },
    {
      id: 'task-5',
      caseId: 'HIP-2026-00131',
      applicant: 'Carlos Méndez Fontana',
      title: 'Certificado de DGI / Primaria cotejado en legajo',
      category: 'Tributos',
      urgency: 'low',
      dueDate: '04 Sep 2026',
      status: 'completed',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const toggleTask = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
      )
    );
  };

  const filtered = tasks.filter((t) => (filter === 'all' ? true : t.status === filter));

  return (
    <NotaryLayout title="Mis Tareas Notariales">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Control Operativo de Tareas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Seguimiento de certificados, revisión de borradores y levantamiento de observaciones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>{tasks.filter((t) => t.status === 'pending').length} tareas pendientes</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center space-x-2 text-xs font-bold">
        <span className="text-slate-400 px-2 flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1" /> Estado:
        </span>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === f ? 'bg-teal-500 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Completadas'}
          </button>
        ))}
      </div>

      {/* Lista de Tareas */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
        {filtered.map((task) => {
          const isDone = task.status === 'completed';
          return (
            <div
              key={task.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                isDone ? 'bg-slate-50/50 opacity-60' : ''
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {task.caseId}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold truncate">
                      {task.applicant}
                    </span>
                  </div>
                  <div className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>Área: {task.category}</span>
                    <span>·</span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>Vencimiento: {task.dueDate}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                <Link
                  to={`${basePath}/expedientes/e0000000-0000-0000-0000-000000000001`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Ver expediente
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </NotaryLayout>
  );
};
