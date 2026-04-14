import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!email || !password) {
      alert("Completa todos los campos ❌");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Usuario creado 🚀");
      navigate("/"); // 👉 redirige directo
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      alert("Completa todos los campos ❌");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      navigate("/"); // 👉 FIX CLAVE (antes faltaba esto)
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Auth 🔐</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={signUp} disabled={loading}>
        {loading ? "Cargando..." : "Registrarse"}
      </button>

      <button onClick={signIn} disabled={loading}>
        {loading ? "Cargando..." : "Login"}
      </button>
    </div>
  );
}