/**
 * Unit tests for flag validation schemas
 * 
 * Tests cover:
 * 1. Valid input scenarios
 * 2. Invalid input scenarios
 * 3. Edge cases (empty strings, null values, boundary conditions)
 * 4. Type validation
 * 5. Enum validation
 */

import { describe, it, expect } from 'vitest'
import { flagFormSchema, flagStatusUpdateSchema } from '../flags'
import { FlagType, FlagSeverity, FlagStatus } from '@/lib/types/flags'

describe('Flag Validation Schemas', () => {
  describe('flagFormSchema', () => {
    describe('Valid Inputs', () => {
      it('should validate minimal required fields', () => {
        const validData = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
        }

        const result = flagFormSchema.safeParse(validData)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should validate complete form data', () => {
        const validData = {
          table_name: 'books',
          record_id: 'test-record-id',
          field_name: 'title',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.HIGH,
          description: 'The title is incorrect',
          suggested_value: 'Correct Title',
          details: {
            source: 'user_report',
            confidence: 0.9,
          },
        }

        const result = flagFormSchema.safeParse(validData)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should accept all valid flag types', () => {
        Object.values(FlagType).forEach(flagType => {
          const data = {
            table_name: 'books',
            record_id: 'test-record-id',
            flag_type: flagType,
            severity: FlagSeverity.MEDIUM,
          }

          const result = flagFormSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should accept all valid severity levels', () => {
        Object.values(FlagSeverity).forEach(severity => {
          const data = {
            table_name: 'books',
            record_id: 'test-record-id',
            flag_type: FlagType.INCORRECT_DATA,
            severity: severity,
          }

          const result = flagFormSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should accept all valid table names', () => {
        const validTableNames = ['books', 'editions', 'stock_items']
        
        validTableNames.forEach(tableName => {
          const data = {
            table_name: tableName,
            record_id: 'test-record-id',
            flag_type: FlagType.INCORRECT_DATA,
            severity: FlagSeverity.MEDIUM,
          }

          const result = flagFormSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should handle complex details object', () => {
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          details: {
            nested: {
              object: {
                with: 'multiple levels',
                array: [1, 2, 3],
                boolean: true,
                null_value: null,
              },
            },
            metadata: {
              timestamp: '2024-01-01T00:00:00Z',
              user_agent: 'Test Browser',
            },
          },
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle various suggested_value types', () => {
        const testCases = [
          { suggested_value: 'string value' },
          { suggested_value: 42 },
          { suggested_value: true },
          { suggested_value: { object: 'value' } },
          { suggested_value: [1, 2, 3] },
          { suggested_value: null },
        ]

        testCases.forEach(testCase => {
          const data = {
            table_name: 'books',
            record_id: 'test-record-id',
            flag_type: FlagType.INCORRECT_DATA,
            severity: FlagSeverity.MEDIUM,
            ...testCase,
          }

          const result = flagFormSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('Invalid Inputs', () => {
      it('should reject empty table_name', () => {
        const data = {
          table_name: '',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['table_name'],
              message: expect.stringContaining('Too small: expected string to have >=1 characters'),
            })
          )
        }
      })

      it('should reject empty record_id', () => {
        const data = {
          table_name: 'books',
          record_id: '',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['record_id'],
              message: expect.stringContaining('Too small: expected string to have >=1 characters'),
            })
          )
        }
      })

      it('should reject invalid flag_type', () => {
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: 'invalid_flag_type' as FlagType,
          severity: FlagSeverity.MEDIUM,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['flag_type'],
              code: 'invalid_value',
            })
          )
        }
      })

      it('should reject invalid severity', () => {
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: 'invalid_severity' as FlagSeverity,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['severity'],
              code: 'invalid_value',
            })
          )
        }
      })

      it('should reject missing required fields', () => {
        const data = {
          // Missing table_name, record_id, flag_type, severity
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map(issue => issue.path[0])
          expect(paths).toContain('table_name')
          expect(paths).toContain('record_id')
          expect(paths).toContain('flag_type')
          expect(paths).toContain('severity')
        }
      })

      it('should reject null for required fields', () => {
        const data = {
          table_name: null,
          record_id: null,
          flag_type: null,
          severity: null,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })

      it('should reject wrong types for required fields', () => {
        const data = {
          table_name: 123,
          record_id: {},
          flag_type: 'not_an_enum_value',
          severity: [],
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Edge Cases', () => {
      it('should handle whitespace-only strings for optional fields', () => {
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          field_name: '   ',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          description: '\t\n',
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.field_name).toBe('   ')
          expect(result.data.description).toBe('\t\n')
        }
      })

      it('should handle empty details object', () => {
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          details: {},
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.details).toEqual({})
        }
      })

      it('should handle very long strings', () => {
        const longString = 'a'.repeat(10000)
        
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          description: longString,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.description).toBe(longString)
        }
      })

      it('should handle special characters in strings', () => {
        const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`'
        
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          field_name: specialChars,
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          description: specialChars,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle unicode characters', () => {
        const unicodeText = '测试 🚀 émoji ñoño'
        
        const data = {
          table_name: 'books',
          record_id: 'test-record-id',
          field_name: unicodeText,
          flag_type: FlagType.INCORRECT_DATA,
          severity: FlagSeverity.MEDIUM,
          description: unicodeText,
        }

        const result = flagFormSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('flagStatusUpdateSchema', () => {
    describe('Valid Inputs', () => {
      it('should validate minimal required fields', () => {
        const validData = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
        }

        const result = flagStatusUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should validate complete update data', () => {
        const validData = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
          resolution_notes: 'Issue has been fixed',
          reviewed_by: '987fcdeb-51a2-43d1-b456-426614174000',
        }

        const result = flagStatusUpdateSchema.safeParse(validData)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should accept all valid flag statuses', () => {
        Object.values(FlagStatus).forEach(status => {
          const data = {
            flag_id: '123e4567-e89b-12d3-a456-426614174000',
            status: status,
          }

          const result = flagStatusUpdateSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should handle empty optional fields', () => {
        const data = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
          resolution_notes: '',
          // reviewed_by is omitted (not provided as empty string since it must be valid UUID if provided)
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Inputs', () => {
      it('should reject invalid UUID format for flag_id', () => {
        const invalidUUIDs = [
          'invalid-uuid',
          '123',
          'not-a-uuid-at-all',
          '123e4567-e89b-12d3-a456', // Too short
          '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
          '123g4567-e89b-12d3-a456-426614174000', // Invalid character
        ]

        invalidUUIDs.forEach(invalidUUID => {
          const data = {
            flag_id: invalidUUID,
            status: FlagStatus.RESOLVED,
          }

          const result = flagStatusUpdateSchema.safeParse(data)
          expect(result.success).toBe(false)

          if (!result.success) {
            expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ['flag_id'],
                message: expect.stringContaining('Invalid UUID'),
              })
            )
          }
        })
      })

      it('should reject invalid UUID format for reviewed_by', () => {
        const data = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
          reviewed_by: 'invalid-uuid',
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['reviewed_by'],
              message: expect.stringContaining('Invalid UUID'),
            })
          )
        }
      })

      it('should reject invalid status values', () => {
        const data = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'invalid_status' as FlagStatus,
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['status'],
              code: 'invalid_value',
            })
          )
        }
      })

      it('should reject missing required fields', () => {
        const data = {
          // Missing flag_id and status
          resolution_notes: 'Some notes',
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map(issue => issue.path[0])
          expect(paths).toContain('flag_id')
          expect(paths).toContain('status')
        }
      })

      it('should reject wrong types for fields', () => {
        const data = {
          flag_id: 123, // Should be string
          status: 456, // Should be enum
          resolution_notes: {}, // Should be string
          reviewed_by: [], // Should be string
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Edge Cases', () => {
      it('should handle very long resolution notes', () => {
        const longNotes = 'a'.repeat(10000)
        
        const data = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
          resolution_notes: longNotes,
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.resolution_notes).toBe(longNotes)
        }
      })

      it('should handle special characters in resolution notes', () => {
        const specialNotes = 'Fixed issue with émoji 🚀 and special chars: !@#$%^&*()'
        
        const data = {
          flag_id: '123e4567-e89b-12d3-a456-426614174000',
          status: FlagStatus.RESOLVED,
          resolution_notes: specialNotes,
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.resolution_notes).toBe(specialNotes)
        }
      })

      it('should handle uppercase UUIDs', () => {
        const uppercaseUUID = '123E4567-E89B-12D3-A456-426614174000'
        
        const data = {
          flag_id: uppercaseUUID,
          status: FlagStatus.RESOLVED,
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle mixed case UUIDs', () => {
        const mixedCaseUUID = '123e4567-E89B-12d3-A456-426614174000'
        
        const data = {
          flag_id: mixedCaseUUID,
          status: FlagStatus.RESOLVED,
        }

        const result = flagStatusUpdateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Schema Integration', () => {
    it('should work with real-world data patterns', () => {
      // Test data that might come from a real form submission
      const formData = {
        table_name: 'books',
        record_id: 'b7f8c9d0-1234-5678-9abc-def012345678',
        field_name: 'publication_year',
        flag_type: FlagType.INCORRECT_DATA,
        severity: FlagSeverity.HIGH,
        description: 'The publication year is listed as 1924, but The Great Gatsby was actually published in 1925.',
        suggested_value: '1925',
        details: {
          source: 'wikipedia',
          confidence: 0.95,
          verified_by: 'user_research',
          references: [
            'https://en.wikipedia.org/wiki/The_Great_Gatsby',
            'Library of Congress record'
          ]
        }
      }

      const result = flagFormSchema.safeParse(formData)
      expect(result.success).toBe(true)
    })

    it('should work with admin status update patterns', () => {
      // Test data that might come from an admin resolving a flag
      const updateData = {
        flag_id: 'f1a2b3c4-5678-4012-a456-789012345678',
        status: FlagStatus.RESOLVED,
        resolution_notes: 'Verified and corrected the publication year in our database. The book record has been updated to reflect the correct year (1925).',
        reviewed_by: 'a1b2c3d4-5678-4012-b456-789012345678'
      }

      const result = flagStatusUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })
}) 