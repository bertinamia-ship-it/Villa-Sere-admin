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
          account_id: string | null
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
          account_id?: string | null
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
          account_id?: string | null
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
      maintenance_plans: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          title: string
          description: string | null
          frequency_unit: 'day' | 'week' | 'month' | 'year'
          frequency_interval: number
          start_date: string
          next_run_date: string
          last_completed_date: string | null
          vendor_id: string | null
          estimated_cost: number | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          title: string
          description?: string | null
          frequency_unit: 'day' | 'week' | 'month' | 'year'
          frequency_interval?: number
          start_date?: string
          next_run_date: string
          last_completed_date?: string | null
          vendor_id?: string | null
          estimated_cost?: number | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          title?: string
          description?: string | null
          frequency_unit?: 'day' | 'week' | 'month' | 'year'
          frequency_interval?: number
          start_date?: string
          next_run_date?: string
          last_completed_date?: string | null
          vendor_id?: string | null
          estimated_cost?: number | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_plan_runs: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          plan_id: string
          scheduled_date: string
          status: 'pending' | 'completed' | 'skipped'
          completed_at: string | null
          linked_ticket_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          plan_id: string
          scheduled_date: string
          status?: 'pending' | 'completed' | 'skipped'
          completed_at?: string | null
          linked_ticket_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          plan_id?: string
          scheduled_date?: string
          status?: 'pending' | 'completed' | 'skipped'
          completed_at?: string | null
          linked_ticket_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          title: string
          description: string | null
          cadence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          due_date: string | null
          next_due_date: string
          last_completed_date: string | null
          assigned_to: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'done'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          title: string
          description?: string | null
          cadence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          due_date?: string | null
          next_due_date: string
          last_completed_date?: string | null
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'done'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          title?: string
          description?: string | null
          cadence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          due_date?: string | null
          next_due_date?: string
          last_completed_date?: string | null
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'done'
          created_at?: string
          updated_at?: string
        }
      }
      financial_accounts: {
        Row: {
          id: string
          tenant_id: string
          property_id: string | null
          name: string
          account_type: 'cash' | 'card' | 'bank'
          currency: string
          opening_balance: number
          current_balance: number
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id?: string | null
          name: string
          account_type: 'cash' | 'card' | 'bank'
          currency?: string
          opening_balance?: number
          current_balance?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string | null
          name?: string
          account_type?: 'cash' | 'card' | 'bank'
          currency?: string
          opening_balance?: number
          current_balance?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      account_transactions: {
        Row: {
          id: string
          tenant_id: string
          property_id: string | null
          account_id: string
          transaction_date: string
          direction: 'in' | 'out'
          amount: number
          note: string | null
          expense_id: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id?: string | null
          account_id: string
          transaction_date: string
          direction: 'in' | 'out'
          amount: number
          note?: string | null
          expense_id?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string | null
          account_id?: string
          transaction_date?: string
          direction?: 'in' | 'out'
          amount?: number
          note?: string | null
          expense_id?: string | null
          created_at?: string
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
export type MaintenancePlan = Database['public']['Tables']['maintenance_plans']['Row']
export type MaintenancePlanRun = Database['public']['Tables']['maintenance_plan_runs']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row']
export type AccountTransaction = Database['public']['Tables']['account_transactions']['Row']
