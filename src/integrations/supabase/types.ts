export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          assigned_role: string
          code: string
          created_at: string
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          use_count: number
        }
        Insert: {
          assigned_role?: string
          code: string
          created_at?: string
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          use_count?: number
        }
        Update: {
          assigned_role?: string
          code?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      access_requests: {
        Row: {
          association_name: string | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          message: string | null
          notes: string | null
          phone: string | null
          request_type: Database["public"]["Enums"]["access_request_type"]
          role_in_company: string | null
          status: Database["public"]["Enums"]["access_request_status"]
          updated_at: string
        }
        Insert: {
          association_name?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          request_type: Database["public"]["Enums"]["access_request_type"]
          role_in_company?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Update: {
          association_name?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          request_type?: Database["public"]["Enums"]["access_request_type"]
          role_in_company?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      association_cities: {
        Row: {
          association_id: string
          city_id: string
          created_at: string
          id: string
        }
        Insert: {
          association_id: string
          city_id: string
          created_at?: string
          id?: string
        }
        Update: {
          association_id?: string
          city_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_cities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_cities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      association_suggestions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_city: string | null
          suggested_name: string
          suggester_email: string | null
          suggester_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_city?: string | null
          suggested_name: string
          suggester_email?: string | null
          suggester_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_city?: string | null
          suggested_name?: string
          suggester_email?: string | null
          suggester_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          internal_notes: string | null
          logo_url: string | null
          name: string
          nationwide: boolean
          partnership_start_date: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          logo_url?: string | null
          name: string
          nationwide?: boolean
          partnership_start_date?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          logo_url?: string | null
          name?: string
          nationwide?: boolean
          partnership_start_date?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          experience_date_id: string
          id: string
          status: string
          user_id: string
          verification_data: Json | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          experience_date_id: string
          id?: string
          status?: string
          user_id: string
          verification_data?: Json | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          experience_date_id?: string
          id?: string
          status?: string
          user_id?: string
          verification_data?: Json | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          default_sdgs: string[] | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_sdgs?: string[] | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_sdgs?: string[] | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          province: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          province?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          province?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          gallery_visible_to_employees: boolean
          id: string
          logo_url: string | null
          manager_notification_advance_days: number
          max_concurrent_absences: number | null
          name: string
          suggestion_token: string
        }
        Insert: {
          created_at?: string
          gallery_visible_to_employees?: boolean
          id?: string
          logo_url?: string | null
          manager_notification_advance_days?: number
          max_concurrent_absences?: number | null
          name: string
          suggestion_token?: string
        }
        Update: {
          created_at?: string
          gallery_visible_to_employees?: boolean
          id?: string
          logo_url?: string | null
          manager_notification_advance_days?: number
          max_concurrent_absences?: number | null
          name?: string
          suggestion_token?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          booking_id: string
          email_type: string
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          booking_id: string
          email_type: string
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          booking_id?: string
          email_type?: string
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          company_id: string
          confirmation_enabled: boolean
          created_at: string
          id: string
          reminder_enabled: boolean
          reminder_hours_before: number
          updated_at: string
        }
        Insert: {
          company_id: string
          confirmation_enabled?: boolean
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          reminder_hours_before?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          confirmation_enabled?: boolean
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          reminder_hours_before?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      experience_companies: {
        Row: {
          company_id: string
          experience_id: string
        }
        Insert: {
          company_id: string
          experience_id: string
        }
        Update: {
          company_id?: string
          experience_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_companies_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_date_kpi_values: {
        Row: {
          created_at: string
          experience_date_id: string
          id: string
          kpi_id: string
          value: number
        }
        Insert: {
          created_at?: string
          experience_date_id: string
          id?: string
          kpi_id: string
          value: number
        }
        Update: {
          created_at?: string
          experience_date_id?: string
          id?: string
          kpi_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_date_kpi_values_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_date_kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "experience_impact_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_date_kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "v_volunteering_company_kpi_breakdown"
            referencedColumns: ["kpi_id"]
          },
          {
            foreignKeyName: "experience_date_kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "v_volunteering_employee_kpi_contributions"
            referencedColumns: ["kpi_id"]
          },
        ]
      }
      experience_dates: {
        Row: {
          beneficiaries_count: number | null
          company_id: string | null
          created_at: string
          end_datetime: string
          experience_id: string
          id: string
          max_participants: number
          start_datetime: string
          volunteer_hours: number | null
        }
        Insert: {
          beneficiaries_count?: number | null
          company_id?: string | null
          created_at?: string
          end_datetime: string
          experience_id: string
          id?: string
          max_participants?: number
          start_datetime: string
          volunteer_hours?: number | null
        }
        Update: {
          beneficiaries_count?: number | null
          company_id?: string | null
          created_at?: string
          end_datetime?: string
          experience_id?: string
          id?: string
          max_participants?: number
          start_datetime?: string
          volunteer_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_dates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_dates_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_impact_kpis: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_impact_kpis_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_reviews: {
        Row: {
          booking_id: string
          created_at: string
          feedback_improvement: string | null
          feedback_positive: string | null
          feedback_positive_tags: string[]
          id: string
          rating: number
          would_recommend: boolean
        }
        Insert: {
          booking_id: string
          created_at?: string
          feedback_improvement?: string | null
          feedback_positive?: string | null
          feedback_positive_tags?: string[]
          id?: string
          rating: number
          would_recommend: boolean
        }
        Update: {
          booking_id?: string
          created_at?: string
          feedback_improvement?: string | null
          feedback_positive?: string | null
          feedback_positive_tags?: string[]
          id?: string
          rating?: number
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "experience_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          address: string | null
          association_id: string | null
          association_name: string | null
          category: string | null
          category_id: string | null
          city: string | null
          city_id: string | null
          created_at: string
          created_by: string | null
          default_hours: number | null
          description: string | null
          id: string
          image_url: string | null
          location_type: string
          max_participants: number | null
          participant_info: string | null
          price_per_participant: number | null
          sdgs: string[] | null
          secondary_tags: string[] | null
          short_description: string | null
          status: string
          title: string
          type: string
          visibility: string
        }
        Insert: {
          address?: string | null
          association_id?: string | null
          association_name?: string | null
          category?: string | null
          category_id?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          default_hours?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_type?: string
          max_participants?: number | null
          participant_info?: string | null
          price_per_participant?: number | null
          sdgs?: string[] | null
          secondary_tags?: string[] | null
          short_description?: string | null
          status?: string
          title: string
          type?: string
          visibility?: string
        }
        Update: {
          address?: string | null
          association_id?: string | null
          association_name?: string | null
          category?: string | null
          category_id?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          default_hours?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_type?: string
          max_participants?: number | null
          participant_info?: string | null
          price_per_participant?: number | null
          sdgs?: string[] | null
          secondary_tags?: string[] | null
          short_description?: string | null
          status?: string
          title?: string
          type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string | null
          company_id: string
          consent_confirmed: boolean
          created_at: string
          experience_date_id: string
          id: string
          is_featured: boolean
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          uploader_role: string
        }
        Insert: {
          caption?: string | null
          company_id: string
          consent_confirmed?: boolean
          created_at?: string
          experience_date_id: string
          id?: string
          is_featured?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_role: string
        }
        Update: {
          caption?: string | null
          company_id?: string
          consent_confirmed?: boolean
          created_at?: string
          experience_date_id?: string
          id?: string
          is_featured?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_budgets: {
        Row: {
          company_id: string
          created_at: string
          fiscal_year_start: string
          hours_per_employee_year: number
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          fiscal_year_start?: string
          hours_per_employee_year?: number
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          fiscal_year_start?: string
          hours_per_employee_year?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hour_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          association_id: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          manager_email: string | null
          manager_id: string | null
          role: string
        }
        Insert: {
          association_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          manager_email?: string | null
          manager_id?: string | null
          role?: string
        }
        Update: {
          association_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          manager_email?: string | null
          manager_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tb_contracts: {
        Row: {
          contract_pdf_url: string | null
          created_at: string
          id: string
          notes: string | null
          quote_id: string
          request_id: string
          signature_method: string
          signed_at: string | null
          signer_ip: string | null
          signer_profile_id: string | null
          signer_user_agent: string | null
          terms_version_signed: string | null
        }
        Insert: {
          contract_pdf_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quote_id: string
          request_id: string
          signature_method?: string
          signed_at?: string | null
          signer_ip?: string | null
          signer_profile_id?: string | null
          signer_user_agent?: string | null
          terms_version_signed?: string | null
        }
        Update: {
          contract_pdf_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quote_id?: string
          request_id?: string
          signature_method?: string
          signed_at?: string | null
          signer_ip?: string | null
          signer_profile_id?: string | null
          signer_user_agent?: string | null
          terms_version_signed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "tb_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_contracts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_contracts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_event_participants: {
        Row: {
          created_at: string
          dietary_restrictions: string | null
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
          privacy_accepted: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dietary_restrictions?: string | null
          email: string
          event_id: string
          first_name: string
          id?: string
          last_name: string
          privacy_accepted?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dietary_restrictions?: string | null
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string
          privacy_accepted?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tb_events"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_events: {
        Row: {
          contract_id: string | null
          created_at: string
          id: string
          location_address: string | null
          location_name: string | null
          max_participants: number | null
          public_slug: string | null
          request_id: string
          scheduled_datetime: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          id?: string
          location_address?: string | null
          location_name?: string | null
          max_participants?: number | null
          public_slug?: string | null
          request_id: string
          scheduled_datetime?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          id?: string
          location_address?: string | null
          location_name?: string | null
          max_participants?: number | null
          public_slug?: string | null
          request_id?: string
          scheduled_datetime?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "tb_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_format_associations: {
        Row: {
          association_id: string
          created_at: string
          format_id: string
          id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          format_id: string
          id?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          format_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_format_associations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_format_associations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_format_associations_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "tb_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_format_cities: {
        Row: {
          city_id: string
          created_at: string
          format_id: string
          id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          format_id: string
          id?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          format_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_format_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_format_cities_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "tb_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_formats: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          extra_services: Json | null
          id: string
          image_url: string | null
          location_type: string
          nationwide: boolean
          participants_max: number | null
          participants_min: number | null
          price_range_max: number | null
          price_range_min: number | null
          sdgs: string[] | null
          secondary_tags: string[] | null
          services: Json | null
          short_description: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          extra_services?: Json | null
          id?: string
          image_url?: string | null
          location_type?: string
          nationwide?: boolean
          participants_max?: number | null
          participants_min?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          sdgs?: string[] | null
          secondary_tags?: string[] | null
          services?: Json | null
          short_description?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          extra_services?: Json | null
          id?: string
          image_url?: string | null
          location_type?: string
          nationwide?: boolean
          participants_max?: number | null
          participants_min?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          sdgs?: string[] | null
          secondary_tags?: string[] | null
          services?: Json | null
          short_description?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_formats_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_matching_decisions: {
        Row: {
          association_id: string | null
          context: Json | null
          created_at: string
          decided_by: string | null
          decision: string
          decision_reason: string | null
          format_id: string | null
          id: string
          request_id: string
        }
        Insert: {
          association_id?: string | null
          context?: Json | null
          created_at?: string
          decided_by?: string | null
          decision: string
          decision_reason?: string | null
          format_id?: string | null
          id?: string
          request_id: string
        }
        Update: {
          association_id?: string | null
          context?: Json | null
          created_at?: string
          decided_by?: string | null
          decision?: string
          decision_reason?: string | null
          format_id?: string | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_matching_decisions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_matching_decisions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_matching_decisions_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "tb_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_matching_decisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_matching_decisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_proposals: {
        Row: {
          admin_notes: string | null
          association_visibility: string
          client_decision_at: string | null
          client_notes: string | null
          client_status: string
          created_at: string
          format_id: string
          id: string
          is_active: boolean
          override_association_id: string | null
          priority: number
          request_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          association_visibility?: string
          client_decision_at?: string | null
          client_notes?: string | null
          client_status?: string
          created_at?: string
          format_id: string
          id?: string
          is_active?: boolean
          override_association_id?: string | null
          priority?: number
          request_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          association_visibility?: string
          client_decision_at?: string | null
          client_notes?: string | null
          client_status?: string
          created_at?: string
          format_id?: string
          id?: string
          is_active?: boolean
          override_association_id?: string | null
          priority?: number
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_proposals_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "tb_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_proposals_override_association_id_fkey"
            columns: ["override_association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_proposals_override_association_id_fkey"
            columns: ["override_association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_quote_items: {
        Row: {
          association_id: string | null
          created_at: string
          description: string
          display_order: number
          id: string
          notes: string | null
          proposal_id: string | null
          quantity: number
          quote_id: string
          total_ets: number | null
          total_final: number | null
          unit_price_ets: number | null
          unit_price_final: number | null
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          description: string
          display_order?: number
          id?: string
          notes?: string | null
          proposal_id?: string | null
          quantity?: number
          quote_id: string
          total_ets?: number | null
          total_final?: number | null
          unit_price_ets?: number | null
          unit_price_final?: number | null
        }
        Update: {
          association_id?: string | null
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          notes?: string | null
          proposal_id?: string | null
          quantity?: number
          quote_id?: string
          total_ets?: number | null
          total_final?: number | null
          unit_price_ets?: number | null
          unit_price_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_quote_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_quote_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_quote_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "tb_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "tb_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_quotes: {
        Row: {
          bravo_margin_amount: number | null
          bravo_margin_percent: number | null
          client_decision_notes: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          id: string
          pdf_url: string | null
          request_id: string
          sent_at: string | null
          status: string
          terms_text: string | null
          total_amount_ets: number | null
          total_amount_final: number | null
          updated_at: string
          valid_until: string | null
          version: number
          viewed_at: string | null
        }
        Insert: {
          bravo_margin_amount?: number | null
          bravo_margin_percent?: number | null
          client_decision_notes?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          pdf_url?: string | null
          request_id: string
          sent_at?: string | null
          status?: string
          terms_text?: string | null
          total_amount_ets?: number | null
          total_amount_final?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Update: {
          bravo_margin_amount?: number | null
          bravo_margin_percent?: number | null
          client_decision_notes?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          pdf_url?: string | null
          request_id?: string
          sent_at?: string | null
          status?: string
          terms_text?: string | null
          total_amount_ets?: number | null
          total_amount_final?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_request_status_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_request_status_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_request_status_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tb_requests_with_status_since"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_requests: {
        Row: {
          assigned_admin_id: string | null
          budget_estimate: number | null
          company_id: string
          created_at: string
          description: string | null
          extra_services: Json | null
          id: string
          internal_notes: string | null
          notes: string | null
          participants_max: number | null
          participants_min: number | null
          preferred_city_id: string | null
          preferred_location_type: string | null
          preferred_period_from: string | null
          preferred_period_to: string | null
          requested_by: string
          state: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          budget_estimate?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          extra_services?: Json | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          participants_max?: number | null
          participants_min?: number | null
          preferred_city_id?: string | null
          preferred_location_type?: string | null
          preferred_period_from?: string | null
          preferred_period_to?: string | null
          requested_by: string
          state?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          budget_estimate?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          extra_services?: Json | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          participants_max?: number | null
          participants_min?: number | null
          preferred_city_id?: string | null
          preferred_location_type?: string | null
          preferred_period_from?: string | null
          preferred_period_to?: string | null
          requested_by?: string
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_requests_preferred_city_id_fkey"
            columns: ["preferred_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          association_id: string | null
          company_id: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      associations_public: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      tb_requests_with_status_since: {
        Row: {
          assigned_admin_id: string | null
          budget_estimate: number | null
          company_id: string | null
          created_at: string | null
          description: string | null
          extra_services: Json | null
          id: string | null
          internal_notes: string | null
          notes: string | null
          participants_max: number | null
          participants_min: number | null
          preferred_city_id: string | null
          preferred_location_type: string | null
          preferred_period_from: string | null
          preferred_period_to: string | null
          requested_by: string | null
          status: string | null
          status_since: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_admin_id?: string | null
          budget_estimate?: number | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          extra_services?: Json | null
          id?: string | null
          internal_notes?: string | null
          notes?: string | null
          participants_max?: number | null
          participants_min?: number | null
          preferred_city_id?: string | null
          preferred_location_type?: string | null
          preferred_period_from?: string | null
          preferred_period_to?: string | null
          requested_by?: string | null
          status?: string | null
          status_since?: never
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_admin_id?: string | null
          budget_estimate?: number | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          extra_services?: Json | null
          id?: string | null
          internal_notes?: string | null
          notes?: string | null
          participants_max?: number | null
          participants_min?: number | null
          preferred_city_id?: string | null
          preferred_location_type?: string | null
          preferred_period_from?: string | null
          preferred_period_to?: string | null
          requested_by?: string | null
          status?: string | null
          status_since?: never
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tb_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_requests_preferred_city_id_fkey"
            columns: ["preferred_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      v_volunteering_company_impact: {
        Row: {
          avg_hours_per_participant: number | null
          avg_rating: number | null
          cities_count: number | null
          company_id: string | null
          distinct_experiences: number | null
          ets_count: number | null
          participation_rate: number | null
          registered_users: number | null
          reviews_count: number | null
          sdgs_touched: string[] | null
          total_hours: number | null
          total_participations: number | null
          unique_participants: number | null
          would_recommend_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_volunteering_company_kpi_breakdown: {
        Row: {
          company_id: string | null
          experience_id: string | null
          kpi_id: string | null
          kpi_label: string | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_dates_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_volunteering_employee_impact: {
        Row: {
          company_id: string | null
          distinct_experiences: number | null
          last_participation_at: string | null
          sdgs_touched: string[] | null
          total_hours: number | null
          total_participations: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_volunteering_employee_kpi_contributions: {
        Row: {
          company_id: string | null
          experience_id: string | null
          kpi_id: string | null
          kpi_label: string | null
          total_value: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_dates_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_save_tb_quote_draft: {
        Args: {
          p_bravo_margin_amount: number
          p_bravo_margin_percent: number
          p_items: Json
          p_quote_id: string
          p_request_id: string
          p_terms_text: string
          p_total_amount_ets: number
          p_total_amount_final: number
          p_valid_until: string
        }
        Returns: string
      }
      admin_send_tb_quote: { Args: { p_quote_id: string }; Returns: undefined }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_supersede_and_create_new_version: {
        Args: { p_old_quote_id: string }
        Returns: {
          new_quote_id: string
          previous_client_notes: string
          previous_decided_at: string
        }[]
      }
      can_employee_see_experience: {
        Args: { p_experience_id: string; p_user_id: string }
        Returns: boolean
      }
      check_hour_budget: {
        Args: { p_experience_date_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_confirmed_bookings_count: {
        Args: { exp_date_id: string }
        Returns: number
      }
      get_my_role: { Args: never; Returns: string }
      get_role_from_jwt: { Args: never; Returns: string }
      get_tb_proposal_details: {
        Args: { p_request_id: string }
        Returns: {
          client_notes: string
          client_status: string
          format_category_id: string
          format_category_name: string
          format_description: string
          format_duration_hours: number
          format_id: string
          format_image_url: string
          format_location_type: string
          format_participants_max: number
          format_participants_min: number
          format_sdgs: string[]
          format_secondary_tags: string[]
          format_services: Json
          format_short_description: string
          format_title: string
          priority: number
          proposal_id: string
        }[]
      }
      get_tb_quote_for_hr: {
        Args: { p_request_id: string }
        Returns: {
          client_decision_notes: string
          created_at: string
          currency: string
          decided_at: string
          id: string
          request_id: string
          sent_at: string
          status: string
          terms_text: string
          total_amount_final: number
          updated_at: string
          valid_until: string
          version: number
          viewed_at: string
        }[]
      }
      get_tb_quote_full_for_admin: {
        Args: { p_quote_id: string }
        Returns: {
          bravo_margin_amount: number
          bravo_margin_percent: number
          client_decision_notes: string
          created_at: string
          created_by: string
          decided_at: string
          id: string
          pdf_url: string
          request_id: string
          sent_at: string
          status: string
          terms_text: string
          total_amount_ets: number
          total_amount_final: number
          updated_at: string
          valid_until: string
          version: number
          viewed_at: string
        }[]
      }
      get_tb_quote_history_for_admin: {
        Args: { p_request_id: string }
        Returns: {
          client_decision_notes: string
          created_at: string
          decided_at: string
          id: string
          sent_at: string
          status: string
          total_amount_ets: number
          total_amount_final: number
          updated_at: string
          version: number
        }[]
      }
      get_tb_quote_items_for_hr: {
        Args: { p_quote_id: string }
        Returns: {
          description: string
          display_order: number
          id: string
          notes: string
          quantity: number
          quote_id: string
          total_final: number
          unit_price_final: number
        }[]
      }
      get_tb_quote_items_full_for_admin: {
        Args: { p_quote_id: string }
        Returns: {
          association_id: string
          created_at: string
          description: string
          display_order: number
          id: string
          notes: string
          proposal_id: string
          quantity: number
          quote_id: string
          total_ets: number
          total_final: number
          unit_price_ets: number
          unit_price_final: number
        }[]
      }
      get_tb_request_current_status_since: {
        Args: { p_request_id: string }
        Returns: string
      }
      get_tb_request_status_log_for_admin: {
        Args: { p_request_id: string }
        Returns: {
          changed_at: string
          changed_by: string
          changed_by_name: string
          from_status: string
          id: string
          note: string
          to_status: string
        }[]
      }
      get_user_association_id: { Args: { user_uuid: string }; Returns: string }
      get_user_company_id: { Args: { user_uuid: string }; Returns: string }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hr_decide_on_quote: {
        Args: { p_decision: string; p_notes?: string; p_quote_id: string }
        Returns: undefined
      }
      hr_has_historical_booking_for_date: {
        Args: { _date_id: string; _user_id: string }
        Returns: boolean
      }
      hr_mark_tb_quote_viewed: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
      increment_access_code_usage: {
        Args: { p_code: string }
        Returns: boolean
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_association_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_booking_cancellable: {
        Args: { booking_uuid: string }
        Returns: boolean
      }
      is_experience_date_available: {
        Args: { exp_date_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { user_uuid: string }; Returns: boolean }
      make_current_fiscal_year_start: {
        Args: { p_fiscal_start: string }
        Returns: string
      }
      match_tb_formats_for_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      process_completed_events: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      regenerate_suggestion_token: { Args: never; Returns: string }
      set_manager_notification_advance_days: {
        Args: { p_days: number }
        Returns: undefined
      }
      validate_access_code: {
        Args: { p_code: string }
        Returns: {
          assigned_role: string
          entity_id: string
          entity_name: string
          entity_type: string
        }[]
      }
      validate_company_access_code: {
        Args: { code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      access_request_status: "pending" | "contacted" | "closed"
      access_request_type:
        | "employee_needs_code"
        | "company_lead"
        | "association_lead"
        | "individual_waitlist"
      app_role: "employee" | "hr_admin" | "association_admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_request_status: ["pending", "contacted", "closed"],
      access_request_type: [
        "employee_needs_code",
        "company_lead",
        "association_lead",
        "individual_waitlist",
      ],
      app_role: ["employee", "hr_admin", "association_admin", "super_admin"],
    },
  },
} as const
