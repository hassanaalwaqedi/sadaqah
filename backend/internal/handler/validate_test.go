package handler

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type TestStruct struct {
	Name   string `json:"name" validate:"required,min=3,max=10"`
	Email  string `json:"email" validate:"required,email"`
	Role   string `json:"role" validate:"oneof=admin user guest"`
	Age    int    `json:"age" validate:"required"`
}

func TestValidateStruct_Valid(t *testing.T) {
	valid := TestStruct{
		Name:  "Hassan",
		Email: "test@example.com",
		Role:  "admin",
		Age:   30,
	}

	errs := validateStruct(valid)
	assert.Empty(t, errs)
}

func TestValidateStruct_Required(t *testing.T) {
	invalid := TestStruct{} // All required fields empty/zero

	errs := validateStruct(invalid)
	assert.Len(t, errs, 3) // Name, Email, Age required. Role is not required.
}

func TestValidateStruct_MinMax(t *testing.T) {
	invalidMin := TestStruct{Name: "ab", Email: "a@b.c", Age: 20}
	errs := validateStruct(invalidMin)
	assert.Len(t, errs, 1)
	assert.Contains(t, errs[0].Message, "at least 3")

	invalidMax := TestStruct{Name: "this is too long", Email: "a@b.c", Age: 20}
	errs2 := validateStruct(invalidMax)
	assert.Len(t, errs2, 1)
	assert.Contains(t, errs2[0].Message, "at most 10")
}

func TestValidateStruct_Email(t *testing.T) {
	invalidEmail := TestStruct{Name: "abc", Email: "notanemail", Age: 20}
	errs := validateStruct(invalidEmail)
	assert.Len(t, errs, 1)
	assert.Contains(t, errs[0].Message, "valid email")
}

func TestValidateStruct_OneOf(t *testing.T) {
	invalidRole := TestStruct{Name: "abc", Email: "a@b.c", Role: "superadmin", Age: 20}
	errs := validateStruct(invalidRole)
	assert.Len(t, errs, 1)
	assert.Contains(t, errs[0].Message, "one of: admin, user, guest")
}
