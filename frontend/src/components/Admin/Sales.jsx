import React, { useState, useEffect, useCallback } from "react";
import { Search, Eye, ChevronDown, ChevronUp, Filter, Loader2, Save, UserSearch } from "lucide-react";
import Modal from "../Modal";
import Pagination from "./Pagination";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const STATUS_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_separacao: "Em Separacao",
  enviado: "Enviado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const STATUS_COLORS = {
  pendente: "bg-yellow-950 text-yellow-400",
  confirmado: "bg-blue-950 text-blue-400",
  em_separacao: "bg-purple-950 text-purple-400",
  enviado: "bg-indigo-950 text-indigo-400",
  finalizado: "bg-emerald-950 text-emerald-400",
  cancelado: "bg-red-950 text-red-400",
};

const PAGE_SIZE = 15;

export default function Sales() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortByValue, setSortByValue] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersCount: 0,
    ticketMedio: 0,
    finalizados: 0,
  });

  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null });
  const [editableItems, setEditableItems] = useState([]);
  const [editableAddress, setEditableAddress] = useState({
    logradouro: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const [customerEmailLookup, setCustomerEmailLookup] = useState("");
  const [savingItems, setSavingItems] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [linkingCustomer, setLinkingCustomer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mapOrder = useCallback((o) => {
    const addressFromSnapshot = o.endereco_entrega || null;
    const addressFromUser = o.usuario?.enderecos?.[0] || null;
    const resolvedAddress = addressFromSnapshot || addressFromUser;

    return {
      id: `#${o.id_pedido}`,
      rawId: o.id_pedido,
      client: o.usuario?.nome || o.cliente_nome || "Venda presencial",
      email: o.usuario?.email || o.cliente_email || "",
      phone: o.usuario?.telefone || "",
      address: resolvedAddress,
      total: Number(o.total || 0),
      subtotal: Number(o.subtotal || o.total || 0),
      frete: Number(o.frete || 0),
      desconto: Number(o.desconto || 0),
      status: o.status || "pendente",
      date: o.data_pedido,
      metodo_pagamento: o.metodo_pagamento || "",
      codigo_cupom: o.codigo_cupom || "",
      venda_presencial: o.venda_presencial === true || !o.id_usuario,
      items: (o.pedidoProdutos || []).map((pp) => ({
        id_produto: pp.id_produto,
        sku_variacao: pp.sku_variacao,
        name: pp.produto?.nome_produto || "Produto",
        qty: pp.quantidade || 1,
        price: Number(pp.preco_unitario || pp.produto?.preco || 0),
      })),
    };
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (sortByValue) {
        params.set("sortBy", "total");
        params.set("sortDir", sortByValue);
      }
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await api.get(`/admin/sales?${params}`);
      if (res.data?.data) {
        const mapped = res.data.data.map(mapOrder);
        setOrders(mapped);
        setTotalOrders(res.data.total);
        setTotalPages(res.data.totalPages);
        if (res.data.aggregates) {
          setStats({
            totalRevenue: res.data.aggregates.totalRevenue || 0,
            ordersCount: res.data.total || 0,
            ticketMedio: res.data.aggregates.avgTicket || 0,
            finalizados: res.data.aggregates.finalizados || 0,
          });
        }
      } else {
        setOrders((res.data || []).map(mapOrder));
      }
    } catch (err) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedStatus, sortByValue, startDate, endDate, mapOrder, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const hasActiveFilters = selectedStatus !== "all" || debouncedSearch || startDate || endDate;

  const handleResetFilters = useCallback(() => {
    setSelectedStatus("all");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSortByValue(null);
    setPage(1);
  }, []);

  const openOrderModal = useCallback((order) => {
    setEditableItems(
      order.items.map((i) => ({
        id_produto: i.id_produto,
        sku_variacao: i.sku_variacao,
        name: i.name,
        quantidade: i.qty,
        preco_unitario: i.price,
      }))
    );
    setEditableAddress({
      logradouro: order.address?.logradouro || "",
      numero: order.address?.numero || "",
      complemento: order.address?.complemento || "",
      cidade: order.address?.cidade || "",
      estado: order.address?.estado || "",
      cep: order.address?.cep || "",
    });
    setCustomerEmailLookup(order.email || "");
    setOrderModal({ isOpen: true, order });
  }, []);

  const closeOrderModal = useCallback(() => {
    setOrderModal({ isOpen: false, order: null });
    setEditableItems([]);
  }, []);

  const toggleSort = useCallback(() => {
    setSortByValue((prev) => (prev === null ? "desc" : prev === "desc" ? "asc" : null));
    setPage(1);
  }, []);

  const updateEditableItem = (index, field, value) => {
    setEditableItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const saveItems = async () => {
    if (!orderModal.order) return;
    setSavingItems(true);
    try {
      const payload = {
        items: editableItems.map((i) => ({
          id_produto: Number(i.id_produto),
          sku_variacao: i.sku_variacao,
          quantidade: Number(i.quantidade),
          preco_unitario: Number(i.preco_unitario),
        })),
      };
      await api.patch(`/admin/orders/${orderModal.order.rawId}/items`, payload);
      toast.success("Itens do pedido atualizados.");
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || "Erro ao atualizar itens.");
    } finally {
      setSavingItems(false);
    }
  };

  const saveAddress = async () => {
    if (!orderModal.order) return;
    setSavingAddress(true);
    try {
      await api.patch(`/admin/orders/${orderModal.order.rawId}/address`, {
        endereco: editableAddress,
      });
      toast.success("Endereco atualizado com sucesso.");
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || "Erro ao atualizar endereco.");
    } finally {
      setSavingAddress(false);
    }
  };

  const linkCustomerByEmail = async () => {
    if (!orderModal.order || !customerEmailLookup.trim()) return;
    setLinkingCustomer(true);
    try {
      await api.patch(`/admin/orders/${orderModal.order.rawId}/customer-by-email`, {
        email: customerEmailLookup.trim().toLowerCase(),
      });
      toast.success("Cliente vinculado ao pedido.");
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || "Cliente nao encontrado.");
    } finally {
      setLinkingCustomer(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Total de Vendas</p>
          <h3 className="text-2xl font-bold mt-2 text-white">
            R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Pedidos</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{stats.ordersCount}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Ticket Medio</p>
          <h3 className="text-2xl font-bold mt-2 text-white">
            R$ {stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Finalizados</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{stats.finalizados}</h3>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 outline-none text-white placeholder-zinc-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
            >
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${
                hasActiveFilters
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <Filter size={16} /> Filtros
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 items-end flex-wrap pt-2 border-t border-zinc-800">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Data inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Data fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                />
              </div>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs text-zinc-500 hover:text-white underline pb-2">
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 cursor-pointer select-none" onClick={toggleSort}>
                  <span className="inline-flex items-center gap-1">
                    Total {sortByValue === "desc" && <ChevronDown size={12} />}
                    {sortByValue === "asc" && <ChevronUp size={12} />}
                  </span>
                </th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-zinc-500" />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.rawId} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-white">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-zinc-200">{order.client}</div>
                      <div className="text-[12px] text-zinc-500">{order.email || "Sem email"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                          STATUS_COLORS[order.status] || "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-white">R$ {order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(order.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="p-2 text-zinc-500 hover:text-white transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={orderModal.isOpen}
          onClose={closeOrderModal}
          title={`Detalhes do pedido ${orderModal.order?.id || ""}`}
          size="lg"
        >
          {orderModal.order && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Cliente</p>
                  <p className="text-sm font-bold text-white">{orderModal.order.client}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Email</p>
                  <p className="text-sm text-zinc-300">{orderModal.order.email || "Sem email"}</p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Venda presencial</p>
                <div className="flex gap-2">
                  <input
                    value={customerEmailLookup}
                    onChange={(e) => setCustomerEmailLookup(e.target.value)}
                    placeholder="Buscar cliente por email"
                    className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  />
                  <button
                    onClick={linkCustomerByEmail}
                    disabled={linkingCustomer}
                    className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    <UserSearch size={14} className="inline mr-1" />
                    {linkingCustomer ? "Buscando..." : "Vincular"}
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Itens</p>
                <div className="space-y-2">
                  {editableItems.map((item, idx) => (
                    <div key={`${item.id_produto}-${item.sku_variacao}-${idx}`} className="grid grid-cols-12 gap-2 bg-zinc-800 p-3 rounded-lg">
                      <div className="col-span-5 text-xs text-zinc-300">{item.name}</div>
                      <input
                        className="col-span-2 p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-white"
                        type="number"
                        min={1}
                        value={item.quantidade}
                        onChange={(e) => updateEditableItem(idx, "quantidade", e.target.value)}
                      />
                      <input
                        className="col-span-3 p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-white"
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.preco_unitario}
                        onChange={(e) => updateEditableItem(idx, "preco_unitario", e.target.value)}
                      />
                      <div className="col-span-2 text-xs text-zinc-400 flex items-center justify-end">
                        R$ {(Number(item.quantidade) * Number(item.preco_unitario || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveItems}
                  disabled={savingItems}
                  className="mt-3 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  <Save size={14} className="inline mr-1" />
                  {savingItems ? "Salvando..." : "Salvar itens"}
                </button>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Endereco de entrega</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="Logradouro" value={editableAddress.logradouro} onChange={(e) => setEditableAddress((p) => ({ ...p, logradouro: e.target.value }))} />
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="Numero" value={editableAddress.numero} onChange={(e) => setEditableAddress((p) => ({ ...p, numero: e.target.value }))} />
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="Complemento" value={editableAddress.complemento} onChange={(e) => setEditableAddress((p) => ({ ...p, complemento: e.target.value }))} />
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="Cidade" value={editableAddress.cidade} onChange={(e) => setEditableAddress((p) => ({ ...p, cidade: e.target.value }))} />
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="Estado" value={editableAddress.estado} onChange={(e) => setEditableAddress((p) => ({ ...p, estado: e.target.value }))} />
                  <input className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" placeholder="CEP" value={editableAddress.cep} onChange={(e) => setEditableAddress((p) => ({ ...p, cep: e.target.value }))} />
                </div>
                <button
                  onClick={saveAddress}
                  disabled={savingAddress}
                  className="mt-3 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  <Save size={14} className="inline mr-1" />
                  {savingAddress ? "Salvando..." : "Salvar endereco"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {!loading && orders.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            <p>Nenhum pedido encontrado.</p>
          </div>
        )}

        <div className="px-6 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalOrders}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
