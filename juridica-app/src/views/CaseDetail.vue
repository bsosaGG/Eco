<template>
    <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="text-gray-500">Cargando información del caso...</div>
    </div>

    <div v-else-if="juicio" class="space-y-6">
        <!-- Wrapper for Sticky Tabs -->
        <div class="">
            <!-- Tabs Header -->
            <div class="flex border-b border-gray-200 bg-white sticky -top-4 md:-top-8 z-10">
                <!-- Scrollable Tabs Container with Arrows -->
                <div class="flex-1 relative flex items-center min-w-0 group">
                    <!-- Left Arrow -->
                    <button v-if="canScrollLeft" @click="scroll('left')"
                        class="absolute left-0 z-10 p-1 bg-white/90 hover:bg-white shadow-md rounded-full text-gray-600 hover:text-blue-600 transition-all border border-gray-100 ml-1">
                        <ChevronLeft class="w-4 h-4" />
                    </button>

                    <!-- Tabs Wrapper -->
                    <div ref="tabsContainer" class="flex overflow-x-auto w-full no-scrollbar scroll-smooth"
                        @scroll="checkScroll" style="scrollbar-width: none; -ms-overflow-style: none;">
                        <button @click="activeTab = 'general'"
                            :class="['px-6 py-4 text-sm font-medium focus:outline-none border-b-2 transition-colors duration-200 whitespace-nowrap flex-shrink-0', activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']">
                            General
                        </button>
                        <button @click="activeTab = 'narrativa'"
                            :class="['px-6 py-4 text-sm font-medium focus:outline-none border-b-2 transition-colors duration-200 whitespace-nowrap flex-shrink-0', activeTab === 'narrativa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']">
                            Narrativa
                        </button>
                        <button @click="activeTab = 'estado'"
                            :class="['px-6 py-4 text-sm font-medium focus:outline-none border-b-2 transition-colors duration-200 whitespace-nowrap flex-shrink-0', activeTab === 'estado' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']">
                            Estado Actual & Finanzas
                        </button>
                    </div>

                    <!-- Right Arrow -->
                    <button v-if="canScrollRight" @click="scroll('right')"
                        class="absolute right-0 z-10 p-1 bg-white/90 hover:bg-white shadow-md rounded-full text-gray-600 hover:text-blue-600 transition-all border border-gray-100 mr-1">
                        <ChevronRight class="w-4 h-4" />
                    </button>
                </div>

                <!-- Fixed Actions -->
                <div class="flex items-center pl-2 pr-4 bg-white border-l border-gray-100 flex-shrink-0 z-20">
                    <template v-if="!editing">
                        <button @click="exportDoc" class="text-gray-600 hover:text-blue-600 p-2" title="Exportar Ficha">
                            <FileDown class="w-5 h-5" />
                        </button>
                        <button @click="startEdit" class="text-gray-600 hover:text-blue-600 p-2" title="Editar Caso">
                            <Edit class="w-5 h-5" />
                        </button>
                    </template>
                    <template v-else>
                        <button @click="saveEdit" class="text-green-600 hover:text-green-700 p-2" title="Guardar">
                            <Save class="w-5 h-5" />
                        </button>
                        <button @click="cancelEdit" class="text-red-600 hover:text-red-700 p-2" title="Cancelar">
                            <X class="w-5 h-5" />
                        </button>
                    </template>
                </div>
            </div>

            <div class="p-6 bg-white min-h-[500px]">

                <!-- TAB 1: GENERAL -->
                <div v-show="activeTab === 'general'" class="space-y-6">
                    <!-- Top Info Base -->
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="w-full md:w-auto">
                            <h1 class="text-3xl font-bold text-gray-800 flex flex-wrap items-center gap-3">
                                <span v-if="!editing">{{ juicio.numero_proceso }}</span>
                                <input v-else v-model="editForm.numero_proceso"
                                    class="border rounded px-2 py-1 text-2xl font-bold w-full md:w-64 text-gray-800"
                                    placeholder="Número de Proceso" />
                                <span v-if="juicio.correlativo"
                                    class="ml-2 text-lg text-gray-500 font-normal border-l pl-2 border-gray-300">
                                    {{ juicio.correlativo }}
                                </span>
                                <span v-if="!editing"
                                    :class="['px-3 py-1 rounded-full text-sm font-medium', getStatusColor(juicio.estado_procesal)]">
                                    {{ juicio.estado_procesal }}
                                </span>
                                <select v-else v-model="editForm.estado_procesal"
                                    class="text-sm border border-gray-300 rounded p-1 font-normal">
                                    <option>En Trámite</option>
                                    <option>Sentencia</option>
                                    <option>Favorable</option>
                                    <option>Archivado</option>
                                </select>
                            </h1>
                            <div class="text-gray-500 mt-2 flex items-center gap-2">
                                <Building2 class="w-4 h-4 flex-shrink-0" />
                                <span v-if="!editing" class="text-lg">{{ juicio.organo_jurisdiccional }}</span>
                                <InputAutocomplete v-else v-model="editForm.organo_jurisdiccional"
                                    field="organo_jurisdiccional" class="w-full md:w-96 text-sm"
                                    placeholder="Órgano Jurisdiccional" />
                            </div>
                        </div>
                        <div class="w-full md:w-auto flex flex-col items-start md:items-end">
                            <div class="text-gray-500 flex items-center gap-2 w-full md:w-auto">
                                <Gavel class="w-4 h-4 flex-shrink-0" />
                                <span v-if="!editing" class="font-medium">{{ juicio.tipo_juicio || '-' }}</span>
                                <InputAutocomplete v-else v-model="editForm.tipo_juicio" field="tipo_juicio"
                                    class="text-sm w-full md:w-64" placeholder="Tipo de Juicio" />
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-t pt-6">
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-4 border-b pb-2">Partes Procesales</h3>
                            <div class="space-y-4">
                                <div v-if="!editing">
                                    <span class="text-gray-500 block text-xs uppercase tracking-wide">{{
                                        juicio.demandante_tipo ||
                                        'Demandante' }}</span>
                                    <span class="font-medium text-lg text-gray-800">{{ juicio.demandante_nombre ||
                                        juicio.demandante_id }}</span>
                                    <span v-if="juicio.demandante_identificacion" class="text-gray-400 text-xs block">
                                        {{ juicio.demandante_identificacion_tipo }}: {{ juicio.demandante_identificacion
                                        }}
                                    </span>
                                </div>
                                <div v-else class="mb-2">
                                    <label
                                        class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Demandante</label>
                                    <ActorSearch v-model="editForm.demandante_id" type="Demandante / Parte Actora" />
                                </div>
                                <div v-if="juicio.ultimo_renglon_presupuestario || editing">
                                    <span class="text-gray-500 block text-xs uppercase tracking-wide">Renglón
                                        Presupuestario</span>
                                    <span v-if="!editing" class="font-medium text-gray-800">{{
                                        juicio.ultimo_renglon_presupuestario
                                        }}</span>
                                    <InputAutocomplete v-else v-model="editForm.ultimo_renglon_presupuestario"
                                        field="ultimo_renglon_presupuestario" class="w-full" placeholder="Ej: 011" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold text-gray-900 mb-4 border-b pb-2">Personal Judicial</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span class="text-gray-500 block text-xs uppercase tracking-wide">Juez</span>
                                    <span v-if="!editing" class="font-medium text-gray-800">{{ juicio.juez }}</span>
                                    <InputAutocomplete v-else v-model="editForm.juez" field="juez" class="w-full"
                                        placeholder="Juez" />
                                </div>
                                <div>
                                    <span class="text-gray-500 block text-xs uppercase tracking-wide">Oficial</span>
                                    <span v-if="!editing" class="font-medium text-gray-800">{{ juicio.oficial }}</span>
                                    <InputAutocomplete v-else v-model="editForm.oficial" field="oficial" class="w-full"
                                        placeholder="Oficial" />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: NARRATIVA -->
                <div v-show="activeTab === 'narrativa'" class="space-y-6 animate-in fade-in duration-300">
                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Origen del Proceso
                                Judicial</label>
                            <div v-if="!editing"
                                class="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap min-h-[60px]">{{
                                    juicio.origen_proceso || 'No especificado.' }}</div>
                            <textarea v-else v-model="editForm.origen_proceso" rows="3"
                                class="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-base"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Objeto de la
                                Pretensión</label>
                            <div v-if="!editing"
                                class="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap min-h-[60px]">{{
                                    juicio.objeto_pretension || 'No especificado.' }}</div>
                            <textarea v-else v-model="editForm.objeto_pretension" rows="3"
                                class="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-base"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Antecedentes del Caso</label>
                            <div v-if="!editing"
                                class="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap min-h-[100px]">
                                {{ juicio.antecedentes_caso || 'No especificado.' }}</div>
                            <textarea v-else v-model="editForm.antecedentes_caso" rows="6"
                                class="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-base"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Observaciones
                                Generales</label>
                            <div v-if="!editing" class="bg-yellow-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                                {{
                                    juicio.observaciones || 'Sin observaciones.' }}</div>
                            <textarea v-else v-model="editForm.observaciones" rows="3"
                                class="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-base"></textarea>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: ESTADO Y FINANZAS -->
                <div v-show="activeTab === 'estado'" class="space-y-8 animate-in fade-in duration-300">

                    <!-- Section: Procesal Status -->
                    <div class="bg-white rounded-lg">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span class="w-1 h-6 bg-blue-500 rounded-full"></span>
                            Estado Procesal & Recursos
                        </h3>

                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div class="col-span-1 md:col-span-2">
                                <label class="block text-xs uppercase text-gray-500 font-semibold mb-1">Actitud
                                    Procesal</label>
                                <div v-if="!editing"
                                    class="flex flex-col md:flex-row md:items-center gap-2 items-start">
                                    <span v-if="juicio.intento_conciliacion"
                                        class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">CONCILIACIÓN</span>
                                    <span v-else
                                        class="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">SIN
                                        CONCILIACIÓN</span>
                                    <span class="text-gray-800 font-medium ml-0 md:ml-2">{{ juicio.actitud_procesal
                                        }}</span>
                                </div>
                                <div v-else class="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <label
                                        class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-300 shadow-sm">
                                        <input v-model="editForm.intento_conciliacion" type="checkbox"
                                            class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                                        <span class="text-sm text-gray-700">¿Buscó conciliación?</span>
                                    </label>
                                    <input v-model="editForm.actitud_procesal"
                                        class="flex-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 text-base"
                                        placeholder="Descripción Actitud Procesal" />
                                </div>
                            </div>

                            <!-- Estado Actual (Movido) -->
                            <div class="col-span-1 md:col-span-2">
                                <label class="block text-xs uppercase text-gray-500 font-semibold mb-1">Estado Actual
                                    (Descripción)</label>
                                <div v-if="!editing">
                                    <p class="font-medium text-gray-800">{{ juicio.estado_actual_descripcion || '-' }}
                                    </p>
                                </div>
                                <div v-else>
                                    <InputAutocomplete v-model="editForm.estado_actual_descripcion"
                                        field="estado_actual_descripcion" class="w-full text-base"
                                        placeholder="Describa el estado actual..." />
                                </div>
                            </div>

                            <!-- Apelacion -->
                            <div>
                                <label
                                    class="block text-xs uppercase text-gray-500 font-semibold mb-1">Apelación</label>
                                <div v-if="!editing">
                                    <div v-if="juicio.interpuso_apelacion">
                                        <span
                                            class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">INTERPUESTA</span>
                                        <p class="text-sm text-gray-600 mt-1">Sala: <span
                                                class="font-medium text-gray-800">{{
                                                    juicio.sala_apelacion_nombre || 'No indicada' }}</span></p>
                                    </div>
                                    <span v-else class="text-gray-400 italic">No se interpuso apelación</span>
                                </div>
                                <div v-else class="space-y-2">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input v-model="editForm.interpuso_apelacion" type="checkbox"
                                            class="rounded text-blue-600 focus:ring-blue-500">
                                        <span class="text-sm text-gray-700">¿Se interpuso apelación?</span>
                                    </label>
                                    <div v-if="editForm.interpuso_apelacion">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Sala de la Corte de
                                            Apelaciones
                                            de Trabajo y Previsión Social</label>
                                        <input v-model="editForm.sala_apelacion_nombre"
                                            class="w-full border rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 text-base"
                                            placeholder="Nombre de la Sala" />
                                    </div>
                                </div>
                            </div>

                            <!-- Amparo -->
                            <div>
                                <label class="block text-xs uppercase text-gray-500 font-semibold mb-1">Amparo
                                    Constitucional</label>
                                <!-- View Mode -->
                                <div v-if="!editing">
                                    <div v-if="juicio.tiene_amparo">
                                        <span
                                            class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">ACTIVO</span>
                                        <div class="mt-2 space-y-1 text-sm text-gray-600">
                                            <p>Órgano: <span class="font-medium text-gray-800">{{
                                                juicio.amparo_organo_competente ||
                                                '-' }}</span></p>
                                            <p>Expediente: <span class="font-medium text-gray-800">{{
                                                juicio.numero_amparo
                                                || '-'
                                                    }}</span></p>
                                            <p>Estado: <span class="font-medium text-gray-800">{{
                                                juicio.estado_amparo_descripcion
                                                || '-' }}</span></p>
                                        </div>
                                    </div>
                                    <span v-else class="text-gray-400 italic">No tiene amparo</span>
                                </div>
                                <!-- Edit Mode -->
                                <div v-else class="space-y-3">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input v-model="editForm.tiene_amparo" type="checkbox"
                                            class="rounded text-blue-600 focus:ring-blue-500">
                                        <span class="text-sm text-gray-700">Acción constitucional de amparo</span>
                                    </label>
                                    <div v-if="editForm.tiene_amparo"
                                        class="pl-4 border-l-2 border-purple-100 space-y-2">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700">Órgano
                                                Competente</label>
                                            <input v-model="editForm.amparo_organo_competente"
                                                class="w-full border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 text-base"
                                                placeholder="Ej: CC" />
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700">Número de
                                                Amparo</label>
                                            <input v-model="editForm.numero_amparo"
                                                class="w-full border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 text-base"
                                                placeholder="No. Expediente" />
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700">Estado del
                                                Amparo</label>
                                            <select v-model="editForm.estado_amparo_descripcion"
                                                class="w-full border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 text-base">
                                                <option value="">Seleccione...</option>
                                                <option>Admitido</option>
                                                <option>Otorgado provisionalmente</option>
                                                <option>Definitiva</option>
                                                <option>Rechazado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Financials -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span class="w-1 h-6 bg-emerald-500 rounded-full"></span>
                            Análisis Financiero
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- Card 1 -->
                            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <span class="text-gray-500 text-xs uppercase tracking-wider font-semibold">Monto
                                    Auto de Liquidación</span>
                                <p v-if="!editing" class="text-2xl font-bold text-gray-800 mt-2">Q{{
                                    formatMoney(juicio.monto_liquidacion) }}</p>
                                <input v-else v-model="editForm.monto_liquidacion" type="number"
                                    class="w-full mt-2 border rounded p-2 text-lg font-bold" />
                            </div>
                            <!-- Card 2 -->
                            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <span class="text-gray-500 text-xs uppercase tracking-wider font-semibold">Monto
                                    RRHH</span>
                                <p v-if="!editing" class="text-2xl font-bold text-gray-800 mt-2">Q{{
                                    formatMoney(juicio.monto_rrhh)
                                    }}</p>
                                <input v-else v-model="editForm.monto_rrhh" type="number"
                                    class="w-full mt-2 border rounded p-2 text-lg font-bold" />
                            </div>
                            <!-- Card 3 (Enhanced) -->
                            <div class="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 bg-emerald-50/30">
                                <span
                                    class="text-emerald-700 text-xs uppercase tracking-wider font-bold">Contingencia</span>
                                <p v-if="!editing" class="text-3xl font-bold text-emerald-700 mt-2">Q{{
                                    formatMoney(juicio.monto_estimado) }}</p>
                                <input v-else v-model="editForm.monto_estimado" type="number"
                                    class="w-full mt-2 border border-emerald-300 rounded p-2 text-lg font-bold text-emerald-800 bg-white" />

                                <!-- Impact Description -->
                                <div class="mt-4 pt-3 border-t border-emerald-100">
                                    <span class="text-xs text-emerald-600 font-semibold block mb-1">Impacto
                                        Financiero
                                        de
                                        Sentencia</span>
                                    <p v-if="!editing" class="text-sm text-gray-600 italic leading-relaxed">{{
                                        juicio.efecto_sentencia_descripcion || 'Sin análisis de impacto registrado.'
                                        }}
                                    </p>
                                    <textarea v-else v-model="editForm.efecto_sentencia_descripcion" rows="2"
                                        class="w-full border border-gray-300 rounded p-2 text-sm"
                                        placeholder="Describa el impacto..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>

        <!-- Timeline / History -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 class="font-semibold text-gray-800">Acciones por realizar</h3>
                <button @click="showModal = true" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+
                    Agregar
                    Evento</button>
            </div>
            <div class="p-6">
                <div class="relative border-l-2 border-gray-200 ml-3 space-y-8">
                    <div v-for="(evento, idx) in historial" :key="evento.id" class="relative pl-8">
                        <span class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                            :class="idx === 0 ? 'bg-blue-500' : 'bg-gray-300'"></span>
                        <div>
                            <span class="text-xs text-gray-500 font-medium">{{
                                formatDate(evento.fecha_interposicion)
                                }}</span>
                            <h4 class="text-sm font-bold text-gray-800">{{ evento.tipo_evento }}</h4>
                            <p v-if="evento.sala_corte" class="text-xs text-gray-500 italic">{{
                                evento.sala_corte }}
                                -
                                {{
                                    evento.estado_recurso }}</p>
                            <p class="text-sm text-gray-600 mt-1">{{ evento.descripcion }}</p>
                            <div v-if="evento.ruta_archivo_adjunto"
                                @click="downloadFile(evento.id, evento.ruta_archivo_adjunto)"
                                class="mt-2 text-xs text-blue-500 hover:underline cursor-pointer flex items-center gap-1">
                                <Paperclip class="w-3 h-3" /> Ver Adjunto
                            </div>
                        </div>
                    </div>
                    <div v-if="historial.length === 0" class="pl-8 text-sm text-gray-500 italic">
                        No hay eventos registrados.
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Add Event -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Registrar Recurso / Evento</h3>
                <form @submit.prevent="saveEvent" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Tipo Evento</label>
                            <select v-model="newEvent.tipo_evento" class="w-full border rounded p-2" required>
                                <option value="Notificación">Notificación</option>
                                <option value="Audiencia">Audiencia</option>
                                <option value="Apelación">Apelación</option>
                                <option value="Amparo">Amparo</option>
                                <option value="Sentencia">Sentencia</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Fecha</label>
                            <input v-model="newEvent.fecha_interposicion" type="date" class="w-full border rounded p-2"
                                required />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Sala / Corte</label>
                            <input v-model="newEvent.sala_corte" type="text" class="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Estado Recurso</label>
                            <select v-model="newEvent.estado_recurso" class="w-full border rounded p-2">
                                <option value="">- Seleccione -</option>
                                <option value="Interpuesto">Interpuesto</option>
                                <option value="Admitido">Admitido</option>
                                <option value="Rechazado">Rechazado</option>
                                <option value="Resuelto con Lugar">Resuelto con Lugar</option>
                                <option value="Resuelto sin Lugar">Resuelto sin Lugar</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea v-model="newEvent.descripcion" rows="3" class="w-full border rounded p-2"
                            required></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Adjunto (PDF/Img)</label>
                        <input type="file" @change="handleFileUpload" class="w-full text-sm text-gray-500" />
                    </div>
                    <div class="flex justify-end pt-4 gap-3">
                        <button type="button" @click="showModal = false"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            :disabled="uploading">
                            {{ uploading ? 'Guardando...' : 'Registrar Evento' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Audit Log Modal (CU-06) -->
        <div v-if="showAuditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShieldAlert class="w-5 h-5 text-blue-600" />
                        Bitácora de Auditoría
                    </h3>
                    <button @click="showAuditModal = false" class="text-gray-400 hover:text-gray-600">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <div class="overflow-y-auto flex-1">
                    <table class="min-w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th class="px-4 py-2">Fecha/Hora</th>
                                <th class="px-4 py-2">Usuario</th>
                                <th class="px-4 py-2">Acción</th>
                                <th class="px-4 py-2">Detalles</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-gray-50">
                                <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ new
                                    Date(log.fecha).toLocaleString() }}
                                </td>
                                <td class="px-4 py-2 font-medium text-gray-800">{{ log.nombre_usuario }}</td>
                                <td class="px-4 py-2">
                                    <span
                                        class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                        {{ log.accion }}
                                    </span>
                                </td>
                                <td class="px-4 py-2 text-gray-600 italic break-words max-w-xs">{{ log.detalles
                                    }}
                                </td>
                            </tr>
                            <tr v-if="auditLogs.length === 0">
                                <td colspan="4" class="px-4 py-8 text-center text-gray-500 italic">No hay
                                    registros
                                    de
                                    auditoría.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 pt-2 border-t text-right">
                    <button @click="showAuditModal = false"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer Actions including Audit -->
        <div class="mt-8 flex justify-end">
            <button v-if="canViewAudit" @click="openAuditLog"
                class="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm px-4 py-2 rounded transition-colors">
                <ShieldAlert class="w-4 h-4" />
                Ver Historial de Cambios (Auditoría)
            </button>
        </div>
    </div>

    <div v-else class="text-center py-10">
        <p class="text-gray-500">No se encontró el caso.</p>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Building2, FileDown, Edit, Paperclip, Save, X, ShieldAlert, Gavel, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import juridicaService from '../services/juridica.service';
import authService from '../services/auth.service';
import InputAutocomplete from '../components/juridica/InputAutocomplete.vue';
import ActorSearch from '../components/juridica/ActorSearch.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const juicio = ref(null);
const historial = ref([]);
const activeTab = ref('general');
const tabsContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const checkScroll = () => {
    if (tabsContainer.value) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsContainer.value;
        canScrollLeft.value = scrollLeft > 0;
        canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
    }
};

const scroll = (direction) => {
    if (tabsContainer.value) {
        const scrollAmount = 200;
        tabsContainer.value.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
};

// Permissions
const canViewAudit = computed(() => {
    // Check if user has permission 'juridica:audit'
    // This depends on how authService stores permissions. 
    // Assuming getting current user returns roles/permissions or we decode token.
    // For now, let's assume if role is 'admin' or has specific permission in token payload.
    const user = authService.getCurrentUser();
    console.log(user);
    if (!user) return false;
    // Simple check based on role or if we had a hasPermission util.
    // Let's assume user object has 'permissions' array from backend login response if we implemented that, 
    // OR just permit 'admin' for now alongside specific check if we had it.
    // Re-reading init_users.sql, we gave 'juridica:audit' to Admin/Auditor. 
    // Frontend likely needs a utility to check this.
    // Let's implement a safe check:
    const perms = user.permissions || [];
    return perms.includes('juridica:audit') || user.role === 'admin' || user.roles?.includes('admin');
});

// Audit Logic
const showAuditModal = ref(false);
const auditLogs = ref([]);

const openAuditLog = async () => {
    try {
        const res = await juridicaService.getAuditLogs(juicio.value.id);
        auditLogs.value = res.data;
        showAuditModal.value = true;
    } catch (err) {
        console.error("Error loading audit logs:", err);
        // If 403, it means no permission, though button shouldn't show.
        alert("No tiene permisos o ocurrió un error al cargar la auditoría.");
    }
};



// Edit Logic
const editing = ref(false);
const editForm = ref({});

const startEdit = () => {
    editForm.value = { ...juicio.value };
    editing.value = true;
};

const goToFullEdit = () => {
    router.push({ name: 'CaseEdit', params: { id: juicio.value.id } });
};

const cancelEdit = () => {
    editing.value = false;
    editForm.value = {};
};

const saveEdit = async () => {
    try {
        const res = await juridicaService.updateJuicio(juicio.value.id, editForm.value);
        juicio.value = res.data;
        editing.value = false;
    } catch (err) {
        console.error("Error updating case:", err);
        alert("Error al actualizar el caso");
    }
};

// Timeline Logic
const showModal = ref(false);
const uploading = ref(false);
const newEvent = ref({
    tipo_evento: 'Notificación',
    fecha_interposicion: new Date().toISOString().split('T')[0],
    sala_corte: '',
    estado_recurso: '',
    descripcion: '',
    archivo: null
});

const handleFileUpload = (e) => {
    newEvent.value.archivo = e.target.files[0];
};

const saveEvent = async () => {
    uploading.value = true;
    try {
        const formData = new FormData();
        Object.keys(newEvent.value).forEach(key => {
            if (newEvent.value[key] !== null) {
                formData.append(key, newEvent.value[key]);
            }
        });

        await juridicaService.addHistorial(juicio.value.id, formData);

        // Reload history
        loadCase();

        showModal.value = false;
        // Reset form
        newEvent.value = {
            tipo_evento: 'Notificación',
            fecha_interposicion: new Date().toISOString().split('T')[0],
            sala_corte: '',
            estado_recurso: '',
            descripcion: '',
            archivo: null
        };
    } catch (err) {
        console.error("Error adding event:", err);
        alert("Error al agregar evento");
    } finally {
        uploading.value = false;
    }
};

const loadCase = async () => {
    loading.value = true;
    try {
        const id = route.params.id;
        const response = await juridicaService.getJuicioAndHistory(id);
        juicio.value = response.data;
        historial.value = response.data.historial || [];
    } catch (error) {
        console.error("Error loading case:", error);
    } finally {
        loading.value = false;
    }
};

const exportDoc = async () => {
    try {
        const response = await juridicaService.exportDocx(juicio.value.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Ficha_${juicio.value.numero_proceso}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error exporting doc:", error);
        alert("Error al exportar documento");
    }
};

const downloadFile = async (historialId, filename) => {
    try {
        const response = await juridicaService.downloadAttachment(historialId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        // Try to guess filename or generic
        link.setAttribute('download', filename.split('/').pop());
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Error downloading file:", err);
        alert("Error al descargar el archivo.");
    }
};

const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 });
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    // Adjust logic to prevent timezone offset issues if treating as UTC date string
    const d = new Date(dateString);
    return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'En Trámite': return 'bg-yellow-100 text-yellow-800';
        case 'Sentencia': return 'bg-red-100 text-red-800';
        case 'Favorable': return 'bg-green-100 text-green-800';
        case 'Archivado': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// Scroll Logic: Watch for tabsContainer to be available
import { watch, nextTick } from 'vue';

watch(tabsContainer, async (newVal) => {
    if (newVal) {
        newVal.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        // Wait for DOM to stabilise / fonts to load
        await nextTick();
        checkScroll();
        // Double check after a small delay to ensure rendering is complete
        setTimeout(checkScroll, 200);
    }
});

onMounted(() => {
    loadCase();
});

onUnmounted(() => {
    if (tabsContainer.value) {
        tabsContainer.value.removeEventListener('scroll', checkScroll);
    }
    window.removeEventListener('resize', checkScroll);
});
</script>