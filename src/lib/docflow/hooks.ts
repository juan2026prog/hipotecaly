// ==============================================================================
// HIPOTECALY DOCFLOW: React Hooks Reutilizables para Toda la Plataforma
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { DocumentService } from './documentService';
import {
  GeneratedDocument,
  DocumentTemplate,
  ResolvedCaseData,
} from './types';
import { DOCUMENT_VARIABLES, VARIABLE_CATEGORIES } from './variableRegistry';

/**
 * Hook para obtener y refrescar todos los documentos de un expediente
 */
export function useCaseDocuments(caseId?: string, appData?: any) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!caseId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const docs = await DocumentService.getDocumentsByCase(caseId);
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const generateDoc = async (templateId: string, userContext?: any) => {
    if (!caseId) return null;
    const result = await DocumentService.generateDocument(caseId, templateId, userContext, appData);
    await reload();
    return result;
  };

  const generateNotaryPack = async (userContext?: any) => {
    if (!caseId) return [];
    const results = await DocumentService.generateNotaryPack(caseId, userContext, appData);
    await reload();
    return results;
  };

  const counts = {
    total: documents.length,
    generated: documents.filter((d) => d.status === 'generated' || d.status === 'approved').length,
    pendingSignature: documents.filter((d) => d.status === 'ready_for_signature' || d.status === 'sent_for_signature').length,
    signed: documents.filter((d) => d.status === 'signed').length,
    missingData: documents.filter((d) => d.status === 'data_missing').length,
  };

  return {
    documents,
    loading,
    error,
    reload,
    generateDoc,
    generateNotaryPack,
    counts,
  };
}

/**
 * Hook para resolver variables del caso
 */
export function useDocumentVariables(caseId?: string, appData?: any) {
  const [caseData, setCaseData] = useState<ResolvedCaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId && !appData) {
      setLoading(false);
      return;
    }
    DocumentService.resolveCaseData(appData || caseId).then((data) => {
      setCaseData(data);
      setLoading(false);
    });
  }, [caseId, appData]);

  return {
    caseData,
    loading,
    allVariables: DOCUMENT_VARIABLES,
    categories: VARIABLE_CATEGORIES,
  };
}

/**
 * Hook para obtener plantillas activas
 */
export function useDocFlowTemplates(tenantId?: string) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await DocumentService.getTemplates(tenantId);
    setTemplates(list);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { templates, loading, reload };
}
