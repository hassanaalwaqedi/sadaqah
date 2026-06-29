package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type AssetRepository struct {
	db *pgxpool.Pool
}

func NewAssetRepository(db *pgxpool.Pool) *AssetRepository {
	return &AssetRepository{db: db}
}

func (r *AssetRepository) CreateAsset(ctx context.Context, asset *model.Asset) error {
	query := `
		INSERT INTO assets (
			asset_number, barcode, qr_code, name_en, name_ar, category_id,
			brand, model, serial_number, purchase_date, purchase_cost, supplier,
			warranty_expiry, location_id, department, status, useful_life_years,
			current_value, is_donated, donor_name, notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		) RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		asset.AssetNumber, asset.Barcode, asset.QRCode, asset.NameEn, asset.NameAr, asset.CategoryID,
		asset.Brand, asset.Model, asset.SerialNumber, asset.PurchaseDate, asset.PurchaseCost, asset.Supplier,
		asset.WarrantyExpiry, asset.LocationID, asset.Department, asset.Status, asset.UsefulLifeYears,
		asset.CurrentValue, asset.IsDonated, asset.DonorName, asset.Notes,
	).Scan(&asset.ID, &asset.CreatedAt, &asset.UpdatedAt)
}

func (r *AssetRepository) GetAssets(ctx context.Context) ([]model.Asset, error) {
	query := `
		SELECT 
			a.id, a.asset_number, a.name_en, a.name_ar, a.category_id, 
			c.name_en, a.location_id, l.name_en, a.status, a.current_value
		FROM assets a
		LEFT JOIN asset_categories c ON a.category_id = c.id
		LEFT JOIN locations l ON a.location_id = l.id
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assets []model.Asset
	for rows.Next() {
		var a model.Asset
		var cat model.AssetCategory
		var loc model.Location
		err := rows.Scan(
			&a.ID, &a.AssetNumber, &a.NameEn, &a.NameAr, &a.CategoryID,
			&cat.NameEn, &a.LocationID, &loc.NameEn, &a.Status, &a.CurrentValue,
		)
		if err != nil {
			return nil, err
		}
		a.Category = &cat
		a.Location = &loc
		assets = append(assets, a)
	}
	return assets, nil
}

func (r *AssetRepository) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	stats := map[string]interface{}{}

	var totalAssets, activeAssets, maintenanceAssets, assignedAssets int
	var totalValue float64

	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM assets`).Scan(&totalAssets)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM assets WHERE status = 'available'`).Scan(&activeAssets)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM assets WHERE status = 'maintenance'`).Scan(&maintenanceAssets)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM assets WHERE status = 'assigned'`).Scan(&assignedAssets)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, `SELECT COALESCE(SUM(current_value), 0) FROM assets`).Scan(&totalValue)
	if err != nil {
		return nil, err
	}

	stats["total_assets"] = totalAssets
	stats["active_assets"] = activeAssets
	stats["maintenance_assets"] = maintenanceAssets
	stats["assigned_assets"] = assignedAssets
	stats["total_value"] = totalValue

	return stats, nil
}
