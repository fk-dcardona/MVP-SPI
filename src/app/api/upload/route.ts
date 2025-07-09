import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateCSVStructure, validateInventoryData, validateSalesData } from '@/lib/validators/csv-validator'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as 'inventory' | 'sales'
    const rowCount = parseInt(formData.get('rowCount') as string)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    
    // Parse CSV
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors 
      }, { status: 400 })
    }

    // Validate CSV structure
    const validation = validateCSVStructure(parseResult.data, file.name)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Additional validation
    const additionalErrors = fileType === 'inventory' 
      ? validateInventoryData(validation.processedData as any)
      : validateSalesData(validation.processedData as any)

    if (additionalErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Data validation failed', 
        details: additionalErrors 
      }, { status: 400 })
    }

    // Create upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('data_uploads')
      .insert({
        user_id: session.user.id,
        company_id: session.user.user_metadata.company_id,
        file_name: file.name,
        file_type: fileType,
        row_count: validation.processedData?.length || 0,
        status: 'processing',
      })
      .select()
      .single()

    if (uploadError) {
      return NextResponse.json({ 
        error: 'Failed to create upload record' 
      }, { status: 500 })
    }

    // Process data based on type
    if (fileType === 'inventory') {
      const inventoryData = validation.processedData as any[]
      
      // Batch insert inventory items
      const { error: insertError } = await supabase
        .from('inventory_items')
        .upsert(
          inventoryData.map(item => ({
            company_id: session.user.user_metadata.company_id,
            sku: item.SKU,
            description: item.Description,
            quantity: item.Quantity,
            unit_cost: item['Unit Cost'],
            upload_id: uploadRecord.id,
            last_updated: new Date().toISOString(),
          })),
          { onConflict: 'company_id,sku' }
        )

      if (insertError) {
        await supabase
          .from('data_uploads')
          .update({ status: 'failed' })
          .eq('id', uploadRecord.id)

        return NextResponse.json({ 
          error: 'Failed to insert inventory data' 
        }, { status: 500 })
      }
    } else {
      const salesData = validation.processedData as any[]
      
      // Batch insert sales transactions
      const { error: insertError } = await supabase
        .from('sales_transactions')
        .insert(
          salesData.map(item => ({
            company_id: session.user.user_metadata.company_id,
            date: item.Date,
            sku: item.SKU,
            quantity: item.Quantity,
            revenue: item.Revenue,
            upload_id: uploadRecord.id,
          }))
        )

      if (insertError) {
        await supabase
          .from('data_uploads')
          .update({ status: 'failed' })
          .eq('id', uploadRecord.id)

        return NextResponse.json({ 
          error: 'Failed to insert sales data' 
        }, { status: 500 })
      }
    }

    // Update upload status
    await supabase
      .from('data_uploads')
      .update({ status: 'completed' })
      .eq('id', uploadRecord.id)

    // Trigger data processor agent
    await fetch(`${request.nextUrl.origin}/api/agents/data-processor/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ uploadId: uploadRecord.id }),
    })

    return NextResponse.json({ 
      success: true,
      uploadId: uploadRecord.id,
      rowsProcessed: validation.processedData?.length || 0,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}