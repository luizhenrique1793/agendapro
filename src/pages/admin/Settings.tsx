{/* Configurações de Lembretes */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-gray-400" />
                            Configurações de Lembretes
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Configure quando e como os lembretes de agendamento serão enviados automaticamente.
                        </p>
                        
                        <div className="space-y-6">
                            {/* Lembretes no Mesmo Dia */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.same_day_enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Lembretes no Mesmo Dia</h3>
                                        <p className="text-sm text-gray-500">
                                            Enviar lembretes algumas horas antes do agendamento
                                        </p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentBusiness?.reminder_config?.same_day_enabled ?? true}
                                        onChange={(e) => {
                                            const newConfig = {
                                                ...currentBusiness?.reminder_config,
                                                same_day_enabled: e.target.checked
                                            };
                                            updateBusiness({ reminder_config: newConfig });
                                        }}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Ativar</span>
                                </label>
                            </div>

                            {currentBusiness?.reminder_config?.same_day_enabled && (
                                <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Horas antes do agendamento
                                    </label>
                                    <select
                                        value={currentBusiness?.reminder_config?.same_day_hours_before ?? 2}
                                        onChange={(e) => {
                                            const newConfig = {
                                                ...currentBusiness?.reminder_config,
                                                same_day_hours_before: parseInt(e.target.value)
                                            };
                                            updateBusiness({ reminder_config: newConfig });
                                        }}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value={1}>1 hora antes</option>
                                        <option value={2}>2 horas antes</option>
                                        <option value={3}>3 horas antes</option>
                                        <option value={4}>4 horas antes</option>
                                        <option value={6}>6 horas antes</option>
                                        <option value={8}>8 horas antes</option>
                                    </select>
                                </div>
                            )}

                            {/* Lembretes no Dia Anterior */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${currentBusiness?.reminder_config?.previous_day_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Lembretes no Dia Anterior</h3>
                                        <p className="text-sm text-gray-500">
                                            Para agendamentos muito cedo, enviar lembretes no dia anterior
                                        </p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentBusiness?.reminder_config?.previous_day_enabled ?? true}
                                        onChange={(e) => {
                                            const newConfig = {
                                                ...currentBusiness?.reminder_config,
                                                previous_day_enabled: e.target.checked
                                            };
                                            updateBusiness({ reminder_config: newConfig });
                                        }}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Ativar</span>
                                </label>
                            </div>

                            {currentBusiness?.reminder_config?.previous_day_enabled && (
                                <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Horário limite para considerar "muito cedo"
                                        </label>
                                        <input
                                            type="time"
                                            value={currentBusiness?.reminder_config?.early_threshold_hour ?? "09:00"}
                                            onChange={(e) => {
                                                const newConfig = {
                                                    ...currentBusiness?.reminder_config,
                                                    early_threshold_hour: e.target.value
                                                };
                                                updateBusiness({ reminder_config: newConfig });
                                            }}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Agendamentos antes deste horário serão considerados "muito cedo"
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Horário para enviar lembretes no dia anterior
                                        </label>
                                        <input
                                            type="time"
                                            value={currentBusiness?.reminder_config?.previous_day_time ?? "19:00"}
                                            onChange={(e) => {
                                                const newConfig = {
                                                    ...currentBusiness?.reminder_config,
                                                    previous_day_time: e.target.value
                                                };
                                                updateBusiness({ reminder_config: newConfig });
                                            }}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Horário aproximado para enviar lembretes no dia anterior
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>