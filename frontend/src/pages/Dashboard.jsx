import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import UploadCard from "../components/UploadCard";
import InventoryCard from "../components/InventoryCard";
import InvoiceCard from "../components/InvoiceCard";
import SellCard from "../components/SellCard";
import Button from "../components/Button";

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const addToast = useToast();
  const { t } = useTranslation();
  const [view, setView] = useState("upload");

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [search, setSearch] = useState("");

  const [resetting, setResetting] = useState(false);

  async function fetchInventory() {
    try {
      setLoadingInventory(true);
      const res = await axios.get(`${API_BASE}/inventory`);
      setInventory(res.data.inventory || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to load inventory. Is the backend running?", "error");
    } finally {
      setLoadingInventory(false);
    }
  }

  async function fetchInvoices() {
    try {
      setLoadingInvoices(true);
      const res = await axios.get(`${API_BASE}/invoices`);
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to load invoices. Is the backend running?", "error");
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function handleResetAll() {
    if (!window.confirm(t("confirm_reset_all_data"))) {
      return;
    }

    try {
      setResetting(true);
      await axios.delete(`${API_BASE}/reset`);
      addToast("All invoices and inventory cleared.", "success");
      setSelectedInvoice(null);
      await fetchInventory();
      await fetchInvoices();
    } catch (err) {
      console.error(err);
      addToast("Failed to reset data. Check backend.", "error");
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    fetchInventory();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!uploadSuccess) return;
    const t = setTimeout(() => setUploadSuccess(false), 4000);
    return () => clearTimeout(t);
  }, [uploadSuccess]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      addToast("Please select a PDF file first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadResult(null);
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
      setUploadSuccess(true);
      await fetchInventory();
      await fetchInvoices();
    } catch (err) {
      console.error(err);
      addToast("Upload failed. Check backend logs.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-950 bg-gradient-to-br from-surface-950 via-surface-900/30 to-surface-950">
      <Sidebar currentView={view} onNavigate={setView} />

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {uploadSuccess && view === "upload" && (
              <div
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
                role="status"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("invoice_uploaded_inventory_updated")}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={handleResetAll}
                disabled={resetting || loadingInventory || loadingInvoices}
              >
                {resetting ? t("resetting") : t("reset_all_data")}
              </Button>
            </div>
          </div>

          {view === "upload" && (
            <div className="animate-fade-in">
              <UploadCard
                file={file}
                setFile={setFile}
                uploading={uploading}
                onUpload={handleUpload}
                uploadResult={uploadResult}
              />
            </div>
          )}

          {view === "inventory" && (
            <div className="animate-fade-in">
              <InventoryCard
                inventory={inventory}
                loading={loadingInventory}
                search={search}
                setSearch={setSearch}
                onRefresh={fetchInventory}
              />
            </div>
          )}

          {view === "invoices" && (
            <div className="animate-fade-in">
              <InvoiceCard
                invoices={invoices}
                loading={loadingInvoices}
                selectedInvoice={selectedInvoice}
                setSelectedInvoice={setSelectedInvoice}
                onRefresh={fetchInvoices}
              />
            </div>
          )}

          {view === "sell" && (
            <div className="animate-fade-in">
              <SellCard onSaleSuccess={fetchInventory} />
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-500">{t("home")}</Link>
          <span className="mx-2">·</span>
          FastAPI + MongoDB + React
        </footer>
      </main>
    </div>
  );
}
