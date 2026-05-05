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
      alert_history: {
        Row: {
          alert_id: string | null
          alert_type: string
          cidade: string
          email_sent: boolean | null
          id: string
          message: string
          sent_at: string
          threshold_value: number | null
          triggered_value: number
          uf: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          alert_type: string
          cidade: string
          email_sent?: boolean | null
          id?: string
          message: string
          sent_at?: string
          threshold_value?: number | null
          triggered_value: number
          uf: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          alert_type?: string
          cidade?: string
          email_sent?: boolean | null
          id?: string
          message?: string
          sent_at?: string
          threshold_value?: number | null
          triggered_value?: number
          uf?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "idi_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_results: {
        Row: {
          analysis_type: string | null
          avg_price_m2: number | null
          competitors_count: number | null
          generated_at: string
          gross_revenue: number | null
          id: string
          market_demand: number | null
          net_profit: number | null
          payback_months: number | null
          profit_margin: number | null
          project_id: string
          recommendations: Json | null
          risk_factors: Json | null
          risk_level: string | null
          risk_score: number | null
          scenarios: Json | null
          supply_demand_ratio: number | null
          tir: number | null
          total_investment: number | null
          viability_status: string | null
          vpl: number | null
        }
        Insert: {
          analysis_type?: string | null
          avg_price_m2?: number | null
          competitors_count?: number | null
          generated_at?: string
          gross_revenue?: number | null
          id?: string
          market_demand?: number | null
          net_profit?: number | null
          payback_months?: number | null
          profit_margin?: number | null
          project_id: string
          recommendations?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          scenarios?: Json | null
          supply_demand_ratio?: number | null
          tir?: number | null
          total_investment?: number | null
          viability_status?: string | null
          vpl?: number | null
        }
        Update: {
          analysis_type?: string | null
          avg_price_m2?: number | null
          competitors_count?: number | null
          generated_at?: string
          gross_revenue?: number | null
          id?: string
          market_demand?: number | null
          net_profit?: number | null
          payback_months?: number | null
          profit_margin?: number | null
          project_id?: string
          recommendations?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          scenarios?: Json | null
          supply_demand_ratio?: number | null
          tir?: number | null
          total_investment?: number | null
          viability_status?: string | null
          vpl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_data: {
        Row: {
          address: string | null
          amenities: string[] | null
          available_units: number | null
          avg_price_m2: number | null
          avg_ticket: number | null
          city: string
          confidence_level: string | null
          created_at: string
          data_date: string | null
          delivery_date: string | null
          developer: string | null
          differentials: string[] | null
          id: string
          launch_date: string | null
          market_research_id: string | null
          max_ticket: number | null
          min_ticket: number | null
          name: string
          neighborhood: string | null
          notes: string | null
          project_id: string
          sold_units: number | null
          source: string | null
          source_url: string | null
          total_units: number | null
          uf: string
          unit_types: Json | null
          updated_at: string
          vso_monthly: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          available_units?: number | null
          avg_price_m2?: number | null
          avg_ticket?: number | null
          city: string
          confidence_level?: string | null
          created_at?: string
          data_date?: string | null
          delivery_date?: string | null
          developer?: string | null
          differentials?: string[] | null
          id?: string
          launch_date?: string | null
          market_research_id?: string | null
          max_ticket?: number | null
          min_ticket?: number | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          project_id: string
          sold_units?: number | null
          source?: string | null
          source_url?: string | null
          total_units?: number | null
          uf: string
          unit_types?: Json | null
          updated_at?: string
          vso_monthly?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          available_units?: number | null
          avg_price_m2?: number | null
          avg_ticket?: number | null
          city?: string
          confidence_level?: string | null
          created_at?: string
          data_date?: string | null
          delivery_date?: string | null
          developer?: string | null
          differentials?: string[] | null
          id?: string
          launch_date?: string | null
          market_research_id?: string | null
          max_ticket?: number | null
          min_ticket?: number | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          project_id?: string
          sold_units?: number | null
          source?: string | null
          source_url?: string | null
          total_units?: number | null
          uf?: string
          unit_types?: Json | null
          updated_at?: string
          vso_monthly?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_data_market_research_id_fkey"
            columns: ["market_research_id"]
            isOneToOne: false
            referencedRelation: "market_research_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      idi_alerts: {
        Row: {
          alert_type: string
          cidade: string
          created_at: string
          enabled: boolean
          id: string
          last_triggered_at: string | null
          threshold_value: number
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          cidade: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          threshold_value?: number
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          cidade?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          threshold_value?: number
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      idi_datazap_reports: {
        Row: {
          cidades_em_alta: Json | null
          cidades_em_queda: Json | null
          data_importacao: string | null
          data_publicacao: string
          descricao: string | null
          dias_venda_media: number | null
          id: string
          indice_demanda: number | null
          indice_oferta: number | null
          pdf_url: string | null
          preco_medio_nacional: number | null
          tipo_relatorio: string
          titulo: string | null
          variacao_nacional_mes: number | null
          volume_total_anuncios: number | null
        }
        Insert: {
          cidades_em_alta?: Json | null
          cidades_em_queda?: Json | null
          data_importacao?: string | null
          data_publicacao: string
          descricao?: string | null
          dias_venda_media?: number | null
          id?: string
          indice_demanda?: number | null
          indice_oferta?: number | null
          pdf_url?: string | null
          preco_medio_nacional?: number | null
          tipo_relatorio: string
          titulo?: string | null
          variacao_nacional_mes?: number | null
          volume_total_anuncios?: number | null
        }
        Update: {
          cidades_em_alta?: Json | null
          cidades_em_queda?: Json | null
          data_importacao?: string | null
          data_publicacao?: string
          descricao?: string | null
          dias_venda_media?: number | null
          id?: string
          indice_demanda?: number | null
          indice_oferta?: number | null
          pdf_url?: string | null
          preco_medio_nacional?: number | null
          tipo_relatorio?: string
          titulo?: string | null
          variacao_nacional_mes?: number | null
          volume_total_anuncios?: number | null
        }
        Relationships: []
      }
      idi_fipezap_historico: {
        Row: {
          cidade: string
          data_importacao: string | null
          fonte: string | null
          id: string
          indice_locacao: number | null
          indice_venda: number | null
          mes: string
          preco_m2_locacao: number | null
          preco_m2_venda: number | null
          tipo_imovel: string
          uf: string
          variacao_locacao_12m: number | null
          variacao_locacao_mes: number | null
          variacao_venda_12m: number | null
          variacao_venda_mes: number | null
        }
        Insert: {
          cidade: string
          data_importacao?: string | null
          fonte?: string | null
          id?: string
          indice_locacao?: number | null
          indice_venda?: number | null
          mes: string
          preco_m2_locacao?: number | null
          preco_m2_venda?: number | null
          tipo_imovel?: string
          uf: string
          variacao_locacao_12m?: number | null
          variacao_locacao_mes?: number | null
          variacao_venda_12m?: number | null
          variacao_venda_mes?: number | null
        }
        Update: {
          cidade?: string
          data_importacao?: string | null
          fonte?: string | null
          id?: string
          indice_locacao?: number | null
          indice_venda?: number | null
          mes?: string
          preco_m2_locacao?: number | null
          preco_m2_venda?: number | null
          tipo_imovel?: string
          uf?: string
          variacao_locacao_12m?: number | null
          variacao_locacao_mes?: number | null
          variacao_venda_12m?: number | null
          variacao_venda_mes?: number | null
        }
        Relationships: []
      }
      idi_macro_indicadores: {
        Row: {
          confianca_consumidor: number | null
          data_importacao: string | null
          data_referencia: string
          fonte: string | null
          id: string
          igpm_acumulado_12m: number | null
          igpm_mes: number | null
          incc_acumulado_12m: number | null
          incc_mes: number | null
          ipca_acumulado_12m: number | null
          ipca_mes: number | null
          pib_variacao_12m: number | null
          pib_variacao_trimestre: number | null
          selic_acumulada_mes: number | null
          selic_meta: number | null
          taxa_desemprego: number | null
        }
        Insert: {
          confianca_consumidor?: number | null
          data_importacao?: string | null
          data_referencia: string
          fonte?: string | null
          id?: string
          igpm_acumulado_12m?: number | null
          igpm_mes?: number | null
          incc_acumulado_12m?: number | null
          incc_mes?: number | null
          ipca_acumulado_12m?: number | null
          ipca_mes?: number | null
          pib_variacao_12m?: number | null
          pib_variacao_trimestre?: number | null
          selic_acumulada_mes?: number | null
          selic_meta?: number | null
          taxa_desemprego?: number | null
        }
        Update: {
          confianca_consumidor?: number | null
          data_importacao?: string | null
          data_referencia?: string
          fonte?: string | null
          id?: string
          igpm_acumulado_12m?: number | null
          igpm_mes?: number | null
          incc_acumulado_12m?: number | null
          incc_mes?: number | null
          ipca_acumulado_12m?: number | null
          ipca_mes?: number | null
          pib_variacao_12m?: number | null
          pib_variacao_trimestre?: number | null
          selic_acumulada_mes?: number | null
          selic_meta?: number | null
          taxa_desemprego?: number | null
        }
        Relationships: []
      }
      idi_mercado_snapshot: {
        Row: {
          anuncios_ativos: number | null
          anuncios_novos_dia: number | null
          apartamentos_pct: number | null
          bairro: string | null
          casas_pct: number | null
          cidade: string
          comercial_pct: number | null
          data_coleta: string
          dias_venda_media: number | null
          fonte: string | null
          id: string
          preco_m2_max: number | null
          preco_m2_medio: number | null
          preco_m2_min: number | null
          uf: string
        }
        Insert: {
          anuncios_ativos?: number | null
          anuncios_novos_dia?: number | null
          apartamentos_pct?: number | null
          bairro?: string | null
          casas_pct?: number | null
          cidade: string
          comercial_pct?: number | null
          data_coleta?: string
          dias_venda_media?: number | null
          fonte?: string | null
          id?: string
          preco_m2_max?: number | null
          preco_m2_medio?: number | null
          preco_m2_min?: number | null
          uf: string
        }
        Update: {
          anuncios_ativos?: number | null
          anuncios_novos_dia?: number | null
          apartamentos_pct?: number | null
          bairro?: string | null
          casas_pct?: number | null
          cidade?: string
          comercial_pct?: number | null
          data_coleta?: string
          dias_venda_media?: number | null
          fonte?: string | null
          id?: string
          preco_m2_max?: number | null
          preco_m2_medio?: number | null
          preco_m2_min?: number | null
          uf?: string
        }
        Relationships: []
      }
      idi_score_cache: {
        Row: {
          atualizado_em: string | null
          cidade: string
          confianca_score: number | null
          fontes_utilizadas: Json | null
          id: string
          mes: string
          ranking_estadual: number | null
          ranking_nacional: number | null
          score_demanda: number | null
          score_idi: number | null
          score_idi_normalizado: number | null
          score_liquidez: number | null
          score_macro: number | null
          score_preco: number | null
          score_variacao: number | null
          tipo_imovel: string
          uf: string
        }
        Insert: {
          atualizado_em?: string | null
          cidade: string
          confianca_score?: number | null
          fontes_utilizadas?: Json | null
          id?: string
          mes: string
          ranking_estadual?: number | null
          ranking_nacional?: number | null
          score_demanda?: number | null
          score_idi?: number | null
          score_idi_normalizado?: number | null
          score_liquidez?: number | null
          score_macro?: number | null
          score_preco?: number | null
          score_variacao?: number | null
          tipo_imovel?: string
          uf: string
        }
        Update: {
          atualizado_em?: string | null
          cidade?: string
          confianca_score?: number | null
          fontes_utilizadas?: Json | null
          id?: string
          mes?: string
          ranking_estadual?: number | null
          ranking_nacional?: number | null
          score_demanda?: number | null
          score_idi?: number | null
          score_idi_normalizado?: number | null
          score_liquidez?: number | null
          score_macro?: number | null
          score_preco?: number | null
          score_variacao?: number | null
          tipo_imovel?: string
          uf?: string
        }
        Relationships: []
      }
      market_data: {
        Row: {
          absorption_rate: number | null
          avg_price_m2: number | null
          city: string
          demand_index: number | null
          expires_at: string
          fetched_at: string
          id: string
          ipca_12m: number | null
          neighborhood: string | null
          pib_growth: number | null
          price_variation_12m: number | null
          selic_rate: number | null
          source: string | null
          supply_units: number | null
          uf: string
        }
        Insert: {
          absorption_rate?: number | null
          avg_price_m2?: number | null
          city: string
          demand_index?: number | null
          expires_at?: string
          fetched_at?: string
          id?: string
          ipca_12m?: number | null
          neighborhood?: string | null
          pib_growth?: number | null
          price_variation_12m?: number | null
          selic_rate?: number | null
          source?: string | null
          supply_units?: number | null
          uf: string
        }
        Update: {
          absorption_rate?: number | null
          avg_price_m2?: number | null
          city?: string
          demand_index?: number | null
          expires_at?: string
          fetched_at?: string
          id?: string
          ipca_12m?: number | null
          neighborhood?: string | null
          pib_growth?: number | null
          price_variation_12m?: number | null
          selic_rate?: number | null
          source?: string | null
          supply_units?: number | null
          uf?: string
        }
        Relationships: []
      }
      market_research_reports: {
        Row: {
          best_neighborhoods: Json | null
          buyer_profile: Json | null
          city_analysis: string | null
          city_data: Json | null
          competition_analysis: string | null
          competitors: Json | null
          created_at: string
          data_sources: Json | null
          demand_analysis: string | null
          demand_data: Json | null
          error_message: string | null
          final_verdict: string | null
          generation_progress: number | null
          id: string
          macro_data: Json | null
          macro_generated_at: string | null
          macro_summary: string | null
          market_conclusion: string | null
          neighborhood_analysis: string | null
          neighborhood_data: Json | null
          price_by_segment: Json | null
          product_adequacy: string | null
          product_adequacy_justification: string | null
          project_id: string
          sales_velocity_scenarios: Json | null
          status: string | null
          updated_at: string
          user_id: string
          velocity_analysis: string | null
        }
        Insert: {
          best_neighborhoods?: Json | null
          buyer_profile?: Json | null
          city_analysis?: string | null
          city_data?: Json | null
          competition_analysis?: string | null
          competitors?: Json | null
          created_at?: string
          data_sources?: Json | null
          demand_analysis?: string | null
          demand_data?: Json | null
          error_message?: string | null
          final_verdict?: string | null
          generation_progress?: number | null
          id?: string
          macro_data?: Json | null
          macro_generated_at?: string | null
          macro_summary?: string | null
          market_conclusion?: string | null
          neighborhood_analysis?: string | null
          neighborhood_data?: Json | null
          price_by_segment?: Json | null
          product_adequacy?: string | null
          product_adequacy_justification?: string | null
          project_id: string
          sales_velocity_scenarios?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          velocity_analysis?: string | null
        }
        Update: {
          best_neighborhoods?: Json | null
          buyer_profile?: Json | null
          city_analysis?: string | null
          city_data?: Json | null
          competition_analysis?: string | null
          competitors?: Json | null
          created_at?: string
          data_sources?: Json | null
          demand_analysis?: string | null
          demand_data?: Json | null
          error_message?: string | null
          final_verdict?: string | null
          generation_progress?: number | null
          id?: string
          macro_data?: Json | null
          macro_generated_at?: string | null
          macro_summary?: string | null
          market_conclusion?: string | null
          neighborhood_analysis?: string | null
          neighborhood_data?: Json | null
          price_by_segment?: Json | null
          product_adequacy?: string | null
          product_adequacy_justification?: string | null
          project_id?: string
          sales_velocity_scenarios?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          velocity_analysis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_research_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          alert_type: string
          city: string
          created_at: string
          enabled: boolean
          id: string
          threshold: number
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          city: string
          created_at?: string
          enabled?: boolean
          id?: string
          threshold?: number
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          city?: string
          created_at?: string
          enabled?: boolean
          id?: string
          threshold?: number
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_inputs: {
        Row: {
          adjustable_costs: Json | null
          approval_costs: number | null
          certifications: Json | null
          construction_cost_m2_calculated: number | null
          construction_cost_source: string | null
          construction_months: number | null
          contingency_percent: number | null
          created_at: string
          discount_rate: number | null
          estimated_launch_velocity: number | null
          financing_rate: number | null
          id: string
          infrastructure_costs: number | null
          land_acquisition_type: string | null
          land_cost: number | null
          launch_date: string | null
          launch_months: number | null
          permuta_units: number | null
          project_costs: number | null
          project_id: string
          sales_velocity: number | null
          sustainability_initiatives: Json | null
          tipo_unidades: Json | null
          unit_areas: Json | null
          unit_distribution: Json | null
          unit_prices: Json | null
          updated_at: string
          usufruto_years: number | null
        }
        Insert: {
          adjustable_costs?: Json | null
          approval_costs?: number | null
          certifications?: Json | null
          construction_cost_m2_calculated?: number | null
          construction_cost_source?: string | null
          construction_months?: number | null
          contingency_percent?: number | null
          created_at?: string
          discount_rate?: number | null
          estimated_launch_velocity?: number | null
          financing_rate?: number | null
          id?: string
          infrastructure_costs?: number | null
          land_acquisition_type?: string | null
          land_cost?: number | null
          launch_date?: string | null
          launch_months?: number | null
          permuta_units?: number | null
          project_costs?: number | null
          project_id: string
          sales_velocity?: number | null
          sustainability_initiatives?: Json | null
          tipo_unidades?: Json | null
          unit_areas?: Json | null
          unit_distribution?: Json | null
          unit_prices?: Json | null
          updated_at?: string
          usufruto_years?: number | null
        }
        Update: {
          adjustable_costs?: Json | null
          approval_costs?: number | null
          certifications?: Json | null
          construction_cost_m2_calculated?: number | null
          construction_cost_source?: string | null
          construction_months?: number | null
          contingency_percent?: number | null
          created_at?: string
          discount_rate?: number | null
          estimated_launch_velocity?: number | null
          financing_rate?: number | null
          id?: string
          infrastructure_costs?: number | null
          land_acquisition_type?: string | null
          land_cost?: number | null
          launch_date?: string | null
          launch_months?: number | null
          permuta_units?: number | null
          project_costs?: number | null
          project_id?: string
          sales_velocity?: number | null
          sustainability_initiatives?: Json | null
          tipo_unidades?: Json | null
          unit_areas?: Json | null
          unit_distribution?: Json | null
          unit_prices?: Json | null
          updated_at?: string
          usufruto_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          area_terreno_m2: number | null
          avg_unit_size: number | null
          bairro: string | null
          cep: string | null
          city: string
          created_at: string
          delivery_date: string | null
          distribuicao_unidades: Json | null
          id: string
          is_capital: boolean
          launch_date: string | null
          location: string
          lote: string | null
          margin: number
          name: string
          neighborhood: string | null
          neighborhood_id: string | null
          numero: string | null
          padrao_empreendimento: string | null
          permuta_percentual: number | null
          projecao_construcao_meses: number | null
          projecao_lancamento_meses: number | null
          property_type: string
          quadra: string | null
          regime_tributario: string | null
          region_id: string | null
          roi: number
          rua: string | null
          sector_id: string | null
          status: string
          street: string | null
          target_audience: string | null
          tipo_negociacao: string | null
          tipo_negociacao_terreno: string | null
          tipo_unidade: string | null
          total_area: number | null
          total_units: number | null
          uf: string
          updated_at: string
          user_id: string
          valor_terreno: number | null
          venda_entrega_pct: number | null
          venda_lancamento_pct: number | null
          venda_obra_pct: number | null
          vgv: number
          vgv_por_tipo: Json | null
        }
        Insert: {
          address?: string | null
          area_terreno_m2?: number | null
          avg_unit_size?: number | null
          bairro?: string | null
          cep?: string | null
          city: string
          created_at?: string
          delivery_date?: string | null
          distribuicao_unidades?: Json | null
          id?: string
          is_capital?: boolean
          launch_date?: string | null
          location: string
          lote?: string | null
          margin?: number
          name: string
          neighborhood?: string | null
          neighborhood_id?: string | null
          numero?: string | null
          padrao_empreendimento?: string | null
          permuta_percentual?: number | null
          projecao_construcao_meses?: number | null
          projecao_lancamento_meses?: number | null
          property_type: string
          quadra?: string | null
          regime_tributario?: string | null
          region_id?: string | null
          roi?: number
          rua?: string | null
          sector_id?: string | null
          status?: string
          street?: string | null
          target_audience?: string | null
          tipo_negociacao?: string | null
          tipo_negociacao_terreno?: string | null
          tipo_unidade?: string | null
          total_area?: number | null
          total_units?: number | null
          uf: string
          updated_at?: string
          user_id: string
          valor_terreno?: number | null
          venda_entrega_pct?: number | null
          venda_lancamento_pct?: number | null
          venda_obra_pct?: number | null
          vgv?: number
          vgv_por_tipo?: Json | null
        }
        Update: {
          address?: string | null
          area_terreno_m2?: number | null
          avg_unit_size?: number | null
          bairro?: string | null
          cep?: string | null
          city?: string
          created_at?: string
          delivery_date?: string | null
          distribuicao_unidades?: Json | null
          id?: string
          is_capital?: boolean
          launch_date?: string | null
          location?: string
          lote?: string | null
          margin?: number
          name?: string
          neighborhood?: string | null
          neighborhood_id?: string | null
          numero?: string | null
          padrao_empreendimento?: string | null
          permuta_percentual?: number | null
          projecao_construcao_meses?: number | null
          projecao_lancamento_meses?: number | null
          property_type?: string
          quadra?: string | null
          regime_tributario?: string | null
          region_id?: string | null
          roi?: number
          rua?: string | null
          sector_id?: string | null
          status?: string
          street?: string | null
          target_audience?: string | null
          tipo_negociacao?: string | null
          tipo_negociacao_terreno?: string | null
          tipo_unidade?: string | null
          total_area?: number | null
          total_units?: number | null
          uf?: string
          updated_at?: string
          user_id?: string
          valor_terreno?: number | null
          venda_entrega_pct?: number | null
          venda_lancamento_pct?: number | null
          venda_obra_pct?: number | null
          vgv?: number
          vgv_por_tipo?: Json | null
        }
        Relationships: []
      }
      recurring_reports: {
        Row: {
          created_at: string
          id: string
          indicators: Json | null
          month: number | null
          news: Json | null
          quarter: number | null
          report_type: string
          summary: string | null
          title: string
          week_number: number | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          indicators?: Json | null
          month?: number | null
          news?: Json | null
          quarter?: number | null
          report_type: string
          summary?: string | null
          title: string
          week_number?: number | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          indicators?: Json | null
          month?: number | null
          news?: Json | null
          quarter?: number | null
          report_type?: string
          summary?: string | null
          title?: string
          week_number?: number | null
          year?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          absorption_time: number | null
          cash_flow_projection: Json | null
          competitors: Json | null
          created_at: string
          data: Json | null
          financial_risk_score: number | null
          id: string
          market_infrastructure: Json | null
          market_risk: Json | null
          neighborhood_trends: Json | null
          optimistic_payback: number | null
          optimistic_roi: number | null
          optimistic_tir: number | null
          optimistic_vgv: number | null
          pessimistic_payback: number | null
          pessimistic_roi: number | null
          pessimistic_tir: number | null
          pessimistic_vgv: number | null
          project_id: string | null
          projected_payback: number | null
          projected_roi: number | null
          projected_tir: number | null
          projected_vgv: number | null
          sensitivity_analysis: Json | null
          strategic_recommendations: Json | null
          supply_demand_analysis: Json | null
          swot_analysis: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          absorption_time?: number | null
          cash_flow_projection?: Json | null
          competitors?: Json | null
          created_at?: string
          data?: Json | null
          financial_risk_score?: number | null
          id?: string
          market_infrastructure?: Json | null
          market_risk?: Json | null
          neighborhood_trends?: Json | null
          optimistic_payback?: number | null
          optimistic_roi?: number | null
          optimistic_tir?: number | null
          optimistic_vgv?: number | null
          pessimistic_payback?: number | null
          pessimistic_roi?: number | null
          pessimistic_tir?: number | null
          pessimistic_vgv?: number | null
          project_id?: string | null
          projected_payback?: number | null
          projected_roi?: number | null
          projected_tir?: number | null
          projected_vgv?: number | null
          sensitivity_analysis?: Json | null
          strategic_recommendations?: Json | null
          supply_demand_analysis?: Json | null
          swot_analysis?: Json | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          absorption_time?: number | null
          cash_flow_projection?: Json | null
          competitors?: Json | null
          created_at?: string
          data?: Json | null
          financial_risk_score?: number | null
          id?: string
          market_infrastructure?: Json | null
          market_risk?: Json | null
          neighborhood_trends?: Json | null
          optimistic_payback?: number | null
          optimistic_roi?: number | null
          optimistic_tir?: number | null
          optimistic_vgv?: number | null
          pessimistic_payback?: number | null
          pessimistic_roi?: number | null
          pessimistic_tir?: number | null
          pessimistic_vgv?: number | null
          project_id?: string | null
          projected_payback?: number | null
          projected_roi?: number | null
          projected_tir?: number | null
          projected_vgv?: number | null
          sensitivity_analysis?: Json | null
          strategic_recommendations?: Json | null
          supply_demand_analysis?: Json | null
          swot_analysis?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          last_activity: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      viability_parameters: {
        Row: {
          admin_fee_pct: number | null
          balloon_at_keys_pct: number | null
          contingency_pct: number | null
          created_at: string
          cub_adjustment_factor: number | null
          cub_code: string | null
          cub_value: number | null
          discount_rate: number | null
          down_payment_pct: number | null
          engineering_pct: number | null
          id: string
          incorporation_fee_pct: number | null
          insurance_pct: number | null
          legal_expenses_pct: number | null
          marketing_pct: number | null
          monthly_installments: number | null
          project_id: string
          sales_commission_pct: number | null
          sales_management_fee_pct: number | null
          updated_at: string
        }
        Insert: {
          admin_fee_pct?: number | null
          balloon_at_keys_pct?: number | null
          contingency_pct?: number | null
          created_at?: string
          cub_adjustment_factor?: number | null
          cub_code?: string | null
          cub_value?: number | null
          discount_rate?: number | null
          down_payment_pct?: number | null
          engineering_pct?: number | null
          id?: string
          incorporation_fee_pct?: number | null
          insurance_pct?: number | null
          legal_expenses_pct?: number | null
          marketing_pct?: number | null
          monthly_installments?: number | null
          project_id: string
          sales_commission_pct?: number | null
          sales_management_fee_pct?: number | null
          updated_at?: string
        }
        Update: {
          admin_fee_pct?: number | null
          balloon_at_keys_pct?: number | null
          contingency_pct?: number | null
          created_at?: string
          cub_adjustment_factor?: number | null
          cub_code?: string | null
          cub_value?: number | null
          discount_rate?: number | null
          down_payment_pct?: number | null
          engineering_pct?: number | null
          id?: string
          incorporation_fee_pct?: number | null
          insurance_pct?: number | null
          legal_expenses_pct?: number | null
          marketing_pct?: number | null
          monthly_installments?: number | null
          project_id?: string
          sales_commission_pct?: number | null
          sales_management_fee_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viability_parameters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invalidate_other_sessions: {
        Args: { p_current_token: string; p_user_id: string }
        Returns: undefined
      }
      is_session_valid: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
