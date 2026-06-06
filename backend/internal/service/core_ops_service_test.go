package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/sadaqah/backend/internal/repository"
	"github.com/sadaqah/backend/internal/service"
)

func TestCoreOpsService_ProcessDonation(t *testing.T) {
	ctx := context.Background()
	
	// Skip this test if Docker isn't available
	// testcontainers handles this internally, but good practice
	db := SetupTestDB(t, ctx)
	defer db.Teardown(t, ctx)

	coreOpsRepo := repository.NewCoreOpsRepository(db.Pool)
	auditRepo := repository.NewAuditRepository(db.Pool)
	auditService := service.NewAuditService(auditRepo, db.Logger)
	coreOpsService := service.NewCoreOpsService(coreOpsRepo, auditService, db.Logger)

	// We seed a campaign with ID '22222222-2222-2222-2222-222222222222' and User '11111111-1111-1111-1111-111111111111' in testutils
	campaignID := "22222222-2222-2222-2222-222222222222"
	donorID := "11111111-1111-1111-1111-111111111111"

	// 1. Process a valid donation
	donation, err := coreOpsService.ProcessDonation(ctx, campaignID, &donorID, 500.0, "USD", "credit_card", "txn_123", false)
	assert.NoError(t, err)
	assert.NotNil(t, donation)
	assert.Equal(t, 500.0, donation.Amount)
	assert.Equal(t, "USD", donation.Currency)

	// 2. Verify campaign amount increased
	campaign, err := coreOpsService.GetCampaignByID(ctx, campaignID)
	assert.NoError(t, err)
	assert.Equal(t, 500.0, campaign.CurrentAmount)

	// 3. Verify audit log was created
	logs, _, err := auditRepo.GetLogs(ctx, 1, 10)
	assert.NoError(t, err)
	
	foundAudit := false
	for _, l := range logs {
		if l.Action == "PROCESS_DONATION" && l.EntityID == donation.ID {
			foundAudit = true
			break
		}
	}
	assert.True(t, foundAudit, "Audit log for PROCESS_DONATION should exist")

	// 4. Test invalid campaign ID
	_, err = coreOpsService.ProcessDonation(ctx, "invalid-uuid", &donorID, 100.0, "USD", "credit_card", "txn_456", false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid campaign ID")
}
