package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type DonationService struct {
	repo         *repository.DonationRepository
	auditService *AuditService
	emailService *EmailService
	fileService  *FileService
	eventService *EventService
	logger       *slog.Logger
}

func NewDonationService(repo *repository.DonationRepository, auditService *AuditService, emailService *EmailService, fileService *FileService, eventService *EventService, logger *slog.Logger) *DonationService {
	return &DonationService{
		repo:         repo,
		auditService: auditService,
		emailService: emailService,
		fileService:  fileService,
		eventService: eventService,
		logger:       logger,
	}
}

// ── Campaigns ──

func (s *DonationService) CreateCampaign(ctx context.Context, titleEn, titleAr, desc string, goal float64, currency, start, end, category, visibility, priority, createdBy string) (*model.Campaign, error) {
	creatorID, err := uuid.Parse(createdBy)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	c := &model.Campaign{
		TitleEn:     titleEn,
		TitleAr:     titleAr,
		Description: desc,
		GoalAmount:  goal,
		Currency:    currency,
		Category:    category,
		Visibility:  visibility,
		Priority:    priority,
		CreatedBy:   &creatorID,
		Status:      "active",
	}

	startDate, err := time.Parse(time.RFC3339, start)
	if err == nil {
		c.StartDate = startDate
	} else {
		c.StartDate = time.Now()
	}

	if end != "" {
		endDate, err := time.Parse(time.RFC3339, end)
		if err == nil {
			c.EndDate = &endDate
		}
	}

	if err := s.repo.CreateCampaign(ctx, c); err != nil {
		s.logger.Error("Failed to create campaign", "error", err)
		return nil, err
	}

	s.auditService.LogAction(ctx, "CREATE_CAMPAIGN", "campaign", c.ID, nil, c)
	return c, nil
}

func (s *DonationService) GetCampaigns(ctx context.Context) ([]model.Campaign, error) {
	return s.repo.GetCampaigns(ctx)
}

func (s *DonationService) GetCampaignByID(ctx context.Context, id string) (*model.Campaign, error) {
	return s.repo.GetCampaignByID(ctx, id)
}

// ── Donations ──

func (s *DonationService) ProcessDonation(ctx context.Context, campaignID string, donorID *string, donorEmail string, amount float64, currency, paymentMethod, paymentRef string, isAnon bool, donationType string, notes string) (*model.Donation, error) {
	cID, err := uuid.Parse(campaignID)
	if err != nil {
		return nil, fmt.Errorf("invalid campaign ID: %w", err)
	}

	var dID *uuid.UUID
	if donorID != nil && *donorID != "" {
		id, err := uuid.Parse(*donorID)
		if err == nil {
			dID = &id
		}
	}

	initialStatus := "completed" // synchronous for credit_card/cash
	if paymentMethod == "bank_transfer" {
		initialStatus = "waiting_transfer"
	}

	donation := &model.Donation{
		CampaignID:       cID,
		DonorID:          dID,
		Amount:           amount,
		Currency:         currency,
		PaymentMethod:    paymentMethod,
		PaymentRef:       paymentRef,
		IsAnonymous:      isAnon,
		IsRecurring:      false,
		Status:           initialStatus,
		DonationType:     donationType,
		AllocationStatus: "pending",
		Notes:            notes,
	}

	if err := s.repo.ProcessDonation(ctx, donation); err != nil {
		s.logger.Error("Failed to process donation", "error", err)
		return nil, err
	}

	// Audit Log
	s.auditService.LogAction(ctx, "PROCESS_DONATION", "donation", donation.ID, nil, donation)

	// Send Email Receipt
	if s.emailService != nil && donorEmail != "" {
		receiptNo := fmt.Sprintf("RCPT-%s", strings.ToUpper(donation.ID.String()[:8]))
		s.emailService.SendDonationReceipt(donorEmail, amount, currency, receiptNo)
	}

	return donation, nil
}

func (s *DonationService) AllocateDonation(ctx context.Context, donationID, budgetAllocationID, program, notes, status, allocatedBy string, amount float64) error {
	dID, err := uuid.Parse(donationID)
	if err != nil { return err }
	
	var bID *uuid.UUID
	if budgetAllocationID != "" {
		id, err := uuid.Parse(budgetAllocationID)
		if err == nil {
			bID = &id
		}
	}
	
	aID, err := uuid.Parse(allocatedBy)
	if err != nil { return err }

	if err := s.repo.AllocateDonation(ctx, dID, bID, program, notes, status, aID, amount); err != nil {
		s.logger.Error("Failed to allocate donation", "error", err)
		return err
	}
	
	s.auditService.LogAction(ctx, "ALLOCATE_DONATION", "donation", dID, nil, map[string]interface{}{
		"budget_allocation_id": budgetAllocationID,
		"program": program,
		"amount": amount,
	})
	
	// Notify the donor if possible (We need the donor ID, let's assume we can notify later or fetch donation)
	return nil
}

func (s *DonationService) GetDonorImpactSummary(ctx context.Context, donorID string) (*model.DonorImpactSummary, error) {
	dID, err := uuid.Parse(donorID)
	if err != nil { return nil, err }
	return s.repo.GetDonorImpactSummary(ctx, dID)
}

func (s *DonationService) PublishImpactUpdate(ctx context.Context, program, titleEn, titleAr, contentEn, contentAr, publishedBy string) (*model.ImpactUpdate, error) {
	pID, _ := uuid.Parse(publishedBy)
	update := &model.ImpactUpdate{
		Program: program,
		TitleEn: titleEn,
		TitleAr: titleAr,
		ContentEn: contentEn,
		ContentAr: contentAr,
		PublishedBy: &pID,
	}

	if err := s.repo.PublishImpactUpdate(ctx, update); err != nil {
		return nil, err
	}

	s.auditService.LogAction(ctx, "PUBLISH_IMPACT_UPDATE", "program", pID, nil, map[string]interface{}{
		"program": program,
	})

	return update, nil
}

func (s *DonationService) GetImpactUpdates(ctx context.Context) ([]model.ImpactUpdate, error) {
	return s.repo.GetImpactUpdates(ctx)
}

func (s *DonationService) GetDonationsByDonor(ctx context.Context, donorID string) ([]model.Donation, error) {
	dID, err := uuid.Parse(donorID)
	if err != nil {
		return nil, err
	}
	return s.repo.GetDonationsByDonor(ctx, dID)
}

func (s *DonationService) GetAllDonations(ctx context.Context) ([]model.Donation, error) {
	return s.repo.GetAllDonations(ctx)
}

// ── AI Stubs ──

func (s *DonationService) PredictDonationTrends(ctx context.Context) (map[string]interface{}, error) {
	// AI Stub
	return map[string]interface{}{
		"prediction": "Donations likely to increase by 15% next month due to upcoming campaign.",
		"confidence": 0.85,
	}, nil
}
func (s *DonationService) UploadTransferReceipt(ctx context.Context, donationID uuid.UUID, donorID uuid.UUID, req model.UploadReceiptRequest) error {
	// 1. Verify donation exists and belongs to donor
	donation, err := s.repo.GetDonationByID(ctx, donationID)
	if err != nil {
		return fmt.Errorf("getting donation: %w", err)
	}
	if donation == nil {
		return fmt.Errorf("donation not found")
	}
	if donation.DonorID == nil || *donation.DonorID != donorID {
		return fmt.Errorf("unauthorized to upload receipt for this donation")
	}

	// 2. Validate the file
	if err := s.fileService.ValidateFileSecurity(ctx, req.ReceiptFileObj); err != nil {
		s.logger.Warn("Malware or invalid file detected during receipt upload", 
			slog.String("donor_id", donorID.String()),
			slog.String("file", req.ReceiptFileObj),
		)
		return fmt.Errorf("invalid or malicious file detected")
	}

	// 3. Update database
	if err := s.repo.UpdateDonationReceipt(ctx, donationID, req.ReceiptFileObj, req.TransferDate, req.BankName, req.PaymentRef); err != nil {
		return fmt.Errorf("updating donation receipt: %w", err)
	}

	// 4. Audit Log
	s.auditService.LogAction(ctx, "UPLOAD_RECEIPT", "donation", donationID, &donorID, map[string]interface{}{
		"file_obj": req.ReceiptFileObj,
		"bank": req.BankName,
	})

	// 5. Notify Finance
	s.eventService.Publish(ctx, "RECEIPT_UPLOADED", "donations", &donationID, &donorID, map[string]interface{}{
		"amount": donation.Amount,
		"currency": donation.Currency,
	})

	return nil
}

func (s *DonationService) VerifyDonation(ctx context.Context, donationID uuid.UUID, verifiedBy uuid.UUID, req model.VerifyDonationRequest) error {
	// 1. Verify donation exists
	donation, err := s.repo.GetDonationByID(ctx, donationID)
	if err != nil {
		return fmt.Errorf("getting donation: %w", err)
	}
	if donation == nil {
		return fmt.Errorf("donation not found")
	}

	// 2. Update status
	if err := s.repo.VerifyDonation(ctx, donationID, req.Status, req.FinanceNotes); err != nil {
		return fmt.Errorf("verifying donation: %w", err)
	}

	// 3. Audit Log
	s.auditService.LogAction(ctx, "VERIFY_DONATION", "donation", donationID, &verifiedBy, map[string]interface{}{
		"status": req.Status,
		"notes": req.FinanceNotes,
	})

	// 4. Notify Donor
	if donation.DonorID != nil {
		eventPayload := map[string]interface{}{
			"donation_id": donationID.String(),
			"status": req.Status,
			"reference_number": donation.ReferenceNumber,
			"notes": req.FinanceNotes,
			"user_id": donation.DonorID.String(),
		}
		s.eventService.Publish(ctx, "DONATION_VERIFICATION_UPDATE", "donations", &donationID, &verifiedBy, eventPayload)
	}

	return nil
}
