const API_BASE_URL = "http://localhost:8001";

export async function analyzeFusion(data) {
  const response = await fetch(
    `${API_BASE_URL}/fusion/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Fusion API failed: ${response.status} ${errorText}`
    );
  }

  return await response.json();
}