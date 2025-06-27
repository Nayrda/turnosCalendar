import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit3, Save, X, Clock, FileText, Settings } from 'lucide-react';

const CalendarShiftsApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    notes: '',
    type: 'morning',
    useCustomTime: false
  });
  const [shiftSettings, setShiftSettings] = useState({
    morning: { start: '06:00', end: '14:00' },
    afternoon: { start: '14:00', end: '22:00' },
    night: { start: '22:00', end: '06:00' },
    split: { start: '06:00', end: '22:00' }
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const shiftTypes = {
    morning: { label: 'Mañana', color: 'bg-yellow-200 border-yellow-400', textColor: 'text-yellow-800' },
    afternoon: { label: 'Tarde', color: 'bg-orange-200 border-orange-400', textColor: 'text-orange-800' },
    night: { label: 'Noche', color: 'bg-blue-200 border-blue-400', textColor: 'text-blue-800' },
    split: { label: 'Partido', color: 'bg-purple-200 border-purple-400', textColor: 'text-purple-800' },
    free: { label: 'Libre', color: 'bg-green-200 border-green-400', textColor: 'text-green-800' }
  };

  const getShiftType = (startTime, endTime) => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    
    if (start >= 6 && end <= 14) return 'morning';
    if (start >= 14 && end <= 22) return 'afternoon';
    if (start >= 22 || end <= 6) return 'night';
    if ((start >= 6 && start < 14) && (end > 16 && end <= 22)) return 'split';
    return 'morning';
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Ajustar para que lunes sea 0
  };

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    // Ajustar para que lunes sea el primer día (0)
    const mondayOffset = day === 0 ? -6 : -day + 1;
    startOfWeek.setDate(date.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getWeekRange = (date) => {
    const weekDates = getWeekDates(date);
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${start.getFullYear()}`;
    } else {
      return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    }
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleDateClick = (day, isWeekView = false, dateObj = null) => {
    let dateKey;
    if (isWeekView && dateObj) {
      dateKey = formatDateKey(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    } else {
      dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    }
    
    setSelectedDate(dateKey);
    const existingShift = shifts[dateKey];
    
    if (existingShift) {
      setEditingShift(dateKey);
      setFormData({
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
        notes: existingShift.notes,
        type: existingShift.type
      });
    } else {
      setEditingShift(null);
      setFormData({
        startTime: '',
        endTime: '',
        notes: '',
        type: 'morning',
        useCustomTime: false
      });
    }
    setShowModal(true);
  };

  const getShiftTimes = (type) => {
    return shiftSettings[type] || { start: '06:00', end: '14:00' };
  };

  const handleSaveShift = () => {
    if (!selectedDate) return;

    let startTime, endTime;
    
    if (formData.useCustomTime) {
      if (!formData.startTime || !formData.endTime) return;
      startTime = formData.startTime;
      endTime = formData.endTime;
    } else {
      const times = getShiftTimes(formData.type);
      startTime = times.start;
      endTime = times.end;
    }

    const finalType = formData.useCustomTime ? getShiftType(startTime, endTime) : formData.type;
    
    const newShift = {
      startTime,
      endTime,
      notes: formData.notes,
      type: finalType,
      date: selectedDate
    };

    setShifts(prev => ({
      ...prev,
      [selectedDate]: newShift
    }));

    setShowModal(false);
    setSelectedDate(null);
    setEditingShift(null);
    setFormData({ startTime: '', endTime: '', notes: '', type: 'morning', useCustomTime: false });
  };

  const handleDeleteShift = () => {
    if (selectedDate) {
      setShifts(prev => {
        const newShifts = { ...prev };
        delete newShifts[selectedDate];
        return newShifts;
      });
      setShowModal(false);
      setSelectedDate(null);
      setEditingShift(null);
    }
  };

  const handleSaveSettings = () => {
    setShowSettingsModal(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días vacíos del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      );
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
      const shift = shifts[dateKey];
      const today = new Date();
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentDate.getMonth() && 
                     today.getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 p-1 relative transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          
          {shift && (
            <div className={`mt-1 px-2 py-1 rounded text-xs border ${shiftTypes[shift.type].color} ${shiftTypes[shift.type].textColor}`}>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{shift.startTime}-{shift.endTime}</span>
              </div>
              {shift.notes && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{shift.notes}</span>
                </div>
              )}
            </div>
          )}
          
          {isToday && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const today = new Date();
    
    return (
      <div className="space-y-4">
        {/* Días de la semana header */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((dayName, index) => {
            const date = weekDates[index];
            const isToday = today.toDateString() === date.toDateString();
            
            return (
              <div key={index} className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'}`}>
                <div className="font-medium text-sm">{dayName}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {months[date.getMonth()].slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Turnos de la semana */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
            const shift = shifts[dateKey];
            const isToday = today.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(null, true, date)}
                className={`min-h-32 border-2 rounded-lg cursor-pointer hover:bg-gray-50 p-3 transition-colors ${
                  isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                {shift ? (
                  <div className={`h-full p-2 rounded border ${shiftTypes[shift.type].color} ${shiftTypes[shift.type].textColor}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium text-sm">{shift.startTime}</span>
                    </div>
                    <div className="text-sm mb-1">
                      a {shift.endTime}
                    </div>
                    <div className="text-xs font-medium mb-2">
                      {shiftTypes[shift.type].label}
                    </div>
                    {shift.notes && (
                      <div className="text-xs">
                        <FileText className="w-3 h-3 inline mr-1" />
                        <span className="line-clamp-2">{shift.notes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <Plus className="w-6 h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Turnos</h1>
        <p className="text-gray-600">Gestiona tus horarios de trabajo y anotaciones</p>
      </div>

      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevPeriod}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-semibold text-gray-900">
            {viewMode === 'month' 
              ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : getWeekRange(currentDate)
            }
          </h2>
          
          <button
            onClick={handleNextPeriod}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Selector de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Botón de configuración */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configurar horarios de turnos"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Leyenda de colores */}
          <div className="flex gap-2 text-xs">
            {Object.entries(shiftTypes).map(([key, type]) => (
              <div key={key} className={`px-2 py-1 rounded border ${type.color} ${type.textColor}`}>
                {type.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Días de la semana - solo para vista mensual */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-0 mb-2">
          {days.map(day => (
            <div key={day} className="h-10 flex items-center justify-center bg-gray-100 font-medium text-gray-700 border border-gray-200">
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Calendario */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {renderCalendarDays()}
        </div>
      ) : (
        renderWeekView()
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingShift ? 'Editar Turno' : 'Nuevo Turno'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="text"
                  value={selectedDate || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de turno
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.useCustomTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, useCustomTime: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Usar horario personalizado</span>
                  </label>
                </div>
              </div>

              {!formData.useCustomTime ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar turno
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(shiftTypes).filter(([key]) => key !== 'split' && key !== 'free').map(([key, type]) => {
                      const times = getShiftTimes(key);
                      return (
                        <label key={key} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shiftType"
                            value={key}
                            checked={formData.type === key}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="mr-3"
                          />
                          <div>
                            <div className={`font-medium ${type.textColor}`}>{type.label}</div>
                            <div className="text-xs text-gray-500">{times.start} - {times.end}</div>
                          </div>
                        </label>
                      );
                    })}
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shiftType"
                        value="free"
                        checked={formData.type === 'free'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-3"
                      />
                      <div>
                        <div className={`font-medium ${shiftTypes.free.textColor}`}>Libre</div>
                        <div className="text-xs text-gray-500">Sin horario</div>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anotaciones
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Añade notas sobre este turno..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>

              {formData.useCustomTime && formData.startTime && formData.endTime && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Tipo de turno detectado: 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${shiftTypes[getShiftType(formData.startTime, formData.endTime)].color} ${shiftTypes[getShiftType(formData.startTime, formData.endTime)].textColor}`}>
                      {shiftTypes[getShiftType(formData.startTime, formData.endTime)].label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveShift}
                disabled={formData.useCustomTime && (!formData.startTime || !formData.endTime)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              
              {editingShift && (
                <button
                  onClick={handleDeleteShift}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              )}
              
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Configurar Horarios de Turnos</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(shiftTypes).filter(([key]) => key !== 'split' && key !== 'free').map(([key, type]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <h4 className={`font-medium mb-2 ${type.textColor}`}>{type.label}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hora inicio</label>
                      <input
                        type="time"
                        value={shiftSettings[key].start}
                        onChange={(e) => setShiftSettings(prev => ({
                          ...prev,
                          [key]: { ...prev[key], start: e.target.value }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hora fin</label>
                      <input
                        type="time"
                        value={shiftSettings[key].end}
                        onChange={(e) => setShiftSettings(prev => ({
                          ...prev,
                          [key]: { ...prev[key], end: e.target.value }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarShiftsApp;
