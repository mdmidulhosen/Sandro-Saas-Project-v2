import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://sandro-backend.vercel.app/api",
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export const templatesApi = {
  getAll: () => api.get("/templates").then((r) => r.data),
  getById: (id) => api.get(`/templates/${id}`).then((r) => r.data),
  create: (data) => api.post("/templates", data).then((r) => r.data),
  update: (id, data) => api.put(`/templates/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/templates/${id}`).then((r) => r.data),
};

export const excelApi = {
  parse: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post("/excel/parse", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
