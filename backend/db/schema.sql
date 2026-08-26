-- ============================================================================
-- SIH26011: 3D ULPIN Generation and Vertical Property Mapping System
-- ISO 19152 (LADM) Compliant 3D Cadastral Spatial Schema
-- PostgreSQL 14+ / PostGIS 3.1+ (with postgis_topology & postgis_raster)
-- ============================================================================

-- Enable required geospatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Base 2D Cadastral Parcels (Ground Cadastre)
CREATE TABLE IF NOT EXISTS base_cadastral_parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_number VARCHAR(64) NOT NULL UNIQUE,
    state_code VARCHAR(10) NOT NULL,
    district_code VARCHAR(10) NOT NULL,
    sub_district_code VARCHAR(32),
    village_name VARCHAR(128),
    land_use_category VARCHAR(64) DEFAULT 'Urban Residential',
    geom_2d GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table: 3D Volumetric Strata Parcels (Vertical Property Units)
CREATE TABLE IF NOT EXISTS parcels_3d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin_3d VARCHAR(64) NOT NULL UNIQUE,
    base_survey_no VARCHAR(64) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    district_code VARCHAR(10) NOT NULL,
    floor_level INTEGER NOT NULL,
    unit_label VARCHAR(128) NOT NULL,
    owner_name VARCHAR(256) NOT NULL,
    property_type VARCHAR(64) DEFAULT 'Residential Apartment',
    volume_m3 NUMERIC(12, 3) NOT NULL,
    bounds_min_x NUMERIC(14, 6) NOT NULL,
    bounds_max_x NUMERIC(14, 6) NOT NULL,
    bounds_min_y NUMERIC(14, 6) NOT NULL,
    bounds_max_y NUMERIC(14, 6) NOT NULL,
    bounds_min_z NUMERIC(10, 3) NOT NULL,
    bounds_max_z NUMERIC(10, 3) NOT NULL,
    geom_3d GEOMETRY(PolyhedralSurfaceZ, 4326),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    encumbrance_status VARCHAR(64) DEFAULT 'Clear / Validated',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Spatial & Attribute Indexing
CREATE INDEX IF NOT EXISTS idx_parcels_3d_ulpin ON parcels_3d (ulpin_3d);
CREATE INDEX IF NOT EXISTS idx_parcels_3d_survey ON parcels_3d (base_survey_no);
CREATE INDEX IF NOT EXISTS idx_parcels_3d_floor ON parcels_3d (floor_level);
CREATE INDEX IF NOT EXISTS idx_parcels_3d_zrange ON parcels_3d (bounds_min_z, bounds_max_z);
CREATE INDEX IF NOT EXISTS idx_parcels_3d_geom ON parcels_3d USING GIST (geom_3d);
CREATE INDEX IF NOT EXISTS idx_parcels_3d_meta ON parcels_3d USING GIN (metadata_json);

-- Spatial Integrity Constraints & Collision Checking Helper Function
CREATE OR REPLACE FUNCTION check_3d_encroachment(
    new_geom GEOMETRY,
    exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflicting_ulpin VARCHAR,
    conflicting_owner VARCHAR,
    intersection_vol_m3 DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.ulpin_3d,
        p.owner_name,
        ST_3DArea(ST_3DIntersection(p.geom_3d, new_geom)) AS intersection_vol_m3
    FROM parcels_3d p
    WHERE (exclude_id IS NULL OR p.id != exclude_id)
      AND ST_3DIntersects(p.geom_3d, new_geom);
END;
$$ LANGUAGE plpgsql;
