export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          company_name: string
          specialty: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          company_name: string
          specialty?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          specialty?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          location: string
          quantity: number
          min_threshold: number
          notes: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          location: string
          quantity?: number
          min_threshold?: number
          notes?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          location?: string
          quantity?: number
          min_threshold?: number
          notes?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      maintenance_tickets: {
        Row: {
          id: string
          title: string
          room: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'done'
          vendor_id: string | null
          date: string
          notes: string | null
          cost: number | null
          photo_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          room: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'done'
          vendor_id?: string | null
          date?: string
          notes?: string | null
          cost?: number | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          room?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'done'
          vendor_id?: string | null
          date?: string
          notes?: string | null
          cost?: number | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          date: string
          amount: number
          category: string
          vendor_id: string | null
          ticket_id: string | null
          notes: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          date?: string
          amount: number
          category: string
          vendor_id?: string | null
          ticket_id?: string | null
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          date?: string
          amount?: number
          category?: string
          vendor_id?: string | null
          ticket_id?: string | null
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
  }
}

export type Vendor = Database['public']['Tables']['vendors']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type MaintenanceTicket = Database['public']['Tables']['maintenance_tickets']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
