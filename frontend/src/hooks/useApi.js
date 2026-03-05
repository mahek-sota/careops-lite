const API = "http://localhost:4000";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  // if (res.status === 401) {
  //   window.location.href = "/login";
  //   return;
  // }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}