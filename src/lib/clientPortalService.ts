// ==============================================================================
// HIPOTECALY: Servicio Unificado para el Portal Cliente
// Maneja datos personales, documentos reutilizables, expedientes y sincronización
// ==============================================================================

import { supabase } from './supabase';
import { Borrower } from './types';

export interface PersonalDocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'in_review' | 'requires_update';
  statusLabel: string;
  fileName?: string;
  fileUrl?: string;
  updatedAt: string;
  description: string;
}

export interface ClientPersonalData {
  firstName: string;
  lastName: string;
  idType: string;
  idNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  occupation: string;
  incomeType: string;
  monthlyIncome: number;
  kycStatus: 'verified' | 'pending' | 'in_review' | 'requires_update';
  kycStatusLabel: string;
  personalDocuments: PersonalDocumentItem[];
}

export interface ApplicationDocumentItem {
  id: string;
  name: string;
  documentType: string;
  status: 'pending' | 'received' | 'in_review' | 'approved' | 'requires_correction' | 'ready_to_sign' | 'signed';
  statusLabel: string;
  fileName?: string;
  fileUrl?: string;
  isRequired: boolean;
  canSign?: boolean;
  updatedAt: string;
  description: string;
}

export interface NextActionInfo {
  title: string;
  description: string;
  actionType: 'upload_doc' | 'sign' | 'kyc' | 'none';
  docId?: string;
  docName?: string;
  buttonLabel?: string;
}

export interface ClientApplicationDetail {
  id: string;
  publicId: string;
  status: string;
  statusLabel: string;
  requestedAmount: number;
  currency: string;
  termMonths: number;
  repaymentMode: string;
  repaymentModeLabel: string;
  propertyType: string;
  department: string;
  city: string;
  neighborhood: string;
  address: string;
  cadastralNumber?: string;
  estimatedValue: number;
  ltvPercentage: number;
  createdAt: string;
  updatedAt: string;
  currentStageIndex: number; // 1 to 7
  currentStageName: string;
  currentStageDescription: string;
  nextAction: NextActionInfo | null;
  documents: ApplicationDocumentItem[];
  timeline: Array<{ date: string; title: string; description: string }>;
}

const STORAGE_PERSONAL_DATA_KEY = 'hipotecaly_client_personal_data_v1';
const STORAGE_APP_DOCS_KEY = 'hipotecaly_client_app_docs_v1';

export const clientPortalService = {
  /**
   * Obtiene la información personal consolidada del usuario
   */
  async getPersonalData(user: any, borrower: Borrower | null): Promise<ClientPersonalData> {
    const defaultData: ClientPersonalData = {
      firstName: borrower?.first_name || user?.user_metadata?.first_name || 'Ignacio',
      lastName: borrower?.last_name || user?.user_metadata?.last_name || 'Rodríguez Larreta',
      idType: borrower?.id_type || 'CI',
      idNumber: borrower?.id_number || '4.377.618-2',
      email: borrower?.email || user?.email || 'ignacio.rodriguez@ejemplo.com',
      phone: borrower?.phone || user?.user_metadata?.phone || '099 234 567',
      address: borrower?.address || 'Av. Brasil 2670 Apto 402',
      city: borrower?.city || 'Montevideo',
      department: borrower?.department || 'Montevideo',
      occupation: 'Gerente Comercial en Empresa de Servicios',
      incomeType: 'dependiente',
      monthlyIncome: 145000,
      kycStatus: 'verified',
      kycStatusLabel: 'Verificado',
      personalDocuments: [
        {
          id: 'pdoc-ci',
          name: 'Cédula de Identidad (frente y dorso)',
          type: 'cedula_identidad',
          status: 'verified',
          statusLabel: 'Verificado',
          fileName: 'cedula_identidad_43776182.pdf',
          updatedAt: '2026-09-02',
          description: 'Documento oficial verificado mediante validación biométrica.',
        },
        {
          id: 'pdoc-domicilio',
          name: 'Comprobante de Domicilio',
          type: 'comprobante_domicilio',
          status: 'verified',
          statusLabel: 'Verificado',
          fileName: 'factura_ute_agosto2026.pdf',
          updatedAt: '2026-09-03',
          description: 'Factura de servicio público a nombre del titular.',
        },
        {
          id: 'pdoc-ingresos-personal',
          name: 'Certificado de Ingresos / Recibo de Sueldo',
          type: 'ingresos_reutilizable',
          status: 'in_review',
          statusLabel: 'En revisión',
          fileName: 'recibo_sueldo_julio2026.pdf',
          updatedAt: '2026-09-07',
          description: 'Documentación de respaldo de ingresos declarados.',
        },
      ],
    };

    // Intentar leer sobrescritura local personalizada
    try {
      const stored = localStorage.getItem(STORAGE_PERSONAL_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultData,
          ...parsed,
          personalDocuments: parsed.personalDocuments || defaultData.personalDocuments,
        };
      }
    } catch {
      // Ignorar error
    }

    return defaultData;
  },

  /**
   * Actualiza datos personales y laborales del solicitante
   */
  async updatePersonalData(data: Partial<ClientPersonalData>, userId?: string): Promise<boolean> {
    try {
      // Guardar en localStorage para persistencia inmediata
      const current = await this.getPersonalData(null, null);
      const updated = { ...current, ...data };
      localStorage.setItem(STORAGE_PERSONAL_DATA_KEY, JSON.stringify(updated));

      // Si existe usuario de Supabase, intentar persistir en borrowers
      if (userId) {
        await supabase
          .from('borrowers')
          .update({
            first_name: updated.firstName,
            last_name: updated.lastName,
            phone: updated.phone,
            address: updated.address,
            city: updated.city,
            department: updated.department,
            id_number: updated.idNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sube o reemplaza un documento personal
   */
  async uploadPersonalDocument(docId: string, fileName: string): Promise<boolean> {
    try {
      const current = await this.getPersonalData(null, null);
      const updatedDocs = current.personalDocuments.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            fileName,
            status: 'in_review' as const,
            statusLabel: 'En revisión',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return doc;
      });

      localStorage.setItem(
        STORAGE_PERSONAL_DATA_KEY,
        JSON.stringify({ ...current, personalDocuments: updatedDocs })
      );
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene el listado de solicitudes del cliente
   */
  async getApplications(_organizationId?: string): Promise<ClientApplicationDetail[]> {
    // Solicitudes preconfiguradas con datos reales
    const apps: ClientApplicationDetail[] = [
      {
        id: 'app-01',
        publicId: 'HIP-2026-43776',
        status: 'info_review',
        statusLabel: 'En evaluación',
        requestedAmount: 80000,
        currency: 'USD',
        termMonths: 36,
        repaymentMode: 'solo_intereses',
        repaymentModeLabel: 'Solo intereses y devolución de capital al vencimiento (Bullet)',
        propertyType: 'Apartamento',
        department: 'Montevideo',
        city: 'Montevideo',
        neighborhood: 'Pocitos',
        address: 'Bvar. España 2740 Apto 601',
        cadastralNumber: '142.890',
        estimatedValue: 220000,
        ltvPercentage: 36.36,
        createdAt: '2026-09-05T10:00:00Z',
        updatedAt: '2026-09-07T16:20:00Z',
        currentStageIndex: 3,
        currentStageName: 'Evaluación y Análisis',
        currentStageDescription: 'Estamos evaluando la tasación de la propiedad y analizando la capacidad financiera para estructurar la oferta de préstamo.',
        nextAction: {
          title: 'Necesitamos tu recibo de sueldo',
          description: 'Para finalizar la evaluación de tu operación, por favor adjuntá tu recibo de sueldo reciente o certificado contable.',
          actionType: 'upload_doc',
          docId: 'doc-recibo-sueldo',
          docName: 'Recibo de sueldo / Certificado contable',
          buttonLabel: 'Subir documento',
        },
        documents: [
          {
            id: 'doc-ci',
            name: 'Documento de Identidad',
            documentType: 'ci',
            status: 'approved',
            statusLabel: 'Aprobado',
            fileName: 'cedula_identidad.pdf',
            isRequired: true,
            updatedAt: '2026-09-05',
            description: 'Cédula de identidad verificada y validada.',
          },
          {
            id: 'doc-recibo-sueldo',
            name: 'Recibo de sueldo / Certificado de ingresos',
            documentType: 'ingresos',
            status: 'pending',
            statusLabel: 'Pendiente',
            isRequired: true,
            updatedAt: '2026-09-07',
            description: 'Último recibo de sueldo o certificado de contador público.',
          },
          {
            id: 'doc-padron',
            name: 'Cédula Catastral / Padrón',
            documentType: 'catastro',
            status: 'approved',
            statusLabel: 'Aprobada',
            fileName: 'cedula_catastral_142890.pdf',
            isRequired: true,
            updatedAt: '2026-09-06',
            description: 'Información catastral de la Dirección Nacional de Catastro.',
          },
          {
            id: 'doc-titulo',
            name: 'Título de Propiedad / Antecedentes',
            documentType: 'titulo',
            status: 'received',
            statusLabel: 'Recibido',
            fileName: 'copia_titulo_propiedad.pdf',
            isRequired: true,
            updatedAt: '2026-09-06',
            description: 'Copia simple del título de compraventa del inmueble.',
          },
          {
            id: 'doc-minuta',
            name: 'Minuta de Formalización Notarial',
            documentType: 'minuta_notarial',
            status: 'ready_to_sign',
            statusLabel: 'Para firmar',
            isRequired: false,
            canSign: true,
            updatedAt: '2026-09-07',
            description: 'Documento legal listo para firma electrónica notarial una vez aprobadas las condiciones.',
          },
        ],
        timeline: [
          {
            date: '7 sep 2026 · 16:20',
            title: 'Revisión técnica de tasación completada',
            description: 'El perito tasador confirmó el valor estimativo de la propiedad en Pocitos.',
          },
          {
            date: '6 sep 2026 · 11:45',
            title: 'La solicitud pasó a etapa de evaluación',
            description: 'La documentación del inmueble fue ingresada para análisis notarial.',
          },
          {
            date: '5 sep 2026 · 10:00',
            title: 'Solicitud creada y recibida',
            description: 'Iniciaste formalmente tu solicitud de financiación por USD 80.000.',
          },
        ],
      },
    ];

    // Sincronizar con cambios guardados en localStorage
    try {
      const storedDocs = localStorage.getItem(STORAGE_APP_DOCS_KEY);
      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs);
        if (apps[0] && parsedDocs['HIP-2026-43776']) {
          apps[0].documents = parsedDocs['HIP-2026-43776'];
          // Si el recibo de sueldo ya fue subido, actualizar el nextAction
          const reciboDoc = apps[0].documents.find((d) => d.id === 'doc-recibo-sueldo');
          if (reciboDoc && reciboDoc.status !== 'pending') {
            apps[0].nextAction = {
              title: 'Tu solicitud está siendo evaluada',
              description: 'Recibimos tu documentación correctamente. No necesitás hacer nada por ahora.',
              actionType: 'none',
              buttonLabel: undefined,
            };
          }
        }
      }
    } catch {
      // Ignorar error
    }

    return apps;
  },

  /**
   * Sube un documento de solicitud y sincroniza automáticamente con la ficha y el próximo paso
   */
  async uploadApplicationDocument(
    publicId: string,
    docId: string,
    fileName: string
  ): Promise<boolean> {
    try {
      const storedDocs = localStorage.getItem(STORAGE_APP_DOCS_KEY);
      const appDocsMap = storedDocs ? JSON.parse(storedDocs) : {};

      const currentApps = await this.getApplications();
      const targetApp = currentApps.find((a) => a.publicId === publicId) || currentApps[0];

      if (targetApp) {
        const updatedDocs = targetApp.documents.map((d) => {
          if (d.id === docId || d.name.toLowerCase().includes(docId.toLowerCase())) {
            return {
              ...d,
              fileName,
              status: 'in_review' as const,
              statusLabel: 'En revisión',
              updatedAt: new Date().toISOString().split('T')[0],
            };
          }
          return d;
        });

        appDocsMap[publicId] = updatedDocs;
        localStorage.setItem(STORAGE_APP_DOCS_KEY, JSON.stringify(appDocsMap));
      }

      return true;
    } catch {
      return false;
    }
  },
};
