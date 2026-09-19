import * as XLSX from 'xlsx';

export interface ParsedInvestorRow {
  nombre: string;
  tipo?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  capital_disponible?: number;
  moneda?: string;
  monto_min?: number;
  monto_max?: number;
  tasa_min?: number;
  ltv_max?: number;
  plazo_min?: number;
  plazo_max?: number;
  departamentos?: string[];
  tipos_inmueble?: string[];
  modalidades?: string[];
  notas?: string;
  _status?: 'valid' | 'error' | 'possible_duplicate';
  _errors?: string[];
  _duplicateReason?: string;
  _raw?: Record<string, any>;
}

// Normalizador de claves para mapeo inteligente de columnas
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '_');
}

export function parseFileContent(data: ArrayBuffer | Uint8Array, _fileName?: string): Record<string, any>[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
}

export function mapRawRowsToInvestors(
  rows: Record<string, any>[],
  existingLenders: Array<{ contact_email?: string; contact_phone?: string; name: string }> = []
): {
  validRows: ParsedInvestorRow[];
  errorRows: ParsedInvestorRow[];
  duplicateRows: ParsedInvestorRow[];
  allRows: ParsedInvestorRow[];
} {
  const allRows: ParsedInvestorRow[] = [];
  const validRows: ParsedInvestorRow[] = [];
  const errorRows: ParsedInvestorRow[] = [];
  const duplicateRows: ParsedInvestorRow[] = [];

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (const row of rows) {
    const normalizedRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalizedRow[normalizeKey(key)] = typeof val === 'string' ? val.trim() : val;
    }

    const nombre =
      normalizedRow.nombre ||
      normalizedRow.denominacion ||
      normalizedRow.inversor ||
      normalizedRow.name ||
      normalizedRow.razon_social ||
      '';

    const email = (
      normalizedRow.email ||
      normalizedRow.correo ||
      normalizedRow.correo_electronico ||
      normalizedRow.mail ||
      ''
    ).toLowerCase();

    const telefono = String(
      normalizedRow.telefono ||
      normalizedRow.celular ||
      normalizedRow.phone ||
      normalizedRow.tel ||
      ''
    );

    const tipo =
      normalizedRow.tipo ||
      normalizedRow.tipo_inversor ||
      normalizedRow.tipo_de_inversor ||
      'Persona';

    const contacto =
      normalizedRow.contacto ||
      normalizedRow.persona_de_contacto ||
      normalizedRow.persona_contacto ||
      '';

    const parseNum = (v: any) => {
      if (v === undefined || v === null || v === '') return undefined;
      const clean = String(v).replace(/[^0-9.-]+/g, '');
      const n = Number(clean);
      return isNaN(n) ? undefined : n;
    };

    const capital_disponible = parseNum(
      normalizedRow.capital_disponible ||
      normalizedRow.capital ||
      normalizedRow.monto_disponible ||
      normalizedRow.capital_declarado
    );

    const moneda = (
      normalizedRow.moneda ||
      normalizedRow.currency ||
      'USD'
    ).toUpperCase();

    const monto_min = parseNum(
      normalizedRow.monto_min ||
      normalizedRow.monto_minimo ||
      normalizedRow.min_loan ||
      normalizedRow.min_amount
    );

    const monto_max = parseNum(
      normalizedRow.monto_max ||
      normalizedRow.monto_maximo ||
      normalizedRow.max_loan ||
      normalizedRow.max_amount
    );

    const tasa_min = parseNum(
      normalizedRow.tasa_min ||
      normalizedRow.tasa_minima ||
      normalizedRow.tasa ||
      normalizedRow.min_rate
    );

    let ltv_max = parseNum(
      normalizedRow.ltv_max ||
      normalizedRow.ltv_maximo ||
      normalizedRow.ltv ||
      normalizedRow.max_ltv ||
      normalizedRow.financiacion_maxima
    );
    if (ltv_max !== undefined && ltv_max > 1 && ltv_max <= 100) {
      ltv_max = ltv_max / 100; // Normalizar porcentaje ej. 40 -> 0.40
    }

    const plazo_min = parseNum(
      normalizedRow.plazo_min ||
      normalizedRow.plazo_minimo ||
      normalizedRow.min_term ||
      normalizedRow.min_term_months
    );

    const plazo_max = parseNum(
      normalizedRow.plazo_max ||
      normalizedRow.plazo_maximo ||
      normalizedRow.max_term ||
      normalizedRow.max_term_months
    );

    const parseArray = (v: any) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v;
      return String(v)
        .split(/[,;|]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const departamentos = parseArray(
      normalizedRow.departamentos ||
      normalizedRow.zonas ||
      normalizedRow.departamentos_aceptados
    );

    const tipos_inmueble = parseArray(
      normalizedRow.tipos_inmueble ||
      normalizedRow.inmuebles ||
      normalizedRow.garantias_aceptadas ||
      normalizedRow.garantias ||
      normalizedRow.tipos_de_inmueble_aceptados
    );

    const modalidades = parseArray(
      normalizedRow.modalidades ||
      normalizedRow.modalidades_aceptadas
    );

    const notas =
      normalizedRow.notas ||
      normalizedRow.observaciones ||
      normalizedRow.observaciones_internas ||
      normalizedRow.notes ||
      '';

    const errors: string[] = [];
    if (!nombre) {
      errors.push('El nombre o denominación es obligatorio');
    }

    let duplicateReason: string | undefined;
    if (email) {
      if (seenEmails.has(email)) {
        duplicateReason = `Email duplicado en el mismo archivo (${email})`;
      } else {
        const matchDb = existingLenders.find((l) => l.contact_email?.toLowerCase() === email);
        if (matchDb) {
          duplicateReason = `Email ya registrado en la organización: ${matchDb.name} (${email})`;
        }
      }
      seenEmails.add(email);
    }

    if (!duplicateReason && telefono && telefono.length > 6) {
      if (seenPhones.has(telefono)) {
        duplicateReason = `Teléfono duplicado en el mismo archivo (${telefono})`;
      } else {
        const matchDb = existingLenders.find((l) => l.contact_phone && l.contact_phone.includes(telefono));
        if (matchDb) {
          duplicateReason = `Teléfono ya registrado en la organización: ${matchDb.name} (${telefono})`;
        }
      }
      seenPhones.add(telefono);
    }

    const parsedRow: ParsedInvestorRow = {
      nombre,
      tipo,
      contacto,
      email,
      telefono,
      capital_disponible,
      moneda,
      monto_min,
      monto_max,
      tasa_min,
      ltv_max,
      plazo_min,
      plazo_max,
      departamentos,
      tipos_inmueble,
      modalidades,
      notas,
      _raw: row,
      _errors: errors,
      _duplicateReason: duplicateReason,
      _status: errors.length > 0 ? 'error' : duplicateReason ? 'possible_duplicate' : 'valid',
    };

    allRows.push(parsedRow);
    if (errors.length > 0) {
      errorRows.push(parsedRow);
    } else if (duplicateReason) {
      duplicateRows.push(parsedRow);
    } else {
      validRows.push(parsedRow);
    }
  }

  return { validRows, errorRows, duplicateRows, allRows };
}
