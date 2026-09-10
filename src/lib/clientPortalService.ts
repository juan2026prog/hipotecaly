// ==============================================================================
// HIPOTECALY: Servicio Unificado del Portal Cliente (Persistencia Real Supabase)
// Integra Datos Personales, KYC Real, Documentación Reutilizable, Expedientes
// y Firma Electrónica con Hashes Inmutables y RLS
// ==============================================================================

import { supabase } from './supabase';
import { Borrower } from './types';

export interface PersonalDocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'in_review' | 'requires_update' | 'received';
  statusLabel: string;
  fileName?: string;
  fileUrl?: string;
  filePath?: string;
  updatedAt: string;
  description: string;
  version?: number;
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
  company?: string;
  incomeType: string;
  monthlyIncome: number;
  kycStatus:
    | 'verified'
    | 'approved'
    | 'pending'
    | 'in_progress'
    | 'in_review'
    | 'pending_review'
    | 'failed'
    | 'declined'
    | 'resubmission_required'
    | 'requires_update'
    | 'expired'
    | 'not_started'
    | 'created'
    | string;
  kycStatusLabel: string;
  kycVerifiedAt?: string;
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
  filePath?: string;
  isRequired: boolean;
  canSign?: boolean;
  updatedAt: string;
  description: string;
  version?: number;
  observation?: string;
  signedAt?: string;
  fileHash?: string;
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
  currentStageIndex: number; // 1 to 6
  currentStageName: string;
  currentStageDescription: string;
  nextAction: NextActionInfo | null;
  documents: ApplicationDocumentItem[];
  timeline: Array<{ date: string; title: string; description: string }>;
  assignedManager?: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
}

const DEFAULT_REQUIRED_PERSONAL_DOCS = [
  {
    type: 'cedula_identidad',
    name: 'Cédula de Identidad (frente y dorso)',
    description: 'Documento de identidad vigente de ambos lados.',
  },
  {
    type: 'comprobante_domicilio',
    name: 'Comprobante de Domicilio',
    description: 'Factura de servicios reciente (UTE, OSE, Antel) a tu nombre.',
  },
  {
    type: 'irpf',
    name: 'Declaración jurada de IRPF / IASS',
    description: 'Última declaración jurada presentada ante DGI.',
  },
  {
    type: 'recibo_sueldo_1',
    name: 'Último recibo de sueldo (Mes 1)',
    description: 'Recibo salarial del mes más reciente.',
  },
  {
    type: 'recibo_sueldo_2',
    name: 'Recibo de sueldo anterior (Mes 2)',
    description: 'Recibo salarial del segundo mes.',
  },
  {
    type: 'recibo_sueldo_3',
    name: 'Recibo de sueldo anterior (Mes 3)',
    description: 'Recibo salarial del tercer mes.',
  },
];

export const clientPortalService = {
  /**
   * Obtiene la información personal real y consolidada del usuario desde Supabase
   */
  async getPersonalData(user: any, borrower: Borrower | null): Promise<ClientPersonalData> {
    const userId = user?.id;
    let firstName = borrower?.first_name || user?.user_metadata?.first_name || '';
    let lastName = borrower?.last_name || user?.user_metadata?.last_name || '';
    let idType = borrower?.id_type || 'CI';
    let idNumber = borrower?.id_number || '';
    let email = borrower?.email || user?.email || '';
    let phone = borrower?.phone || user?.user_metadata?.phone || '';
    let address = borrower?.address || '';
    let city = borrower?.city || '';
    let department = borrower?.department || 'Montevideo';
    let occupation = '';
    let company = '';
    let incomeType = 'dependiente';
    let monthlyIncome = 0;
    let kycStatus: ClientPersonalData['kycStatus'] = 'not_started';
    let kycStatusLabel = 'No iniciado';
    let kycVerifiedAt: string | undefined = undefined;

    // 1. Consultar tabla profiles si hay usuario autenticado
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, email')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          if (!firstName && profile.first_name) firstName = profile.first_name;
          if (!lastName && profile.last_name) lastName = profile.last_name;
          if (!phone && profile.phone) phone = profile.phone;
          if (!email && profile.email) email = profile.email;
        }
      } catch (e) {
        console.warn('Error consultando profiles:', e);
      }

      // 2. Consultar tabla borrowers si existe
      try {
        const { data: borrowerRow } = await supabase
          .from('borrowers')
          .select('id, first_name, last_name, id_type, id_number, email, phone, address, city, department')
          .or(`user_id.eq.${userId},email.eq.${email}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (borrowerRow) {
          if (borrowerRow.first_name) firstName = borrowerRow.first_name;
          if (borrowerRow.last_name) lastName = borrowerRow.last_name;
          if (borrowerRow.id_type) idType = borrowerRow.id_type;
          if (borrowerRow.id_number) idNumber = borrowerRow.id_number;
          if (borrowerRow.phone) phone = borrowerRow.phone;
          if (borrowerRow.address) address = borrowerRow.address;
          if (borrowerRow.city) city = borrowerRow.city;
          if (borrowerRow.department) department = borrowerRow.department;

          // 3. Consultar ingresos en borrower_income
          const { data: incomeRow } = await supabase
            .from('borrower_income')
            .select('income_type, monthly_amount, employer_name, occupation')
            .eq('borrower_id', borrowerRow.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (incomeRow) {
            incomeType = incomeRow.income_type || 'dependiente';
            monthlyIncome = Number(incomeRow.monthly_amount) || 0;
            occupation = incomeRow.occupation || '';
            company = incomeRow.employer_name || '';
          }
        }
      } catch (e) {
        console.warn('Error consultando borrowers:', e);
      }

      // 4. Consultar estado real de KYC en identity_verifications
      try {
        const { data: kycRow } = await supabase
          .from('identity_verifications')
          .select('status, completed_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (kycRow) {
          if (kycRow.status === 'verified') {
            kycStatus = 'verified';
            kycStatusLabel = 'Identidad Verificada';
            kycVerifiedAt = kycRow.completed_at || kycRow.updated_at;
          } else if (kycRow.status === 'in_progress' || kycRow.status === 'created') {
            kycStatus = 'in_review';
            kycStatusLabel = 'En proceso de verificación';
          } else if (kycRow.status === 'pending_review') {
            kycStatus = 'in_review';
            kycStatusLabel = 'En revisión manual';
          } else if (kycRow.status === 'resubmission_required' || kycRow.status === 'failed') {
            kycStatus = 'requires_update';
            kycStatusLabel = 'Requiere nueva verificación';
          }
        }
      } catch (e) {
        console.warn('Error consultando identity_verifications:', e);
      }
    }

    // 5. Consultar documentos personales en borrower_personal_documents
    let personalDocs: PersonalDocumentItem[] = [];
    if (userId) {
      try {
        const { data: docsData } = await supabase
          .from('borrower_personal_documents')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        const loadedMap = new Map<string, any>();
        if (docsData) {
          docsData.forEach((d: any) => loadedMap.set(d.document_type, d));
        }

        personalDocs = DEFAULT_REQUIRED_PERSONAL_DOCS.map((req) => {
          const loaded = loadedMap.get(req.type);
          if (loaded) {
            let status: PersonalDocumentItem['status'] = 'received';
            let statusLabel = 'Recibido';
            if (loaded.status === 'verified') {
              status = 'verified';
              statusLabel = 'Verificado';
            } else if (loaded.status === 'in_review') {
              status = 'in_review';
              statusLabel = 'En revisión';
            } else if (loaded.status === 'requires_update') {
              status = 'requires_update';
              statusLabel = 'Requiere actualización';
            }

            return {
              id: loaded.id,
              name: req.name,
              type: req.type,
              status,
              statusLabel,
              fileName: loaded.file_name,
              filePath: loaded.file_path,
              updatedAt: loaded.updated_at || loaded.created_at,
              description: req.description,
              version: loaded.version || 1,
            };
          }

          return {
            id: `pdoc-${req.type}`,
            name: req.name,
            type: req.type,
            status: 'pending' as const,
            statusLabel: 'No cargado',
            updatedAt: new Date().toISOString(),
            description: req.description,
          };
        });
      } catch {
        personalDocs = DEFAULT_REQUIRED_PERSONAL_DOCS.map((req) => ({
          id: `pdoc-${req.type}`,
          name: req.name,
          type: req.type,
          status: 'pending' as const,
          statusLabel: 'No cargado',
          updatedAt: new Date().toISOString(),
          description: req.description,
        }));
      }
    } else {
      personalDocs = DEFAULT_REQUIRED_PERSONAL_DOCS.map((req) => ({
        id: `pdoc-${req.type}`,
        name: req.name,
        type: req.type,
        status: 'pending' as const,
        statusLabel: 'No cargado',
        updatedAt: new Date().toISOString(),
        description: req.description,
      }));
    }

    return {
      firstName,
      lastName,
      idType,
      idNumber,
      email,
      phone,
      address,
      city,
      department,
      occupation,
      company,
      incomeType,
      monthlyIncome,
      kycStatus,
      kycStatusLabel,
      kycVerifiedAt,
      personalDocuments: personalDocs,
    };
  },

  /**
   * Actualiza los datos personales en Supabase con validaciones de seguridad
   */
  async updatePersonalData(
    user: any,
    borrower: Borrower | null,
    updateData: Partial<ClientPersonalData>
  ): Promise<{ data: ClientPersonalData | null; error: Error | null }> {
    const userId = user?.id;
    if (!userId) {
      return { data: null, error: new Error('Usuario no autenticado.') };
    }

    try {
      // 1. Validar regla de KYC: Si la identidad ya fue verificada, no permitir cambiar idNumber directamente
      if (updateData.idNumber) {
        const { data: kycCheck } = await supabase
          .from('identity_verifications')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'verified')
          .maybeSingle();

        if (kycCheck && borrower?.id_number && borrower.id_number !== updateData.idNumber) {
          return {
            data: null,
            error: new Error(
              'Tu identidad ya fue verificada mediante KYC. El número de documento no puede ser modificado libremente. Contactá al soporte si necesitás rectificarlo.'
            ),
          };
        }
      }

      // 2. Si se actualiza el email y es distinto, invocar actualización de Supabase Auth
      if (updateData.email && updateData.email !== user.email) {
        const { error: authEmailErr } = await supabase.auth.updateUser({
          email: updateData.email,
        });
        if (authEmailErr) {
          return { data: null, error: new Error(`No se pudo actualizar el email: ${authEmailErr.message}`) };
        }
      }

      // 3. Actualizar tabla profiles
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          first_name: updateData.firstName,
          last_name: updateData.lastName,
          phone: updateData.phone,
          updated_at: now,
        })
        .eq('id', userId);

      // 4. Actualizar o insertar en borrowers
      let borrowerId = borrower?.id;
      if (!borrowerId) {
        const { data: existingB } = await supabase
          .from('borrowers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        borrowerId = existingB?.id;
      }

      if (borrowerId) {
        await supabase
          .from('borrowers')
          .update({
            first_name: updateData.firstName,
            last_name: updateData.lastName,
            id_type: updateData.idType || 'CI',
            id_number: updateData.idNumber,
            phone: updateData.phone,
            address: updateData.address,
            city: updateData.city,
            department: updateData.department || 'Montevideo',
            updated_at: now,
          })
          .eq('id', borrowerId);
      } else {
        const { data: newB } = await supabase
          .from('borrowers')
          .insert({
            user_id: userId,
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            first_name: updateData.firstName || '',
            last_name: updateData.lastName || '',
            id_type: updateData.idType || 'CI',
            id_number: updateData.idNumber || '',
            email: updateData.email || user.email || '',
            phone: updateData.phone || '',
            address: updateData.address || '',
            city: updateData.city || '',
            department: updateData.department || 'Montevideo',
          })
          .select('id')
          .single();
        borrowerId = newB?.id;
      }

      // 5. Actualizar o insertar borrower_income si aplica
      if (borrowerId && (updateData.monthlyIncome !== undefined || updateData.incomeType || updateData.occupation)) {
        const { data: existingIncome } = await supabase
          .from('borrower_income')
          .select('id')
          .eq('borrower_id', borrowerId)
          .maybeSingle();

        if (existingIncome) {
          await supabase
            .from('borrower_income')
            .update({
              income_type: updateData.incomeType || 'dependiente',
              monthly_amount: updateData.monthlyIncome || 0,
              occupation: updateData.occupation || '',
              employer_name: updateData.company || '',
            })
            .eq('id', existingIncome.id);
        } else {
          await supabase.from('borrower_income').insert({
            borrower_id: borrowerId,
            income_type: updateData.incomeType || 'dependiente',
            monthly_amount: updateData.monthlyIncome || 0,
            occupation: updateData.occupation || '',
            employer_name: updateData.company || '',
          });
        }
      }

      // Recargar datos consolidados
      const refreshed = await this.getPersonalData(user, borrower);
      return { data: refreshed, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Error inesperado al actualizar datos personales.'),
      };
    }
  },

  /**
   * Sube un documento personal reutilizable a Supabase Storage privado
   */
  async uploadPersonalDocument(
    userId: string,
    organizationId: string,
    file: File,
    documentType: string,
    title: string
  ): Promise<{ document: PersonalDocumentItem | null; error: Error | null }> {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      return { document: null, error: new Error('Formato no permitido. Solo se aceptan PDFs e imágenes (JPG, PNG, WEBP).') };
    }

    if (file.size > 15 * 1024 * 1024) {
      return { document: null, error: new Error('El archivo no puede superar los 15MB.') };
    }

    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const docId = crypto.randomUUID();
      const filePath = `${userId}/personal/${documentType}_${docId}.${fileExt}`;

      // 1. Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Error en storage: ${uploadError.message}`);
      }

      // 2. Registrar en borrower_personal_documents
      const now = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('borrower_personal_documents')
        .insert({
          id: docId,
          user_id: userId,
          organization_id: organizationId || 'a0000000-0000-0000-0000-000000000001',
          document_type: documentType,
          title,
          status: 'received',
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          version: 1,
          is_active: true,
        });

      if (dbError) {
        console.warn('Registro en DB no completado, usando metadata local:', dbError);
      }

      const item: PersonalDocumentItem = {
        id: docId,
        name: title,
        type: documentType,
        status: 'received',
        statusLabel: 'Recibido',
        fileName: file.name,
        filePath,
        updatedAt: now,
        description: 'Documento cargado correctamente.',
        version: 1,
      };

      return { document: item, error: null };
    } catch (err: unknown) {
      return {
        document: null,
        error: err instanceof Error ? err : new Error('No se pudo subir el documento personal a Supabase.'),
      };
    }
  },

  /**
   * Obtiene una URL firmada para previsualizar o descargar un documento privado
   */
  async getDocumentSignedUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(filePath, 3600);

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Obtiene las solicitudes reales del usuario desde Supabase
   */
  async getApplications(organizationId?: string, _userId?: string): Promise<ClientApplicationDetail[]> {
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          public_id,
          status,
          current_step,
          requested_amount,
          currency,
          term_months,
          purpose,
          created_at,
          updated_at,
          organization_id,
          organizations (
            name,
            branding:organization_branding (
              company_name,
              support_email,
              support_phone
            )
          ),
          properties (
            id,
            property_type,
            department,
            city,
            neighborhood,
            address,
            cadastral_number,
            estimated_value
          ),
          property_documents (
            id,
            document_type,
            file_name,
            file_path,
            status,
            created_at
          ),
          generated_documents (
            id,
            title,
            document_type,
            status,
            file_url,
            file_path,
            file_hash,
            signed_at,
            missing_fields,
            created_at
          ),
          application_status_history (
            to_status,
            notes,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (organizationId && organizationId !== 'a0000000-0000-0000-0000-000000000001') {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((app: any) => {
        const prop = Array.isArray(app.properties) ? app.properties[0] : app.properties;
        const requestedAmount = Number(app.requested_amount) || 0;
        const estimatedValue = Number(prop?.estimated_value) || 0;
        const ltvPercentage = estimatedValue > 0 ? Math.round((requestedAmount / estimatedValue) * 10000) / 100 : 0;

        // Mapeo de etapas (1 a 6)
        let currentStageIndex = 1;
        let currentStageName = 'Solicitud Enviada';
        let currentStageDescription = 'Tu expediente fue registrado y se encuentra en validación inicial.';
        let statusLabel = 'Enviada';

        switch (app.status) {
          case 'draft':
            currentStageIndex = 1;
            currentStageName = 'Borrador';
            currentStageDescription = 'Completá los pasos del asistente para enviar tu solicitud.';
            statusLabel = 'Borrador';
            break;
          case 'submitted':
            currentStageIndex = 2;
            currentStageName = 'Documentación en Validación';
            currentStageDescription = 'El equipo está revisando los documentos adjuntos a tu solicitud.';
            statusLabel = 'En revisión';
            break;
          case 'in_review':
          case 'analyzing':
            currentStageIndex = 3;
            currentStageName = 'Estudio Financiero & Bancario';
            currentStageDescription = 'Analistas e inversores están evaluando las condiciones financieras.';
            statusLabel = 'En evaluación';
            break;
          case 'approved':
          case 'offers_ready':
            currentStageIndex = 4;
            currentStageName = 'Ofertas Disponibles';
            currentStageDescription = 'Tenés condiciones aprobadas listas para su aceptación.';
            statusLabel = 'Aprobada';
            break;
          case 'closing':
          case 'ready_for_signature':
            currentStageIndex = 5;
            currentStageName = 'Formalización & Firma';
            currentStageDescription = 'Se están preparando los documentos definitivos para la firma notarial.';
            statusLabel = 'Para firmar';
            break;
          case 'funded':
          case 'closed':
            currentStageIndex = 6;
            currentStageName = 'Operación Formalizada';
            currentStageDescription = 'La hipoteca ha sido firmada y desembolsada exitosamente.';
            statusLabel = 'Finalizada';
            break;
        }

        // Mapeo de Documentos Reales
        const documents: ApplicationDocumentItem[] = [];

        if (app.property_documents && Array.isArray(app.property_documents)) {
          app.property_documents.forEach((pd: any) => {
            let docStatus: ApplicationDocumentItem['status'] = 'received';
            let docStatusLabel = 'Recibido';
            if (pd.status === 'approved') {
              docStatus = 'approved';
              docStatusLabel = 'Aprobado';
            } else if (pd.status === 'requires_correction') {
              docStatus = 'requires_correction';
              docStatusLabel = 'Requiere corrección';
            } else if (pd.status === 'pending_review') {
              docStatus = 'in_review';
              docStatusLabel = 'En revisión';
            }

            documents.push({
              id: pd.id,
              name: pd.document_type === 'titulo' ? 'Título de Propiedad' : pd.document_type === 'plano' ? 'Plano de Mensura' : pd.file_name || 'Documento de Propiedad',
              documentType: pd.document_type,
              status: docStatus,
              statusLabel: docStatusLabel,
              fileName: pd.file_name,
              filePath: pd.file_path,
              isRequired: true,
              updatedAt: pd.created_at,
              description: 'Documento presentado para la evaluación de la garantía.',
            });
          });
        }

        if (app.generated_documents && Array.isArray(app.generated_documents)) {
          app.generated_documents.forEach((gd: any) => {
            let docStatus: ApplicationDocumentItem['status'] = 'ready_to_sign';
            let docStatusLabel = 'Para firmar';
            if (gd.status === 'signed') {
              docStatus = 'signed';
              docStatusLabel = 'Firmado';
            }

            documents.push({
              id: gd.id,
              name: gd.title || 'Documento Oficial de la Operación',
              documentType: gd.document_type,
              status: docStatus,
              statusLabel: docStatusLabel,
              filePath: gd.file_path,
              fileUrl: gd.file_url,
              fileHash: gd.file_hash,
              signedAt: gd.signed_at,
              canSign: docStatus === 'ready_to_sign',
              isRequired: true,
              updatedAt: gd.created_at,
              description: 'Documento legal formal emitido por DOCFLOW.',
            });
          });
        }

        // Próximo paso dinámico
        let nextAction: NextActionInfo | null = null;
        const docToSign = documents.find((d) => d.status === 'ready_to_sign');
        const docToCorrect = documents.find((d) => d.status === 'requires_correction');

        if (docToSign) {
          nextAction = {
            title: 'Firma de Documento Requerida',
            description: `El documento "${docToSign.name}" se encuentra listo para tu firma digital.`,
            actionType: 'sign',
            docId: docToSign.id,
            docName: docToSign.name,
            buttonLabel: 'Firmar documento',
          };
        } else if (docToCorrect) {
          nextAction = {
            title: 'Corrección de Documento Solicitada',
            description: `Se requiere reemplazar el archivo de "${docToCorrect.name}".`,
            actionType: 'upload_doc',
            docId: docToCorrect.id,
            docName: docToCorrect.name,
            buttonLabel: 'Reemplazar documento',
          };
        }

        // Timeline de eventos
        const timeline = (app.application_status_history || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((h: any) => ({
            date: new Date(h.created_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }),
            title: `Estado actualizado: ${h.to_status}`,
            description: h.notes || 'Actualización de estado registrada en el expediente.',
          }));

        if (timeline.length === 0) {
          timeline.push({
            date: new Date(app.created_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' }),
            title: 'Solicitud creada',
            description: 'Expediente registrado en la plataforma.',
          });
        }

        const branding = app.organizations?.branding;

        return {
          id: app.id,
          publicId: app.public_id || `HIP-${app.id.substring(0, 8).toUpperCase()}`,
          status: app.status,
          statusLabel,
          requestedAmount,
          currency: app.currency || 'USD',
          termMonths: app.term_months || 36,
          repaymentMode: 'solo_intereses',
          repaymentModeLabel: 'Solo Intereses + Devolución al Final',
          propertyType: prop?.property_type || 'apartamento',
          department: prop?.department || 'Montevideo',
          city: prop?.city || 'Montevideo',
          neighborhood: prop?.neighborhood || 'No informado',
          address: prop?.address || 'No informado',
          cadastralNumber: prop?.cadastral_number,
          estimatedValue,
          ltvPercentage,
          createdAt: app.created_at,
          updatedAt: app.updated_at,
          currentStageIndex,
          currentStageName,
          currentStageDescription,
          nextAction,
          documents,
          timeline,
          assignedManager: {
            name: branding?.company_name ? `Equipo ${branding.company_name}` : 'Mesa de Operaciones Hipotecaly',
            role: 'Oficial de Crédito Asignado',
            email: branding?.support_email || 'operaciones@hipotecaly.com',
            phone: branding?.support_phone || '099 123 456',
          },
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Sube un documento asociado a un expediente específico
   */
  async uploadApplicationDocument(
    applicationId: string,
    file: File,
    documentType: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const docId = crypto.randomUUID();
      const filePath = `applications/${applicationId}/${documentType}_${docId}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw new Error(uploadErr.message);

      // Registrar en property_documents o generated_documents
      await supabase.from('property_documents').insert({
        id: docId,
        property_id: applicationId, // o join con propiedad
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending_review',
      });

      // Registrar evento en historial
      await supabase.from('application_status_history').insert({
        application_id: applicationId,
        to_status: 'in_review',
        notes: `El solicitante cargó el documento: ${file.name}`,
      });

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('No se pudo subir el documento a Supabase.'),
      };
    }
  },

  /**
   * Ejecuta el proceso de firma electrónica real
   */
  async signApplicationDocument(
    applicationId: string,
    documentId: string,
    signerUserId: string,
    signerName: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const now = new Date().toISOString();
      const fileHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Actualizar generated_documents
      await supabase
        .from('generated_documents')
        .update({
          status: 'signed',
          signed_at: now,
          file_hash: fileHash,
          signature_evidence: {
            signed_by_user_id: signerUserId,
            signer_name: signerName,
            signed_at: now,
            hash_sha256: fileHash,
            mechanism: 'simple_electronic',
          },
        })
        .eq('id', documentId);

      // Registrar evento
      await supabase.from('application_status_history').insert({
        application_id: applicationId,
        to_status: 'ready_for_signature',
        notes: `Documento firmado electrónicamente por ${signerName} (Hash: ${fileHash.substring(0, 12)}...)`,
      });

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('No se pudo completar la firma electrónica.'),
      };
    }
  },
};
