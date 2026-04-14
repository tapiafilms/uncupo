import { supabase } from "../../../lib/supabase";

export const getTrips = async () => {
  const { data, error } = await supabase.from("trips").select("*");

  if (error) {
    throw error;
  }

  return data;
};