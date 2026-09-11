-- ==============================================================================
-- MIGRACIÓN 20260911000046: Tasador IA - Pipeline Security Definer RPCs
-- Stored Procedures Seguros y Atómicos para Ingesta, Deduplicación,
-- Gestión de Cola de Jobs y Health Checks sin Exposición Directa de Tablas
-- ==============================================================================

-- 1. OBTENER FINGERPRINTS EXISTENTES DE UNA FUENTE
CREATE OR REPLACE FUNCTION public.fn_pipeline_get_existing_fingerprints(
    p_source_code text
)
RETURNS TABLE (
    id uuid,
    source_listing_id text,
    identity_fingerprint text,
    content_fingerprint text,
    pricing_fingerprint text,
    current_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_source_id uuid;
BEGIN
    SELECT s.id INTO v_source_id
    FROM public.property_sources s
    WHERE s.code = p_source_code
    LIMIT 1;

    IF v_source_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        l.id,
        l.source_listing_id::text,
        l.identity_fingerprint::text,
        l.content_fingerprint::text,
        l.pricing_fingerprint::text,
        COALESCE(l.price_usd_normalized, l.current_price, l.price_amount)
    FROM public.property_listings l
    WHERE l.source_id = v_source_id;
END;
$$;

-- 2. ENCOLAR TRABAJOS DE INGESTIÓN EN LOTE
CREATE OR REPLACE FUNCTION public.fn_pipeline_enqueue_jobs(
    p_jobs jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item jsonb;
    v_source_id uuid;
    v_count integer := 0;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_jobs)
    LOOP
        SELECT id INTO v_source_id
        FROM public.property_sources
        WHERE code = (v_item->>'source_code')
        LIMIT 1;

        IF v_source_id IS NOT NULL THEN
            INSERT INTO public.property_ingestion_jobs (
                source_id,
                source_code,
                source_listing_id,
                url,
                job_type,
                priority,
                status,
                payload,
                available_at,
                created_at,
                updated_at
            ) VALUES (
                v_source_id,
                v_item->>'source_code',
                v_item->>'source_listing_id',
                v_item->>'url',
                COALESCE(v_item->>'job_type', 'INGESTION_NEW'),
                COALESCE((v_item->>'priority')::integer, 100),
                'QUEUED',
                COALESCE(v_item->'payload', '{}'::jsonb),
                NOW(),
                NOW(),
                NOW()
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 3. RECLAMAR TRABAJOS PENDIENTES CON LEASING OPTIMISTA
CREATE OR REPLACE FUNCTION public.fn_pipeline_claim_jobs(
    p_batch_size integer,
    p_worker_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_claimed_ids uuid[];
    v_result jsonb;
BEGIN
    -- Seleccionar y bloquear filas
    SELECT ARRAY_AGG(id) INTO v_claimed_ids
    FROM (
        SELECT id
        FROM public.property_ingestion_jobs
        WHERE status IN ('QUEUED', 'RETRY')
          AND available_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    ) q;

    IF v_claimed_ids IS NULL OR ARRAY_LENGTH(v_claimed_ids, 1) = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    -- Actualizar estado a PROCESSING
    UPDATE public.property_ingestion_jobs
    SET 
        status = 'PROCESSING',
        locked_at = NOW(),
        locked_by = p_worker_id,
        started_at = NOW(),
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = ANY(v_claimed_ids);

    -- Retornar trabajos reclamados como JSON
    SELECT jsonb_agg(to_jsonb(j)) INTO v_result
    FROM public.property_ingestion_jobs j
    WHERE j.id = ANY(v_claimed_ids);

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. COMPLETAR O FALLAR TRABAJO
CREATE OR REPLACE FUNCTION public.fn_pipeline_complete_job(
    p_job_id uuid,
    p_status text,
    p_error_code text DEFAULT NULL,
    p_error_message text DEFAULT NULL,
    p_retry_delay_seconds integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_status = 'SUCCESS' THEN
        UPDATE public.property_ingestion_jobs
        SET 
            status = 'SUCCESS',
            completed_at = NOW(),
            error_code = NULL,
            error_message = NULL,
            updated_at = NOW()
        WHERE id = p_job_id;
    ELSE
        UPDATE public.property_ingestion_jobs
        SET 
            status = p_status,
            error_code = p_error_code,
            error_message = p_error_message,
            available_at = NOW() + (p_retry_delay_seconds || ' seconds')::interval,
            updated_at = NOW()
        WHERE id = p_job_id;
    END IF;

    RETURN TRUE;
END;
$$;

-- 5. ATOMIC INGESTION: UPSERT MASTER, LISTING, SNAPSHOT, PRICE HISTORY, MEDIA
CREATE OR REPLACE FUNCTION public.fn_pipeline_ingest_listing(
    p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_master jsonb := p_payload->'master';
    v_listing jsonb := p_payload->'listing';
    v_snapshot jsonb := p_payload->'snapshot';
    v_price_history jsonb := p_payload->'price_history';
    v_media jsonb := p_payload->'media';
    
    v_master_id uuid;
    v_listing_id uuid;
    v_source_id uuid;
    v_source_code text;
    v_source_listing_id text;
    v_is_new boolean := false;
    v_existing_id uuid;
    v_existing_price numeric;
    v_media_item jsonb;
    v_media_count integer := 0;
BEGIN
    v_source_code := v_listing->>'source_code';
    v_source_listing_id := v_listing->>'source_listing_id';

    SELECT id INTO v_source_id
    FROM public.property_sources
    WHERE code = v_source_code
    LIMIT 1;

    IF v_source_id IS NULL THEN
        RAISE EXCEPTION 'Fuente % no registrada', v_source_code;
    END IF;

    -- A. Master Resolution & Upsert
    v_master_id := (v_master->>'id')::uuid;

    INSERT INTO public.property_master (
        id,
        canonical_address,
        department,
        city,
        neighborhood,
        property_type,
        total_area_m2,
        built_area_m2,
        bedrooms,
        bathrooms,
        parking_spaces,
        latitude,
        longitude,
        dedup_hash,
        canonical_status,
        data_quality_score,
        created_at,
        updated_at
    ) VALUES (
        v_master_id,
        COALESCE(v_master->>'canonical_address', 'Sin Dirección'),
        COALESCE(v_master->>'department', 'Montevideo'),
        v_master->>'city',
        v_master->>'neighborhood',
        COALESCE(v_master->>'property_type', 'apartamento'),
        (v_master->>'total_surface_m2')::numeric,
        (v_master->>'covered_surface_m2')::numeric,
        (v_master->>'bedrooms')::integer,
        (v_master->>'bathrooms')::integer,
        (v_master->>'garages')::integer,
        (v_master->>'latitude')::numeric,
        (v_master->>'longitude')::numeric,
        v_master->>'dedup_hash',
        COALESCE(v_master->>'canonical_status', 'ACTIVE'),
        COALESCE((v_master->>'data_quality_score')::numeric, 0),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        canonical_address = EXCLUDED.canonical_address,
        department = EXCLUDED.department,
        city = EXCLUDED.city,
        neighborhood = EXCLUDED.neighborhood,
        property_type = EXCLUDED.property_type,
        total_area_m2 = COALESCE(EXCLUDED.total_area_m2, public.property_master.total_area_m2),
        built_area_m2 = COALESCE(EXCLUDED.built_area_m2, public.property_master.built_area_m2),
        bedrooms = COALESCE(EXCLUDED.bedrooms, public.property_master.bedrooms),
        bathrooms = COALESCE(EXCLUDED.bathrooms, public.property_master.bathrooms),
        latitude = COALESCE(EXCLUDED.latitude, public.property_master.latitude),
        longitude = COALESCE(EXCLUDED.longitude, public.property_master.longitude),
        data_quality_score = GREATEST(EXCLUDED.data_quality_score, public.property_master.data_quality_score),
        updated_at = NOW();

    -- B. Verificar si el Listing ya existe
    SELECT id, COALESCE(price_usd_normalized, current_price) 
    INTO v_existing_id, v_existing_price
    FROM public.property_listings
    WHERE source_id = v_source_id AND source_listing_id = v_source_listing_id
    LIMIT 1;

    IF v_existing_id IS NULL THEN
        v_is_new := true;
        v_listing_id := gen_random_uuid();

        INSERT INTO public.property_listings (
            id,
            master_id,
            source_id,
            source_listing_id,
            source_listing_key,
            original_url,
            canonical_url,
            source_agency_name,
            source_agent_id,
            title_raw,
            title_normalized,
            description_raw,
            description_normalized,
            operation_type,
            status,
            department_raw,
            department_normalized,
            city_raw,
            city_normalized,
            locality_raw,
            locality_normalized,
            neighborhood_raw,
            neighborhood_normalized,
            address_raw,
            address_normalized,
            price_amount,
            currency,
            price_usd,
            price_uyu,
            price_usd_normalized,
            price_per_m2,
            price_per_m2_usd,
            current_price,
            current_currency,
            total_area_m2,
            built_area_m2,
            bedrooms,
            bathrooms,
            garages,
            latitude,
            longitude,
            identity_fingerprint,
            content_fingerprint,
            pricing_fingerprint,
            data_quality_score,
            comparable_eligibility,
            eligibility_reasons,
            first_seen_at,
            last_scraped_at,
            created_at,
            updated_at
        ) VALUES (
            v_listing_id,
            v_master_id,
            v_source_id,
            v_source_listing_id,
            v_source_code || '_' || v_source_listing_id,
            v_listing->>'original_url',
            v_listing->>'canonical_url',
            v_listing->>'source_agency_name',
            v_listing->>'source_agent_id',
            v_listing->>'title_raw',
            v_listing->>'title_normalized',
            v_listing->>'description_raw',
            v_listing->>'description_normalized',
            COALESCE(v_listing->>'operation_type', 'VENTA'),
            COALESCE(v_listing->>'status', 'ACTIVE'),
            v_listing->>'department_raw',
            v_listing->>'department_normalized',
            v_listing->>'city_raw',
            v_listing->>'city_normalized',
            v_listing->>'locality_raw',
            v_listing->>'locality_normalized',
            v_listing->>'neighborhood_raw',
            v_listing->>'neighborhood_normalized',
            v_listing->>'address_raw',
            v_listing->>'address_normalized',
            COALESCE((v_listing->>'price_amount')::numeric, 0),
            COALESCE(v_listing->>'currency', 'USD'),
            (v_listing->>'price_usd')::numeric,
            (v_listing->>'price_uyu')::numeric,
            (v_listing->>'price_usd_normalized')::numeric,
            (v_listing->>'price_per_m2')::numeric,
            (v_listing->>'price_per_m2_usd')::numeric,
            (v_listing->>'price_usd_normalized')::numeric,
            COALESCE(v_listing->>'currency', 'USD'),
            (v_listing->>'total_area_m2')::numeric,
            (v_listing->>'built_area_m2')::numeric,
            (v_listing->>'bedrooms')::integer,
            (v_listing->>'bathrooms')::integer,
            (v_listing->>'garages')::integer,
            (v_listing->>'latitude')::numeric,
            (v_listing->>'longitude')::numeric,
            v_listing->>'identity_fingerprint',
            v_listing->>'content_fingerprint',
            v_listing->>'pricing_fingerprint',
            COALESCE((v_listing->>'data_quality_score')::numeric, 0),
            COALESCE(v_listing->>'comparable_eligibility', 'NOT_ELIGIBLE'),
            COALESCE(v_listing->'eligibility_reasons', '[]'::jsonb),
            NOW(),
            NOW(),
            NOW(),
            NOW()
        );

        -- Incrementar contador de nuevos en source
        UPDATE public.property_sources
        SET new_count = new_count + 1, updated_at = NOW()
        WHERE id = v_source_id;
    ELSE
        v_listing_id := v_existing_id;

        UPDATE public.property_listings
        SET
            master_id = v_master_id,
            canonical_url = COALESCE(v_listing->>'canonical_url', public.property_listings.canonical_url),
            title_normalized = COALESCE(v_listing->>'title_normalized', public.property_listings.title_normalized),
            description_normalized = COALESCE(v_listing->>'description_normalized', public.property_listings.description_normalized),
            price_amount = COALESCE((v_listing->>'price_amount')::numeric, public.property_listings.price_amount),
            currency = COALESCE(v_listing->>'currency', public.property_listings.currency),
            price_usd = (v_listing->>'price_usd')::numeric,
            price_uyu = (v_listing->>'price_uyu')::numeric,
            price_usd_normalized = (v_listing->>'price_usd_normalized')::numeric,
            price_per_m2 = (v_listing->>'price_per_m2')::numeric,
            price_per_m2_usd = (v_listing->>'price_per_m2_usd')::numeric,
            current_price = (v_listing->>'price_usd_normalized')::numeric,
            current_currency = COALESCE(v_listing->>'currency', public.property_listings.currency),
            total_area_m2 = COALESCE((v_listing->>'total_area_m2')::numeric, public.property_listings.total_area_m2),
            built_area_m2 = COALESCE((v_listing->>'built_area_m2')::numeric, public.property_listings.built_area_m2),
            bedrooms = COALESCE((v_listing->>'bedrooms')::integer, public.property_listings.bedrooms),
            bathrooms = COALESCE((v_listing->>'bathrooms')::integer, public.property_listings.bathrooms),
            garages = COALESCE((v_listing->>'garages')::integer, public.property_listings.garages),
            content_fingerprint = v_listing->>'content_fingerprint',
            pricing_fingerprint = v_listing->>'pricing_fingerprint',
            data_quality_score = COALESCE((v_listing->>'data_quality_score')::numeric, public.property_listings.data_quality_score),
            comparable_eligibility = COALESCE(v_listing->>'comparable_eligibility', public.property_listings.comparable_eligibility),
            eligibility_reasons = COALESCE(v_listing->'eligibility_reasons', public.property_listings.eligibility_reasons),
            last_scraped_at = NOW(),
            updated_at = NOW()
        WHERE id = v_listing_id;

        -- Incrementar contador de modificados en source
        UPDATE public.property_sources
        SET modified_count = modified_count + 1, updated_at = NOW()
        WHERE id = v_source_id;
    END IF;

    -- C. Snapshot Crudo
    IF v_snapshot IS NOT NULL AND v_snapshot != 'null'::jsonb THEN
        INSERT INTO public.property_listing_snapshots (
            listing_id,
            content_hash,
            structured_payload,
            parser_version,
            captured_at,
            created_at
        ) VALUES (
            v_listing_id,
            v_snapshot->>'content_hash',
            COALESCE(v_snapshot->'structured_payload', '{}'::jsonb),
            COALESCE(v_snapshot->>'parser_version', 'v2.0-deterministic'),
            NOW(),
            NOW()
        );
    END IF;

    -- D. Historial de Precios Append-Only
    IF v_price_history IS NOT NULL AND v_price_history != 'null'::jsonb THEN
        INSERT INTO public.property_price_history (
            property_id,
            listing_id,
            observed_at,
            price,
            price_amount,
            currency,
            price_usd,
            price_uyu,
            price_usd_normalized,
            price_per_m2_usd,
            previous_price_usd,
            price_change_percentage,
            event_type,
            recorded_at
        ) VALUES (
            v_master_id,
            v_listing_id,
            NOW(),
            (v_price_history->>'price_usd')::numeric,
            (v_price_history->>'price_amount')::numeric,
            COALESCE(v_price_history->>'currency', 'USD'),
            (v_price_history->>'price_usd')::numeric,
            (v_price_history->>'price_uyu')::numeric,
            (v_price_history->>'price_usd')::numeric,
            (v_price_history->>'price_per_m2_usd')::numeric,
            (v_price_history->>'previous_price_usd')::numeric,
            (v_price_history->>'price_change_percentage')::numeric,
            COALESCE(v_price_history->>'event_type', CASE WHEN v_is_new THEN 'INITIAL_LISTING' ELSE 'PRICE_UPDATE' END),
            NOW()
        );
    END IF;

    -- E. Medios / Fotos
    IF v_media IS NOT NULL AND jsonb_array_length(v_media) > 0 THEN
        FOR v_media_item IN SELECT * FROM jsonb_array_elements(v_media)
        LOOP
            INSERT INTO public.property_listing_media (
                listing_id,
                master_id,
                media_type,
                original_url,
                position,
                first_seen_at,
                last_seen_at,
                created_at
            ) VALUES (
                v_listing_id,
                v_master_id,
                COALESCE(v_media_item->>'media_type', 'IMAGE'),
                v_media_item->>'original_url',
                COALESCE((v_media_item->>'position')::integer, 0),
                NOW(),
                NOW(),
                NOW()
            );
            v_media_count := v_media_count + 1;
        END LOOP;
    END IF;

    -- F. Actualizar fecha de última ingesta en fuente
    UPDATE public.property_sources
    SET last_ingestion_at = NOW(), last_success_at = NOW()
    WHERE id = v_source_id;

    RETURN jsonb_build_object(
        'listing_id', v_listing_id,
        'master_id', v_master_id,
        'is_new', v_is_new,
        'price_event_created', (v_price_history IS NOT NULL AND v_price_history != 'null'::jsonb),
        'media_count', v_media_count
    );
END;
$$;

-- 6. ACTUALIZACIÓN DE SALUD DE FUENTES
CREATE OR REPLACE FUNCTION public.fn_pipeline_update_source_health(
    p_source_code text,
    p_status text,
    p_latency_ms integer,
    p_message text DEFAULT NULL,
    p_parser_version text DEFAULT 'v2.0-deterministic'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.property_sources
    SET 
        health_status = p_status,
        latency_ms = p_latency_ms,
        last_health_check_at = NOW(),
        last_error_message = CASE WHEN p_status IN ('BLOCKED', 'ERROR', 'DEGRADED') THEN p_message ELSE last_error_message END,
        last_error_at = CASE WHEN p_status IN ('BLOCKED', 'ERROR') THEN NOW() ELSE last_error_at END,
        error_count = CASE WHEN p_status IN ('BLOCKED', 'ERROR') THEN error_count + 1 ELSE error_count END,
        parser_version = p_parser_version,
        updated_at = NOW()
    WHERE code = p_source_code;

    RETURN FOUND;
END;
$$;

-- 7. ACTUALIZACIÓN DE ÚLTIMA FECHA VISTA EN LISTINGS NO MODIFICADOS (UNCHANGED)
CREATE OR REPLACE FUNCTION public.fn_pipeline_touch_unchanged_listings(
    p_source_code text,
    p_listing_ids text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_source_id uuid;
    v_updated integer := 0;
BEGIN
    SELECT id INTO v_source_id
    FROM public.property_sources
    WHERE code = p_source_code
    LIMIT 1;

    IF v_source_id IS NULL OR p_listing_ids IS NULL OR ARRAY_LENGTH(p_listing_ids, 1) = 0 THEN
        RETURN 0;
    END IF;

    UPDATE public.property_listings
    SET last_scraped_at = NOW(), updated_at = NOW()
    WHERE source_id = v_source_id 
      AND source_listing_id = ANY(p_listing_ids);

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    UPDATE public.property_sources
    SET unchanged_count = unchanged_count + v_updated,
        last_discovery_at = NOW()
    WHERE id = v_source_id;

    RETURN v_updated;
END;
$$;

-- 8. REGISTRO DE DISCOVERY RUN
CREATE OR REPLACE FUNCTION public.fn_pipeline_record_discovery_run(
    p_run jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_run_id uuid := gen_random_uuid();
    v_source_id uuid;
BEGIN
    SELECT id INTO v_source_id
    FROM public.property_sources
    WHERE code = (p_run->>'source_code')
    LIMIT 1;

    INSERT INTO public.property_discovery_runs (
        id,
        source_id,
        source_code,
        run_type,
        status,
        pages_inspected,
        listings_found,
        listings_new,
        listings_modified,
        listings_unchanged,
        jobs_queued,
        errors_count,
        started_at,
        finished_at,
        duration_ms,
        created_at
    ) VALUES (
        v_run_id,
        v_source_id,
        p_run->>'source_code',
        COALESCE(p_run->>'run_type', 'SCHEDULED'),
        COALESCE(p_run->>'status', 'SUCCESS'),
        COALESCE((p_run->>'pages_inspected')::integer, 0),
        COALESCE((p_run->>'listings_found')::integer, 0),
        COALESCE((p_run->>'listings_new')::integer, 0),
        COALESCE((p_run->>'listings_modified')::integer, 0),
        COALESCE((p_run->>'listings_unchanged')::integer, 0),
        COALESCE((p_run->>'jobs_queued')::integer, 0),
        COALESCE((p_run->>'errors_count')::integer, 0),
        (p_run->>'started_at')::timestamptz,
        (p_run->>'finished_at')::timestamptz,
        (p_run->>'duration_ms')::integer,
        NOW()
    );

    IF v_source_id IS NOT NULL THEN
        UPDATE public.property_sources
        SET discovered_count = discovered_count + COALESCE((p_run->>'listings_found')::integer, 0),
            last_discovery_at = NOW()
        WHERE id = v_source_id;
    END IF;

    RETURN v_run_id;
END;
$$;

-- 9. PERMISOS DE EJECUCIÓN (ACCESO EXCLUSIVO MEDIANTE PROCEDIMIENTO AUTORIZADO)
GRANT EXECUTE ON FUNCTION public.fn_pipeline_get_existing_fingerprints(text) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_enqueue_jobs(jsonb) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_claim_jobs(integer, text) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_complete_job(uuid, text, text, text, integer) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_ingest_listing(jsonb) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_update_source_health(text, text, integer, text, text) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_touch_unchanged_listings(text, text[]) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_record_discovery_run(jsonb) TO service_role, authenticated, anon;

-- 10. AUDITORÍA DETALLADA DE UN LISTING (SNAPSHOTS, HISTORIAL DE PRECIO Y MEDIOS)
CREATE OR REPLACE FUNCTION public.fn_superadmin_get_listing_audit(
    p_listing_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_snapshots jsonb;
    v_price_history jsonb;
    v_media jsonb;
BEGIN
    SELECT jsonb_agg(to_jsonb(s)) INTO v_snapshots
    FROM (
        SELECT id, content_hash, parser_version, captured_at, structured_payload
        FROM public.property_listing_snapshots
        WHERE listing_id = p_listing_id
        ORDER BY captured_at DESC
        LIMIT 5
    ) s;

    SELECT jsonb_agg(to_jsonb(h)) INTO v_price_history
    FROM (
        SELECT id, price_usd, previous_price_usd, price_change_percentage, event_type, recorded_at
        FROM public.property_price_history
        WHERE listing_id = p_listing_id
        ORDER BY recorded_at DESC
        LIMIT 10
    ) h;

    SELECT jsonb_agg(to_jsonb(m)) INTO v_media
    FROM (
        SELECT id, media_type, original_url, position
        FROM public.property_listing_media
        WHERE listing_id = p_listing_id
        ORDER BY position ASC
        LIMIT 20
    ) m;

    RETURN jsonb_build_object(
        'snapshots', COALESCE(v_snapshots, '[]'::jsonb),
        'price_history', COALESCE(v_price_history, '[]'::jsonb),
        'media', COALESCE(v_media, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_listing_audit(uuid) TO service_role, authenticated, anon;
