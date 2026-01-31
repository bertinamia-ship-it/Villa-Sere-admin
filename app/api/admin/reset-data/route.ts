import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Verify confirmation
    const body = await request.json()
    if (body.confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'Invalid confirmation' },
        { status: 400 }
      )
    }

    // Get service role key from environment
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create admin client
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete tables in order (respecting foreign keys)
    const tables = [
      'expenses',
      'maintenance_tickets',
      'bookings',
      'purchase_items',
      'inventory_items',
      'vendors'
    ]

    const results: Record<string, number> = {}

    for (const table of tables) {
      // Count before deletion
      const { count: beforeCount } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })

      const rowCount = beforeCount || 0

      if (rowCount > 0) {
        // Delete all rows
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) {
          throw new Error(`Failed to delete ${table}: ${error.message}`)
        }
      }

      results[table] = rowCount
    }

    // Clean storage bucket
    const folders = ['receipts', 'maintenance', 'inventory']
    let totalFilesDeleted = 0

    for (const folder of folders) {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from('attachments')
          .list(folder)

        if (listError) {
          // Folder might not exist, continue
          continue
        }

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${folder}/${file.name}`)
          const { error: deleteError } = await supabaseAdmin.storage
            .from('attachments')
            .remove(filePaths)

          if (!deleteError) {
            totalFilesDeleted += files.length
          }
        }
      } catch (error) {
        // Continue with other folders
        console.error(`Error cleaning ${folder}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data reset successfully',
      results: {
        tables: results,
        storage: {
          filesDeleted: totalFilesDeleted
        }
      }
    })
  } catch (error) {
    console.error('Reset data error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reset data'
      },
      { status: 500 }
    )
  }
}

