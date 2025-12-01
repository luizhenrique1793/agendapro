import React, { useState, useEffect } from "react";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { useApp } from "../../store";
import { Plus, Search, Edit2, Trash2, X, Save, User, Clock, Calendar } from "lucide-react";
import { Professional, ProfessionalBlock } from "../../types";

const Professionals: React.FC = () => {
    const {
        professionals,
        addProfessional,
        updateProfessional,
        deleteProfessional,
        uploadProfessionalAvatar,
        addProfessionalBlock,
        removeProfessionalBlock,
        fetchProfessionalBlocks
    } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPro, setEditingPro] = useState<Professional | null>(null);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'schedule' | 'blocks'>('details');
    const [blocks, setBlocks] = useState<ProfessionalBlock[]>([]);
    const [newBlock, setNewBlock] = useState({
        type: 'single' as 'single' | 'range',
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        reason: ""
    });

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        phone: string;
        avatarUrl: string;
        specialty: string;
        schedule: { day: string; intervals: { start: string; end: string }[]; active: boolean }[];
    }>({
        name: "",
        email: "",
        phone: "",
        avatarUrl: "",
        specialty: "",
        schedule: [
            { day: "Segunda", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
            { day: "Terça", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
            { day: "Quarta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
            { day: "Quinta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
            { day: "Sexta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
            { day: "Sábado", intervals: [{ start: "09:00", end: "14:00" }], active: true },
            { day: "Domingo", intervals: [], active: false },
        ]
    });

    const filteredPros = professionals.filter(
        (pro) =>
            pro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pro.specialty && pro.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        if (editingPro && isModalOpen) {
            loadBlocks(editingPro.id);
        }
    }, [editingPro, isModalOpen]);

    const loadBlocks = async (proId: string) => {
        try {
            const data = await fetchProfessionalBlocks(proId);
            setBlocks(data || []);
        } catch (error) {
            console.error("Error loading blocks:", error);
        }
    };

    const handleOpenModal = (pro?: Professional) => {
        setActiveTab('details');
        if (pro) {
            setEditingPro(pro);
            setFormData({
                name: pro.name,
                email: pro.email || "",
                phone: pro.phone || "",
                avatarUrl: pro.avatarUrl || "",
                specialty: pro.specialty || "",
                schedule: pro.schedule || [
                    { day: "Segunda", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Terça", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Quarta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Quinta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Sexta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Sábado", intervals: [{ start: "09:00", end: "14:00" }], active: true },
                    { day: "Domingo", intervals: [], active: false },
                ]
            });
        } else {
            setEditingPro(null);
            setFormData({
                name: "",
                email: "",
                phone: "",
                avatarUrl: "",
                specialty: "",
                schedule: [
                    { day: "Segunda", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Terça", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Quarta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Quinta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Sexta", intervals: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], active: true },
                    { day: "Sábado", intervals: [{ start: "09:00", end: "14:00" }], active: true },
                    { day: "Domingo", intervals: [], active: false },
                ]
            });
        }
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const url = await uploadProfessionalAvatar(file);
            setFormData(prev => ({ ...prev, avatarUrl: url }));
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Erro ao fazer upload da imagem.");
        } finally {
            setUploading(false);
        }
    };

    const handleScheduleChange = (dayIndex: number, intervalIndex: number, field: 'start' | 'end', value: string) => {
        const newSchedule = [...formData.schedule];
        newSchedule[dayIndex].intervals[intervalIndex][field] = value;
        setFormData({ ...formData, schedule: newSchedule });
    };

    const addInterval = (dayIndex: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule[dayIndex].intervals.push({ start: "09:00", end: "18:00" });
        setFormData({ ...formData, schedule: newSchedule });
    };

    const removeInterval = (dayIndex: number, intervalIndex: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule[dayIndex].intervals.splice(intervalIndex, 1);
        setFormData({ ...formData, schedule: newSchedule });
    };

    const toggleDayActive = (dayIndex: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule[dayIndex].active = !newSchedule[dayIndex].active;
        setFormData({ ...formData, schedule: newSchedule });
    };

    const handleAddBlock = async () => {
        if (!editingPro || !newBlock.startDate) return;

        // Validate date range
        if (newBlock.type === 'range' && !newBlock.endDate) {
            alert("Por favor, selecione a data final do período.");
            return;
        }

        try {
            await addProfessionalBlock({
                professionalId: editingPro.id,
                startDate: newBlock.startDate,
                endDate: newBlock.type === 'single' ? newBlock.startDate : newBlock.endDate,
                startTime: newBlock.startTime || undefined,
                endTime: newBlock.endTime || undefined,
                reason: newBlock.reason
            });
            setNewBlock({
                type: 'single',
                startDate: "",
                endDate: "",
                startTime: "",
                endTime: "",
                reason: ""
            });
            loadBlocks(editingPro.id);
        } catch (error) {
            console.error("Error adding block:", error);
            alert("Erro ao adicionar bloqueio.");
        }
    };

    const handleRemoveBlock = async (id: string) => {
        if (!editingPro) return;
        try {
            await removeProfessionalBlock(id);
            loadBlocks(editingPro.id);
        } catch (error) {
            console.error("Error removing block:", error);
            alert("Erro ao remover bloqueio.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPro) {
                await updateProfessional({
                    ...editingPro,
                    ...formData
                });
            } else {
                await addProfessional(formData);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving professional:", error);
            const errorMsg = error?.message || "Erro desconhecido";
            alert(`Erro ao salvar profissional: ${errorMsg}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este profissional?")) {
            try {
                await deleteProfessional(id);
            } catch (error) {
                console.error("Error deleting professional:", error);
                alert("Erro ao excluir profissional.");
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <ManagerSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
                        <p className="text-gray-500">Gerencie a equipe da sua barbearia</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Profissional
                    </button>
                </div>

                <div className="mb-6 flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                    <Search className="mr-2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar profissionais..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 border-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPros.map((pro) => (
                        <div
                            key={pro.id}
                            className="group relative flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => handleOpenModal(pro)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pro.id)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-100">
                                {pro.avatarUrl ? (
                                    <img
                                        src={pro.avatarUrl}
                                        alt={pro.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600">
                                        <User className="h-10 w-10" />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">{pro.name}</h3>
                            <p className="text-sm text-primary-600 font-medium">{pro.specialty || 'Profissional'}</p>
                            <p className="mt-2 text-sm text-gray-500">{pro.email}</p>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200 my-8">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingPro ? "Editar Profissional" : "Novo Profissional"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-6 flex border-b border-gray-200">
                                <button
                                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Dados Pessoais
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'schedule' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('schedule')}
                                >
                                    Horários
                                </button>
                                {editingPro && (
                                    <button
                                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'blocks' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('blocks')}
                                    >
                                        Bloqueios
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {activeTab === 'details' && (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Nome Completo
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Especialidade
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.specialty}
                                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                    placeholder="Ex: Barbeiro, Manicure"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Foto
                                                </label>
                                                <div className="mt-1 flex items-center gap-4">
                                                    {formData.avatarUrl && (
                                                        <img
                                                            src={formData.avatarUrl}
                                                            alt="Preview"
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileUpload}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                                    />
                                                </div>
                                                {uploading && <p className="text-xs text-gray-500 mt-1">Enviando imagem...</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {formData.schedule.map((day, dayIndex) => (
                                            <div key={day.day} className="rounded-lg border border-gray-200 p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={day.active}
                                                            onChange={() => toggleDayActive(dayIndex)}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <span className="font-medium text-gray-900">{day.day}</span>
                                                    </div>
                                                    {day.active && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addInterval(dayIndex)}
                                                            className="text-xs text-primary-600 hover:text-primary-700"
                                                        >
                                                            + Adicionar intervalo
                                                        </button>
                                                    )}
                                                </div>

                                                {day.active && (
                                                    <div className="space-y-2 pl-7">
                                                        {day.intervals.map((interval, intervalIndex) => (
                                                            <div key={intervalIndex} className="flex items-center gap-2">
                                                                <input
                                                                    type="time"
                                                                    value={interval.start}
                                                                    onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'start', e.target.value)}
                                                                    className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                                />
                                                                <span className="text-gray-500">até</span>
                                                                <input
                                                                    type="time"
                                                                    value={interval.end}
                                                                    onChange={(e) => handleScheduleChange(dayIndex, intervalIndex, 'end', e.target.value)}
                                                                    className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeInterval(dayIndex, intervalIndex)}
                                                                    className="text-gray-400 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'blocks' && (
                                    <div className="space-y-6">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h4 className="mb-3 text-sm font-medium text-gray-900">Novo Bloqueio</h4>

                                            {/* Type Toggle */}
                                            <div className="mb-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewBlock({ ...newBlock, type: 'single' })}
                                                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${newBlock.type === 'single' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                                                >
                                                    Dia Único
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewBlock({ ...newBlock, type: 'range' })}
                                                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${newBlock.type === 'range' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                                                >
                                                    Período
                                                </button>
                                            </div>

                                            {/* Date Inputs */}
                                            <div className="mb-3 flex gap-3">
                                                <div className="flex-1">
                                                    <label className="mb-1 block text-xs text-gray-500">
                                                        {newBlock.type === 'single' ? 'Data' : 'Data Inicial'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={newBlock.startDate}
                                                        onChange={(e) => setNewBlock({ ...newBlock, startDate: e.target.value })}
                                                        className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                    />
                                                </div>
                                                {newBlock.type === 'range' && (
                                                    <div className="flex-1">
                                                        <label className="mb-1 block text-xs text-gray-500">Data Final</label>
                                                        <input
                                                            type="date"
                                                            value={newBlock.endDate}
                                                            onChange={(e) => setNewBlock({ ...newBlock, endDate: e.target.value })}
                                                            className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time Inputs (only for single day) */}
                                            {newBlock.type === 'single' && (
                                                <div className="mb-3 flex gap-3">
                                                    <div className="flex-1">
                                                        <label className="mb-1 block text-xs text-gray-500">Hora Início (opcional)</label>
                                                        <input
                                                            type="time"
                                                            value={newBlock.startTime}
                                                            onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                                                            className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="mb-1 block text-xs text-gray-500">Hora Fim (opcional)</label>
                                                        <input
                                                            type="time"
                                                            value={newBlock.endTime}
                                                            onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                                                            className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reason Input */}
                                            <div className="mb-3">
                                                <label className="mb-1 block text-xs text-gray-500">Motivo (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={newBlock.reason}
                                                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                                                    placeholder="Ex: Férias, Médico"
                                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>

                                            {/* Add Button */}
                                            <button
                                                type="button"
                                                onClick={handleAddBlock}
                                                disabled={!newBlock.startDate}
                                                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                                            >
                                                Adicionar Bloqueio
                                            </button>
                                        </div>

                                        <div>
                                            <h4 className="mb-3 text-sm font-medium text-gray-900">Bloqueios Ativos</h4>
                                            {blocks.length === 0 ? (
                                                <p className="text-sm text-gray-500">Nenhum bloqueio cadastrado.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {blocks.map((block) => {
                                                        const isSingleDay = block.startDate === block.endDate;
                                                        const hasTimeRange = block.startTime && block.endTime;

                                                        let displayText = '';
                                                        if (isSingleDay) {
                                                            displayText = new Date(block.startDate).toLocaleDateString();
                                                            if (hasTimeRange) {
                                                                displayText += ` (${block.startTime} - ${block.endTime})`;
                                                            }
                                                        } else {
                                                            displayText = `${new Date(block.startDate).toLocaleDateString()} - ${new Date(block.endDate).toLocaleDateString()}`;
                                                        }

                                                        return (
                                                            <div key={block.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {displayText}
                                                                        </p>
                                                                        {block.reason && (
                                                                            <p className="text-xs text-gray-500">{block.reason}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveBlock(block.id)}
                                                                    className="text-sm text-red-600 hover:text-red-700"
                                                                >
                                                                    Remover
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab !== 'blocks' && (
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Professionals;
