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
      bookings: {
        Row: {
          id: string
          guest_name: string | null
          platform: string
          check_in: string
          check_out: string
          nightly_rate: number | null
          total_amount: number
          cleaning_fee: number
          notes: string | null
          status: 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          guest_name?: string | null
          platform?: string
          check_in: string
          check_out: string
          nightly_rate?: number | null
          total_amount: number
          cleaning_fee?: number
          notes?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          guest_name?: string | null
          platform?: string
          check_in?: string
          check_out?: string
          nightly_rate?: number | null
          total_amount?: number
          cleaning_fee?: number
          notes?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      purchase_items: {
        Row: {
          id: string
          area: string | null
          item: string
          quantity: number
          est_cost: number | null
          link: string | null
          status: 'to_buy' | 'ordered' | 'received'
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          area?: string | null
          item: string
          quantity?: number
          est_cost?: number | null
          link?: string | null
          status?: 'to_buy' | 'ordered' | 'received'
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          area?: string | null
          item?: string
          quantity?: number
          est_cost?: number | null
          link?: string | null
          status?: 'to_buy' | 'ordered' | 'received'
          notes?: string | null
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
export type Booking = Database['public']['Tables']['bookings']['Row']
export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']
