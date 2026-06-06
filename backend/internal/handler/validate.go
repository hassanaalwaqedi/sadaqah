package handler

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/sadaqah/backend/internal/model"
)

// validateStruct performs basic validation on a struct using `validate` tags.
// Supported tags: required, min=N, max=N, email, oneof=a b c
// This is a lightweight zero-dependency validator suitable for the current codebase.
func validateStruct(v interface{}) []model.FieldError {
	var errs []model.FieldError

	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return errs
	}

	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldVal := val.Field(i)
		tag := field.Tag.Get("validate")
		if tag == "" || tag == "-" {
			continue
		}

		// Determine the JSON field name for error reporting
		jsonName := field.Tag.Get("json")
		if jsonName == "" {
			jsonName = field.Name
		}
		jsonName = strings.Split(jsonName, ",")[0]

		rules := strings.Split(tag, ",")
		for _, rule := range rules {
			rule = strings.TrimSpace(rule)

			switch {
			case rule == "required":
				if isZero(fieldVal) {
					errs = append(errs, model.FieldError{
						Field:   jsonName,
						Message: fmt.Sprintf("%s is required", jsonName),
					})
				}

			case strings.HasPrefix(rule, "min="):
				minStr := strings.TrimPrefix(rule, "min=")
				var minVal int
				fmt.Sscanf(minStr, "%d", &minVal)
				if fieldVal.Kind() == reflect.String && len(fieldVal.String()) < minVal {
					errs = append(errs, model.FieldError{
						Field:   jsonName,
						Message: fmt.Sprintf("%s must be at least %d characters", jsonName, minVal),
					})
				}

			case strings.HasPrefix(rule, "max="):
				maxStr := strings.TrimPrefix(rule, "max=")
				var maxVal int
				fmt.Sscanf(maxStr, "%d", &maxVal)
				if fieldVal.Kind() == reflect.String && len(fieldVal.String()) > maxVal {
					errs = append(errs, model.FieldError{
						Field:   jsonName,
						Message: fmt.Sprintf("%s must be at most %d characters", jsonName, maxVal),
					})
				}

			case rule == "email":
				if fieldVal.Kind() == reflect.String {
					email := fieldVal.String()
					if email != "" && (!strings.Contains(email, "@") || !strings.Contains(email, ".")) {
						errs = append(errs, model.FieldError{
							Field:   jsonName,
							Message: fmt.Sprintf("%s must be a valid email address", jsonName),
						})
					}
				}

			case strings.HasPrefix(rule, "oneof="):
				opts := strings.TrimPrefix(rule, "oneof=")
				allowed := strings.Fields(opts)
				if fieldVal.Kind() == reflect.String && fieldVal.String() != "" {
					found := false
					for _, o := range allowed {
						if fieldVal.String() == o {
							found = true
							break
						}
					}
					if !found {
						errs = append(errs, model.FieldError{
							Field:   jsonName,
							Message: fmt.Sprintf("%s must be one of: %s", jsonName, strings.Join(allowed, ", ")),
						})
					}
				}
			}
		}
	}

	return errs
}

// isZero checks if a reflect.Value is the zero value for its type.
func isZero(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.String:
		return v.String() == ""
	case reflect.Bool:
		return !v.Bool()
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int() == 0
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return v.Uint() == 0
	case reflect.Float32, reflect.Float64:
		return v.Float() == 0
	case reflect.Ptr, reflect.Interface, reflect.Slice, reflect.Map, reflect.Chan:
		return v.IsNil()
	default:
		return false
	}
}
