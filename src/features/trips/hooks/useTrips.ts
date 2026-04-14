import { Database } from "../../../types/database";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTrips,
  createTripApi,
  deleteTripApi,
} from "../api/tripsApi";
import { supabase } from "../../../lib/supabase";

export const useTrips = () => {
  const queryClient = useQueryClient();

  const { data: trips = [] as Trip[], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      return fetchTrips(user.id);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tripName: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user");

      return createTripApi(tripName, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTripApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  return {
    trips,
    loading: isLoading || createMutation.isPending,
    createTrip: createMutation.mutate,
    deleteTrip: deleteMutation.mutate,
  };
};