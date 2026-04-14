import { Database } from "../../../types/database";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

import { supabase } from "../../../lib/supabase";

export const fetchTrips = async (userId: string) => {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []) as Trip[];
};

export const createTripApi = async (name: string, userId: string) => {
  const { data, error } = await supabase
    .from("trips")
    .insert([{ name, user_id: userId }])
    .select();

  if (error) throw error;

  return data?.[0] as Trip;
};

export const deleteTripApi = async (id: string) => {
  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) throw error;
};