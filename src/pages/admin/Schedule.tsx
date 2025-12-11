const renderModalContent = () => {
    if (!selectedAppointment) return null;

    if (isRegisteringPayment) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor a Pagar (R$)</label>
            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
              <option>Dinheiro</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>PIX</option>
            </select>
          </div>
          <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRegisteringPayment(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Voltar</button>
            <button onClick={handleCompleteAppointment} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center justify-center"><DollarSign className="mr-2 h-4 w-4" />Confirmar Pagamento</button>
          </div>
        </div>
      );
    }

    if (isRescheduling) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nova Data</label>
            <input type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setNewDate(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Novo Horário</label>
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRescheduling(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Voltar</button>
            <button onClick={handleSaveReschedule} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 flex items-center justify-center"><Save className="mr-2 h-4 w-4" />Confirmar</button>
          </div>
        </div>
      );
    }

    // Buscar informações do serviço
    const service = services.find(s => s.id === selectedAppointment.service_id);

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Cliente</p>
          <p className="text-base font-semibold text-gray-900">{selectedAppointment.client_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Profissional</p>
          <p className="text-base text-gray-900">{professionals.find(p => p.id === selectedAppointment.professional_id)?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Serviço</p>
          <p className="text-base text-gray-900">{service?.name || 'N/A'}</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Data</p>
            <p className="text-base text-gray-900">{new Date(selectedAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Horário</p>
            <p className="text-base text-gray-900">{selectedAppointment.time}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Valor</p>
            <p className="text-base font-semibold text-gray-900">R$ {service?.price.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(selectedAppointment.status).replace('border-l-4', '')}`}>{selectedAppointment.status}</span>
          </div>
        </div>
        {selectedAppointment.status !== AppointmentStatus.COMPLETED && selectedAppointment.status !== AppointmentStatus.CANCELLED && (
          <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setIsRegisteringPayment(true)} className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 flex items-center justify-center"><CheckCircle className="mr-2 h-4 w-4" />Concluir Agendamento</button>
            <div className="flex gap-3">
              <button onClick={() => setIsRescheduling(true)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center"><CalendarIcon className="mr-2 h-4 w-4" />Reagendar</button>
              <button onClick={handleCancelAppointment} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    );
  };