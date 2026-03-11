import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";

interface HourBudgetResult {
  budgetHours: number;
  usedHours: number;
  remainingHours: number;
  isUnlimited: boolean;
  loading: boolean;
}

export function useHourBudget(): HourBudgetResult {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetHours, setBudgetHours] = useState(0);
  const [usedHours, setUsedHours] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(true);

  useEffect(() => {
    if (!user?.id || !profile?.company_id) {
      setLoading(false);
      return;
    }

    const fetchBudget = async () => {
      setLoading(true);
      try {
        // Fetch hour budget for company
        const { data: budgetData } = await supabase
          .from("hour_budgets")
          .select("hours_per_employee_year, fiscal_year_start")
          .eq("company_id", profile.company_id!)
          .order("created_at", { ascending: false })
          .limit(1);

        const budget = budgetData?.[0];

        if (!budget || !budget.hours_per_employee_year || budget.hours_per_employee_year <= 0) {
          setIsUnlimited(true);
          setBudgetHours(0);
          setUsedHours(0);
          setLoading(false);
          return;
        }

        setIsUnlimited(false);
        setBudgetHours(Number(budget.hours_per_employee_year));

        // Calculate fiscal year range
        const fiscalStart = new Date(budget.fiscal_year_start);
        const fiscalMonth = fiscalStart.getMonth();
        const fiscalDay = fiscalStart.getDate();
        const now = new Date();
        let yearStart = new Date(now.getFullYear(), fiscalMonth, fiscalDay);
        if (yearStart > now) {
          yearStart = new Date(now.getFullYear() - 1, fiscalMonth, fiscalDay);
        }
        const yearEnd = new Date(yearStart.getFullYear() + 1, fiscalMonth, fiscalDay);

        // Sum volunteer_hours from confirmed/completed bookings in fiscal year
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("experience_date_id, experience_dates(volunteer_hours, start_datetime)")
          .eq("user_id", user.id)
          .in("status", ["confirmed", "completed"]);

        let totalUsed = 0;
        (bookingsData || []).forEach((b: any) => {
          const ed = b.experience_dates;
          if (!ed) return;
          const startDt = new Date(ed.start_datetime);
          if (startDt >= yearStart && startDt < yearEnd) {
            totalUsed += Number(ed.volunteer_hours) || 0;
          }
        });

        setUsedHours(totalUsed);
      } catch (error) {
        devLog.error("Error fetching hour budget:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [user?.id, profile?.company_id]);

  return {
    budgetHours,
    usedHours,
    remainingHours: isUnlimited ? Infinity : Math.max(0, budgetHours - usedHours),
    isUnlimited,
    loading,
  };
}
