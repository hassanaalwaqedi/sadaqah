package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type DonationRepository struct {
	db *pgxpool.Pool
}

func NewDonationRepository(db *pgxpool.Pool) *DonationRepository {
	return &DonationRepository{db: db}
}

func (r *DonationRepository) CreateCampaign(ctx context.Context, c *model.Campaign) error {
	query := `
		INSERT INTO campaigns (
			title_en, title_ar, description, goal_amount, currency, start_date, end_date,
			status, category, visibility, priority, cover_image_file_id, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		) RETURNING id, created_at`
		
	return r.db.QueryRow(ctx, query,
		c.TitleEn, c.TitleAr, c.Description, c.GoalAmount, c.Currency, c.StartDate, c.EndDate,
		c.Status, c.Category, c.Visibility, c.Priority, c.CoverImageID, c.CreatedBy,
	).Scan(&c.ID, &c.CreatedAt)
}

func (r *DonationRepository) GetCampaigns(ctx context.Context) ([]model.Campaign, error) {
	query := `
		SELECT id, title_en, title_ar, description, goal_amount, raised_amount, currency, 
		       start_date, end_date, status, category, visibility, priority, created_at 
		FROM campaigns 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC`
		
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var campaigns []model.Campaign
	for rows.Next() {
		var c model.Campaign
		if err := rows.Scan(
			&c.ID, &c.TitleEn, &c.TitleAr, &c.Description, &c.GoalAmount, &c.RaisedAmount, &c.Currency,
			&c.StartDate, &c.EndDate, &c.Status, &c.Category, &c.Visibility, &c.Priority, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, nil
}

func (r *DonationRepository) GetCampaignByID(ctx context.Context, id string) (*model.Campaign, error) {
	query := `
		SELECT id, title_en, title_ar, description, goal_amount, raised_amount, currency, 
		       start_date, end_date, status, category, visibility, priority, created_at 
		FROM campaigns 
		WHERE id = $1`
		
	var c model.Campaign
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.TitleEn, &c.TitleAr, &c.Description, &c.GoalAmount, &c.RaisedAmount, &c.Currency,
		&c.StartDate, &c.EndDate, &c.Status, &c.Category, &c.Visibility, &c.Priority, &c.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *DonationRepository) ProcessDonation(ctx context.Context, d *model.Donation) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	d.ReferenceNumber = fmt.Sprintf("DON-%d-%s", time.Now().Year(), strings.ToUpper(uuid.New().String()[:6]))

	// Insert Donation
	query := `
		INSERT INTO donations (
			campaign_id, donor_id, amount, currency, payment_method, payment_ref,
			is_anonymous, is_recurring, status, donation_type, allocation_status, restricted_fund_id, notes,
			reference_number, receipt_file_obj, transfer_date, bank_name, finance_notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
		) RETURNING id, donated_at`
		
	err = tx.QueryRow(ctx, query,
		d.CampaignID, d.DonorID, d.Amount, d.Currency, d.PaymentMethod, d.PaymentRef,
		d.IsAnonymous, d.IsRecurring, d.Status, d.DonationType, d.AllocationStatus, d.RestrictedFundID, d.Notes,
		d.ReferenceNumber, d.ReceiptFileObj, d.TransferDate, d.BankName, d.FinanceNotes,
	).Scan(&d.ID, &d.DonatedAt)
	
	if err != nil {
		return err
	}

	// Update Campaign Raised Amount if completed
	if d.Status == "completed" {
		updateQuery := `UPDATE campaigns SET raised_amount = raised_amount + $1 WHERE id = $2`
		if _, err := tx.Exec(ctx, updateQuery, d.Amount, d.CampaignID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *DonationRepository) GetDonationsByDonor(ctx context.Context, donorID uuid.UUID) ([]model.Donation, error) {
	query := `
		SELECT id, campaign_id, donor_id, amount, currency, payment_method, payment_ref, is_anonymous, is_recurring, 
		       recurring_schedule_id, status, donation_type, allocation_status, restricted_fund_id, notes,
		       reference_number, receipt_file_obj, transfer_date, bank_name, finance_notes, donated_at
		FROM donations
		WHERE donor_id = $1
		ORDER BY donated_at DESC`
	rows, err := r.db.Query(ctx, query, donorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var donations []model.Donation
	for rows.Next() {
		var d model.Donation
		if err := rows.Scan(
			&d.ID, &d.CampaignID, &d.DonorID, &d.Amount, &d.Currency, &d.PaymentMethod, &d.PaymentRef, &d.IsAnonymous, &d.IsRecurring,
			&d.RecurringSchedID, &d.Status, &d.DonationType, &d.AllocationStatus, &d.RestrictedFundID, &d.Notes,
			&d.ReferenceNumber, &d.ReceiptFileObj, &d.TransferDate, &d.BankName, &d.FinanceNotes, &d.DonatedAt,
		); err != nil {
			return nil, err
		}
		donations = append(donations, d)
	}
	return donations, nil
}

func (r *DonationRepository) GetAllDonations(ctx context.Context) ([]model.Donation, error) {
	query := `
		SELECT id, campaign_id, donor_id, amount, currency, payment_method, payment_ref, is_anonymous, is_recurring, 
		       recurring_schedule_id, status, donation_type, allocation_status, restricted_fund_id, notes,
		       reference_number, receipt_file_obj, transfer_date, bank_name, finance_notes, donated_at
		FROM donations
		ORDER BY donated_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var donations []model.Donation
	for rows.Next() {
		var d model.Donation
		if err := rows.Scan(
			&d.ID, &d.CampaignID, &d.DonorID, &d.Amount, &d.Currency, &d.PaymentMethod, &d.PaymentRef, &d.IsAnonymous, &d.IsRecurring,
			&d.RecurringSchedID, &d.Status, &d.DonationType, &d.AllocationStatus, &d.RestrictedFundID, &d.Notes,
			&d.ReferenceNumber, &d.ReceiptFileObj, &d.TransferDate, &d.BankName, &d.FinanceNotes, &d.DonatedAt,
		); err != nil {
			return nil, err
		}
		donations = append(donations, d)
	}
	return donations, nil
}

func (r *DonationRepository) AllocateDonation(ctx context.Context, donationID uuid.UUID, budgetAllocationID *uuid.UUID, program, notes, status string, allocatedBy uuid.UUID, amount float64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	allocQuery := `
		INSERT INTO donation_allocations (donation_id, budget_allocation_id, amount, program, notes, status, allocated_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	if _, err := tx.Exec(ctx, allocQuery, donationID, budgetAllocationID, amount, program, notes, status, allocatedBy); err != nil {
		return err
	}

	statusQuery := `UPDATE donations SET allocation_status = 'allocated' WHERE id = $1`
	if _, err := tx.Exec(ctx, statusQuery, donationID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *DonationRepository) GetDonorImpactSummary(ctx context.Context, donorID uuid.UUID) (*model.DonorImpactSummary, error) {
	summary := &model.DonorImpactSummary{}

	err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donor_id = $1 AND status = 'completed'", donorID).Scan(&summary.TotalDonated)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(da.amount), 0) 
		FROM donation_allocations da 
		JOIN donations d ON da.donation_id = d.id 
		WHERE d.donor_id = $1 AND d.status = 'completed'`, donorID).Scan(&summary.TotalAllocated)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT da.program 
		FROM donation_allocations da 
		JOIN donations d ON da.donation_id = d.id 
		WHERE d.donor_id = $1 AND da.program IS NOT NULL`, donorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		summary.ProgramsSupported = append(summary.ProgramsSupported, p)
	}

	err = r.db.QueryRow(ctx, "SELECT COUNT(DISTINCT campaign_id) FROM donations WHERE donor_id = $1 AND campaign_id IS NOT NULL", donorID).Scan(&summary.CampaignsSupported)
	if err != nil {
		return nil, err
	}

	allocRows, err := r.db.Query(ctx, `
		SELECT da.id, da.donation_id, da.budget_allocation_id, da.amount, da.program, da.status, da.notes, da.allocated_by, da.created_at
		FROM donation_allocations da
		JOIN donations d ON da.donation_id = d.id
		WHERE d.donor_id = $1
		ORDER BY da.created_at DESC LIMIT 10`, donorID)
	if err != nil {
		return nil, err
	}
	defer allocRows.Close()

	for allocRows.Next() {
		var alloc model.DonationAllocation
		if err := allocRows.Scan(&alloc.ID, &alloc.DonationID, &alloc.BudgetAllocationID, &alloc.Amount, &alloc.Program, &alloc.Status, &alloc.Notes, &alloc.AllocatedBy, &alloc.CreatedAt); err != nil {
			return nil, err
		}
		summary.RecentAllocations = append(summary.RecentAllocations, alloc)
	}

	if len(summary.ProgramsSupported) > 0 {
		updateRows, err := r.db.Query(ctx, `
			SELECT id, program, title_en, title_ar, content_en, content_ar, published_by, created_at 
			FROM impact_updates 
			WHERE program = ANY($1) 
			ORDER BY created_at DESC LIMIT 5`, summary.ProgramsSupported)
		if err != nil {
			return nil, err
		}
		defer updateRows.Close()

		for updateRows.Next() {
			var u model.ImpactUpdate
			if err := updateRows.Scan(&u.ID, &u.Program, &u.TitleEn, &u.TitleAr, &u.ContentEn, &u.ContentAr, &u.PublishedBy, &u.CreatedAt); err != nil {
				return nil, err
			}
			summary.ImpactUpdates = append(summary.ImpactUpdates, u)
		}
	}

	return summary, nil
}

func (r *DonationRepository) PublishImpactUpdate(ctx context.Context, update *model.ImpactUpdate) error {
	query := `INSERT INTO impact_updates (program, title_en, title_ar, content_en, content_ar, published_by) 
			  VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
	return r.db.QueryRow(ctx, query, update.Program, update.TitleEn, update.TitleAr, update.ContentEn, update.ContentAr, update.PublishedBy).Scan(&update.ID, &update.CreatedAt)
}

func (r *DonationRepository) GetImpactUpdates(ctx context.Context) ([]model.ImpactUpdate, error) {
	rows, err := r.db.Query(ctx, "SELECT id, program, title_en, title_ar, content_en, content_ar, published_by, created_at FROM impact_updates ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var updates []model.ImpactUpdate
	for rows.Next() {
		var u model.ImpactUpdate
		if err := rows.Scan(&u.ID, &u.Program, &u.TitleEn, &u.TitleAr, &u.ContentEn, &u.ContentAr, &u.PublishedBy, &u.CreatedAt); err != nil {
			return nil, err
		}
		updates = append(updates, u)
	}
	return updates, nil
}
func (r *DonationRepository) GetDonationByID(ctx context.Context, id uuid.UUID) (*model.Donation, error) {
	query := `
		SELECT id, campaign_id, donor_id, amount, currency, payment_method, payment_ref, is_anonymous, is_recurring, 
		       recurring_schedule_id, status, donation_type, allocation_status, restricted_fund_id, notes,
		       reference_number, receipt_file_obj, transfer_date, bank_name, finance_notes, donated_at
		FROM donations
		WHERE id = $1`
	var d model.Donation
	err := r.db.QueryRow(ctx, query, id).Scan(
		&d.ID, &d.CampaignID, &d.DonorID, &d.Amount, &d.Currency, &d.PaymentMethod, &d.PaymentRef, &d.IsAnonymous, &d.IsRecurring,
		&d.RecurringSchedID, &d.Status, &d.DonationType, &d.AllocationStatus, &d.RestrictedFundID, &d.Notes,
		&d.ReferenceNumber, &d.ReceiptFileObj, &d.TransferDate, &d.BankName, &d.FinanceNotes, &d.DonatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *DonationRepository) UpdateDonationReceipt(ctx context.Context, id uuid.UUID, fileObj string, transferDate time.Time, bankName, paymentRef string) error {
	query := `
		UPDATE donations 
		SET receipt_file_obj = $1, transfer_date = $2, bank_name = $3, payment_ref = $4, status = 'pending_verification'
		WHERE id = $5`
	_, err := r.db.Exec(ctx, query, fileObj, transferDate, bankName, paymentRef, id)
	return err
}

func (r *DonationRepository) VerifyDonation(ctx context.Context, id uuid.UUID, status, financeNotes string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		UPDATE donations 
		SET status = $1, finance_notes = $2
		WHERE id = $3 RETURNING amount, campaign_id`
	
	var amount float64
	var campaignID uuid.UUID
	err = tx.QueryRow(ctx, query, status, financeNotes, id).Scan(&amount, &campaignID)
	if err != nil {
		return err
	}

	if status == "approved" || status == "completed" {
		updateQuery := `UPDATE campaigns SET raised_amount = raised_amount + $1 WHERE id = $2`
		if _, err := tx.Exec(ctx, updateQuery, amount, campaignID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
