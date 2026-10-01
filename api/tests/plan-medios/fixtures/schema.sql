-- Generado desde app/database/models.py (SQLAlchemy) del proyecto Python original.
-- SOLO para pruebas en memoria: refleja el esquema que ya existe en la BD planmedios.
CREATE TABLE catalog_import_runs (
	id UUID NOT NULL, 
	imported_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	source_path TEXT NOT NULL, 
	media_count INTEGER NOT NULL, 
	product_count INTEGER NOT NULL, 
	orphan_product_count INTEGER NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE expedientes (
	id TEXT NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	original_filename TEXT, 
	stored_path TEXT, 
	original_size_bytes INTEGER, 
	extraction_status VARCHAR(50), 
	summary_payload JSONB, 
	version INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_expedientes_version_positive CHECK (version >= 1), 
	CONSTRAINT ck_expedientes_size_nonnegative CHECK (original_size_bytes IS NULL OR original_size_bytes >= 0)
);

CREATE INDEX ix_expedientes_created_at ON expedientes (created_at);

CREATE INDEX ix_expedientes_status ON expedientes (status);

CREATE TABLE institutional_terms (
	id UUID NOT NULL, 
	term TEXT NOT NULL, 
	normalized_term TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	created_by TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (normalized_term)
);

CREATE TABLE media_catalog (
	id UUID NOT NULL, 
	name TEXT NOT NULL, 
	group_name TEXT NOT NULL, 
	media_type TEXT NOT NULL, 
	coverage TEXT NOT NULL, 
	regions TEXT NOT NULL, 
	languages TEXT NOT NULL, 
	reach TEXT NOT NULL, 
	ages TEXT NOT NULL, 
	predominant_sex TEXT NOT NULL, 
	nse TEXT NOT NULL, 
	interests TEXT NOT NULL, 
	peak_hours TEXT NOT NULL, 
	contact_person TEXT NOT NULL, 
	contact_email TEXT NOT NULL, 
	contact_phone TEXT NOT NULL, 
	legal_name TEXT NOT NULL, 
	nit TEXT NOT NULL, 
	tax_status TEXT NOT NULL, 
	required_documents TEXT NOT NULL, 
	minimum_investment TEXT NOT NULL, 
	contracting_forms TEXT NOT NULL, 
	discounts TEXT NOT NULL, 
	rate_card_validity TEXT NOT NULL, 
	imported_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_media_catalog_name_type UNIQUE (name, media_type)
);

CREATE INDEX ix_media_catalog_media_type ON media_catalog (media_type);

CREATE TABLE selection_audit_events (
	id UUID NOT NULL, 
	sequence INTEGER GENERATED ALWAYS AS IDENTITY, 
	occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	event_type VARCHAR(20) NOT NULL, 
	expediente_id TEXT NOT NULL, 
	campaign TEXT NOT NULL, 
	analyst_user_id INTEGER, 
	analyst_email TEXT, 
	analyst_name TEXT, 
	medium_name TEXT NOT NULL, 
	catalog_media_id INTEGER, 
	catalog_media_name TEXT NOT NULL, 
	provider_legal_name TEXT NOT NULL, 
	matched_top_recommendation BOOLEAN NOT NULL, 
	payload JSONB NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_selection_audit_events_type CHECK (event_type in ('selected', 'removed', 'updated')), 
	UNIQUE (sequence)
);

CREATE INDEX ix_selection_audit_events_analyst_user_id ON selection_audit_events (analyst_user_id);

CREATE INDEX ix_selection_audit_events_catalog_media_id ON selection_audit_events (catalog_media_id);

CREATE INDEX ix_selection_audit_events_expediente_id ON selection_audit_events (expediente_id);

CREATE INDEX ix_selection_audit_events_occurred_at ON selection_audit_events (occurred_at);

CREATE TABLE expediente_media_entries (
	id UUID NOT NULL, 
	expediente_id TEXT NOT NULL, 
	position INTEGER NOT NULL, 
	profile TEXT, 
	category VARCHAR(100), 
	catalog_media_id UUID, 
	payload JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_media_entry_position UNIQUE (expediente_id, position), 
	FOREIGN KEY(expediente_id) REFERENCES expedientes (id) ON DELETE CASCADE, 
	FOREIGN KEY(catalog_media_id) REFERENCES media_catalog (id) ON DELETE SET NULL
);

CREATE INDEX ix_expediente_media_entries_expediente_id ON expediente_media_entries (expediente_id);

CREATE TABLE media_products (
	id UUID NOT NULL, 
	media_id UUID NOT NULL, 
	category TEXT NOT NULL, 
	product_name TEXT NOT NULL, 
	format TEXT NOT NULL, 
	schedule TEXT NOT NULL, 
	prime_time TEXT NOT NULL, 
	rating NUMERIC(18, 4), 
	estimated_audience INTEGER, 
	unit_cost NUMERIC(18, 2), 
	details JSONB NOT NULL, 
	imported_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(media_id) REFERENCES media_catalog (id) ON DELETE CASCADE
);

CREATE INDEX ix_media_products_category ON media_products (category);

CREATE INDEX ix_media_products_media_id ON media_products (media_id);

CREATE TABLE purchase_requests (
	id UUID NOT NULL, 
	expediente_id TEXT NOT NULL, 
	media_entry_id UUID, 
	request_number TEXT, 
	request_date DATE, 
	budget_item TEXT, 
	code TEXT, 
	quantity INTEGER, 
	unit TEXT, 
	description TEXT, 
	justification TEXT, 
	specifications TEXT, 
	status VARCHAR(50) NOT NULL, 
	generated_filename TEXT, 
	payload JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_purchase_quantity_nonnegative CHECK (quantity IS NULL OR quantity >= 0), 
	FOREIGN KEY(expediente_id) REFERENCES expedientes (id) ON DELETE CASCADE, 
	FOREIGN KEY(media_entry_id) REFERENCES expediente_media_entries (id) ON DELETE SET NULL
);

CREATE INDEX ix_purchase_requests_expediente_id ON purchase_requests (expediente_id);
