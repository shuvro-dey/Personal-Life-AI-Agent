import api from "./api";

export const studyService = {
  async getSessions() {
    const res = await api.get("/study/sessions");
    return res.data;
  },

  async createSession(formData) {
    const res = await api.post("/study/sessions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getSessionDetail(sessionId) {
    const res = await api.get(`/study/sessions/${sessionId}`);
    return res.data;
  },

  async deleteSession(sessionId) {
    const res = await api.delete(`/study/sessions/${sessionId}`);
    return res.data;
  },

  async generateAction(sessionId, action, language) {
    const res = await api.post(`/study/sessions/${sessionId}/generate`, {
      action,
      language,
    });
    return res.data;
  },

  async submitQuiz(sessionId, answers) {
    const res = await api.post(`/study/sessions/${sessionId}/quiz/submit`, {
      answers,
    });
    return res.data;
  },

  async chatStream(sessionId, message, onChunk, onDone, onError) {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`/api/study/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.substring(6));
              if (parsed.type === "chunk") {
                onChunk(parsed.text);
              } else if (parsed.type === "done") {
                onDone(parsed.interaction_id);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
      onDone();
    } catch (err) {
      if (onError) onError(err);
    }
  },
};
