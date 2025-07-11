import { z } from 'zod'

// Inventory CSV Schema
const inventoryRowSchema = z.object({
  SKU: z.string().min(1, 'SKU is required'),
  Description: z.string().min(1, 'Description is required'),
  Quantity: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    if (isNaN(num)) throw new Error('Invalid quantity')
    return num
  }),
  'Unit Cost': z.string().transform((val) => {
    const num = parseFloat(val.replace(/[$,]/g, ''))
    if (isNaN(num)) throw new Error('Invalid unit cost')
    return num
  }),
})

// Sales CSV Schema
const salesRowSchema = z.object({
  Date: z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, 'Invalid date format'),
  SKU: z.string().min(1, 'SKU is required'),
  Quantity: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ''))
    if (isNaN(num)) throw new Error('Invalid quantity')
    return num
  }),
  Revenue: z.string().transform((val) => {
    const num = parseFloat(val.replace(/[$,]/g, ''))
    if (isNaN(num)) throw new Error('Invalid revenue')
    return num
  }),
})

export type InventoryRow = z.infer<typeof inventoryRowSchema>
export type SalesRow = z.infer<typeof salesRowSchema>

interface ValidationResult {
  isValid: boolean
  fileType: 'inventory' | 'sales'
  error?: string
  processedData?: InventoryRow[] | SalesRow[]
}

export function validateCSVStructure(data: any[], filename: string): ValidationResult {
  if (!data || data.length === 0) {
    return {
      isValid: false,
      fileType: 'inventory',
      error: 'CSV file is empty',
    }
  }

  const headers = Object.keys(data[0])
  const inventoryHeaders = ['SKU', 'Description', 'Quantity', 'Unit Cost']
  const salesHeaders = ['Date', 'SKU', 'Quantity', 'Revenue']

  // Check if it's an inventory file
  const isInventory = inventoryHeaders.every(h => headers.includes(h))
  const isSales = salesHeaders.every(h => headers.includes(h))

  if (!isInventory && !isSales) {
    return {
      isValid: false,
      fileType: 'inventory',
      error: `Invalid CSV structure. Expected columns: ${inventoryHeaders.join(', ')} OR ${salesHeaders.join(', ')}`,
    }
  }

  try {
    if (isInventory) {
      // Filter out "por unidad" entries and validate
      const filteredData = data.filter(row => {
        const description = row.Description?.toLowerCase() || ''
        return !description.includes('por unidad')
      })

      const processedData = filteredData.map((row, index) => {
        try {
          return inventoryRowSchema.parse(row)
        } catch (error) {
          throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
        }
      })

      return {
        isValid: true,
        fileType: 'inventory',
        processedData,
      }
    } else {
      // Validate sales data
      const processedData = data.map((row, index) => {
        try {
          return salesRowSchema.parse(row)
        } catch (error) {
          throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
        }
      })

      return {
        isValid: true,
        fileType: 'sales',
        processedData,
      }
    }
  } catch (error) {
    return {
      isValid: false,
      fileType: isInventory ? 'inventory' : 'sales',
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

// Additional validation functions
export function validateInventoryData(data: InventoryRow[]): string[] {
  const errors: string[] = []
  const skuSet = new Set<string>()

  data.forEach((row, index) => {
    // Check for duplicate SKUs
    if (skuSet.has(row.SKU)) {
      errors.push(`Duplicate SKU found: ${row.SKU} at row ${index + 2}`)
    }
    skuSet.add(row.SKU)

    // Check for negative values
    if (row.Quantity < 0) {
      errors.push(`Negative quantity for SKU ${row.SKU}: ${row.Quantity}`)
    }
    if (row['Unit Cost'] < 0) {
      errors.push(`Negative unit cost for SKU ${row.SKU}: ${row['Unit Cost']}`)
    }
  })

  return errors
}

export function validateSalesData(data: SalesRow[]): string[] {
  const errors: string[] = []

  data.forEach((row, index) => {
    // Check for negative values
    if (row.Quantity < 0) {
      errors.push(`Negative quantity at row ${index + 2}: ${row.Quantity}`)
    }
    if (row.Revenue < 0) {
      errors.push(`Negative revenue at row ${index + 2}: ${row.Revenue}`)
    }

    // Check date is not in future
    const date = new Date(row.Date)
    if (date > new Date()) {
      errors.push(`Future date at row ${index + 2}: ${row.Date}`)
    }
  })

  return errors
}

export interface CSVValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  warnings: CSVValidationWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface CSVValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'critical';
}

export interface CSVValidationWarning {
  row: number;
  column: string;
  value: any;
  message: string;
}

export class CSVValidator {
  private rules: CSVValidationRule[];
  private data: any[];
  private headers: string[];

  constructor(rules: CSVValidationRule[]) {
    this.rules = rules;
    this.data = [];
    this.headers = [];
  }

  validate(csvData: any[], headers: string[]): CSVValidationResult {
    this.data = csvData;
    this.headers = headers;

    const errors: CSVValidationError[] = [];
    const warnings: CSVValidationWarning[] = [];
    let validRows = 0;

    // Validate headers
    const headerErrors = this.validateHeaders();
    errors.push(...headerErrors);

    // Validate each row
    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      const row = this.data[rowIndex];
      const rowNumber = rowIndex + 1; // 1-based row numbers

      const rowErrors = this.validateRow(row, rowNumber);
      const rowWarnings = this.validateRowWarnings(row, rowNumber);

      errors.push(...rowErrors);
      warnings.push(...rowWarnings);

      if (rowErrors.length === 0) {
        validRows++;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRows: this.data.length,
        validRows,
        invalidRows: this.data.length - validRows,
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }

  private validateHeaders(): CSVValidationError[] {
    const errors: CSVValidationError[] = [];
    const requiredFields = this.rules.filter(rule => rule.required).map(rule => rule.field);

    for (const requiredField of requiredFields) {
      if (!this.headers.includes(requiredField)) {
        errors.push({
          row: 0,
          column: requiredField,
          value: null,
          message: `Required column '${requiredField}' is missing`,
          severity: 'critical'
        });
      }
    }

    return errors;
  }

  private validateRow(row: any, rowNumber: number): CSVValidationError[] {
    const errors: CSVValidationError[] = [];

    for (const rule of this.rules) {
      const value = row[rule.field];
      const fieldErrors = this.validateField(value, rule, rowNumber);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  private validateField(value: any, rule: CSVValidationRule, rowNumber: number): CSVValidationError[] {
    const errors: CSVValidationError[] = [];

    // Check if required
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push({
        row: rowNumber,
        column: rule.field,
        value,
        message: `Required field '${rule.field}' is missing or empty`,
        severity: 'error'
      });
      return errors; // Skip other validations if required field is missing
    }

    // Skip validation if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(value, rule.type, rule.field, rowNumber);
      if (typeError) {
        errors.push(typeError);
        return errors; // Skip other validations if type is wrong
      }
    }

    // Length validation
    if (rule.minLength !== undefined || rule.maxLength !== undefined) {
      const length = String(value).length;
      if (rule.minLength !== undefined && length < rule.minLength) {
        errors.push({
          row: rowNumber,
          column: rule.field,
          value,
          message: `Field '${rule.field}' must be at least ${rule.minLength} characters long`,
          severity: 'error'
        });
      }
      if (rule.maxLength !== undefined && length > rule.maxLength) {
        errors.push({
          row: rowNumber,
          column: rule.field,
          value,
          message: `Field '${rule.field}' must be no more than ${rule.maxLength} characters long`,
          severity: 'error'
        });
      }
    }

    // Numeric range validation
    if (rule.type === 'number' && (rule.minValue !== undefined || rule.maxValue !== undefined)) {
      const numValue = Number(value);
      if (rule.minValue !== undefined && numValue < rule.minValue) {
        errors.push({
          row: rowNumber,
          column: rule.field,
          value,
          message: `Field '${rule.field}' must be at least ${rule.minValue}`,
          severity: 'error'
        });
      }
      if (rule.maxValue !== undefined && numValue > rule.maxValue) {
        errors.push({
          row: rowNumber,
          column: rule.field,
          value,
          message: `Field '${rule.field}' must be no more than ${rule.maxValue}`,
          severity: 'error'
        });
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push({
        row: rowNumber,
        column: rule.field,
        value,
        message: `Field '${rule.field}' does not match required pattern`,
        severity: 'error'
      });
    }

    // Custom validation
    if (rule.customValidator) {
      const customResult = rule.customValidator(value);
      if (customResult !== true) {
        errors.push({
          row: rowNumber,
          column: rule.field,
          value,
          message: typeof customResult === 'string' ? customResult : `Field '${rule.field}' failed custom validation`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private validateType(value: any, type: string, field: string, rowNumber: number): CSVValidationError | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            row: rowNumber,
            column: field,
            value,
            message: `Field '${field}' must be a string`,
            severity: 'error'
          };
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return {
            row: rowNumber,
            column: field,
            value,
            message: `Field '${field}' must be a valid number`,
            severity: 'error'
          };
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            row: rowNumber,
            column: field,
            value,
            message: `Field '${field}' must be a valid date`,
            severity: 'error'
          };
        }
        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(String(value))) {
          return {
            row: rowNumber,
            column: field,
            value,
            message: `Field '${field}' must be a valid email address`,
            severity: 'error'
          };
        }
        break;

      case 'phone':
        const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = String(value).replace(/[\s\-\(\)]/g, '');
        if (!phonePattern.test(cleanPhone)) {
          return {
            row: rowNumber,
            column: field,
            value,
            message: `Field '${field}' must be a valid phone number`,
            severity: 'error'
          };
        }
        break;
    }

    return null;
  }

  private validateRowWarnings(row: any, rowNumber: number): CSVValidationWarning[] {
    const warnings: CSVValidationWarning[] = [];

    // Business rule warnings
    for (const rule of this.rules) {
      const value = row[rule.field];
      
      // Check for suspicious values
      if (rule.type === 'number' && value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        
        // Check for zero values in quantity fields
        if (rule.field.toLowerCase().includes('quantity') && numValue === 0) {
          warnings.push({
            row: rowNumber,
            column: rule.field,
            value,
            message: `Zero quantity detected for '${rule.field}' - verify if this is correct`
          });
        }
        
        // Check for very large values
        if (numValue > 1000000) {
          warnings.push({
            row: rowNumber,
            column: rule.field,
            value,
            message: `Unusually large value detected for '${rule.field}' - verify if this is correct`
          });
        }
      }
      
      // Check for suspicious strings
      if (rule.type === 'string' && value !== null && value !== undefined && value !== '') {
        const strValue = String(value);
        
        // Check for test data
        if (strValue.toLowerCase().includes('test') || strValue.toLowerCase().includes('sample')) {
          warnings.push({
            row: rowNumber,
            column: rule.field,
            value,
            message: `Test/sample data detected in '${rule.field}' - verify if this is production data`
          });
        }
        
        // Check for placeholder values
        if (strValue.toLowerCase().includes('placeholder') || strValue.toLowerCase().includes('example')) {
          warnings.push({
            row: rowNumber,
            column: rule.field,
            value,
            message: `Placeholder data detected in '${rule.field}' - verify if this is correct`
          });
        }
      }
    }

    return warnings;
  }

  // Predefined validation rules for common supply chain data
  static getInventoryValidationRules(): CSVValidationRule[] {
    return [
      {
        field: 'sku',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 50,
        pattern: /^[A-Za-z0-9\-_]+$/
      },
      {
        field: 'description',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 200
      },
      {
        field: 'quantity',
        required: true,
        type: 'number',
        minValue: 0,
        maxValue: 1000000
      },
      {
        field: 'unit_cost',
        required: true,
        type: 'number',
        minValue: 0,
        maxValue: 100000
      },
      {
        field: 'category',
        type: 'string',
        maxLength: 100
      },
      {
        field: 'supplier',
        type: 'string',
        maxLength: 100
      },
      {
        field: 'location',
        type: 'string',
        maxLength: 100
      }
    ];
  }

  static getSalesValidationRules(): CSVValidationRule[] {
    return [
      {
        field: 'sku',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 50,
        pattern: /^[A-Za-z0-9\-_]+$/
      },
      {
        field: 'quantity',
        required: true,
        type: 'number',
        minValue: 1,
        maxValue: 10000
      },
      {
        field: 'revenue',
        required: true,
        type: 'number',
        minValue: 0,
        maxValue: 1000000
      },
      {
        field: 'transaction_date',
        required: true,
        type: 'date'
      },
      {
        field: 'customer_id',
        type: 'string',
        maxLength: 50
      },
      {
        field: 'channel',
        type: 'string',
        maxLength: 50
      },
      {
        field: 'unit_price',
        type: 'number',
        minValue: 0,
        maxValue: 100000,
        customValidator: (value) => {
          // Custom validation for unit price vs revenue consistency
          return true; // Placeholder - would check against quantity and revenue
        }
      }
    ];
  }

  static getSupplierValidationRules(): CSVValidationRule[] {
    return [
      {
        field: 'supplier_id',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 50
      },
      {
        field: 'supplier_name',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      {
        field: 'lead_time',
        required: true,
        type: 'number',
        minValue: 0,
        maxValue: 365
      },
      {
        field: 'quality_score',
        type: 'number',
        minValue: 0,
        maxValue: 1
      },
      {
        field: 'cost_score',
        type: 'number',
        minValue: 0,
        maxValue: 1
      },
      {
        field: 'delivery_score',
        type: 'number',
        minValue: 0,
        maxValue: 1
      }
    ];
  }
}