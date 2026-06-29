CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    address TEXT,
    type VARCHAR(50) NOT NULL, -- Head Office, Warehouse, Housing, etc.
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(255) UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES asset_categories(id) ON DELETE RESTRICT,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    supplier VARCHAR(255),
    warranty_expiry DATE,
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    department VARCHAR(100),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, assigned, maintenance, disposed, donated
    useful_life_years INTEGER,
    current_value DECIMAL(12, 2),
    is_donated BOOLEAN DEFAULT FALSE,
    donor_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP WITH TIME ZONE,
    condition_out VARCHAR(50),
    condition_in VARCHAR(50),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- preventive, corrective
    description TEXT NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(12, 2),
    performed_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- invoice, warranty, manual, photo
    file_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Initial Categories
INSERT INTO asset_categories (name_en, name_ar, description) VALUES
('IT Equipment', 'معدات تقنية المعلومات', 'Computers, laptops, servers, network equipment'),
('Furniture', 'أثاث', 'Desks, chairs, cabinets'),
('Student Housing', 'السكن الطلابي', 'Beds, electronics for housing'),
('Research Equipment', 'معدات البحث', 'Laboratory devices and machines'),
('Vehicles', 'مركبات', 'Cars, buses, trucks'),
('Donated Assets', 'أصول متبرع بها', 'Assets received as donations'),
('Consumables', 'مستهلكات', 'Office supplies, cleaning supplies')
ON CONFLICT DO NOTHING;

-- Initial Locations
INSERT INTO locations (name_en, name_ar, type) VALUES
('Headquarters', 'المقر الرئيسي', 'Head Office'),
('Main Warehouse', 'المستودع الرئيسي', 'Warehouse'),
('Istanbul Student Dormitory', 'سكن إسطنبول الطلابي', 'Housing'),
('Research Center A', 'مركز البحث أ', 'Research Center')
ON CONFLICT DO NOTHING;
