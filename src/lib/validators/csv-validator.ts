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