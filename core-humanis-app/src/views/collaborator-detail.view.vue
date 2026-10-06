<template>
  <div class="dossier-page" v-if="colaborador">
    <!-- Barra Superior de Retorno y Acciones -->
    <div class="top-nav-bar adaptive-bar mb-4">
      <router-link to="/collaborators" class="btn btn-secondary btn-sm">
        ← Volver al Directorio
      </router-link>

      <div class="top-actions adaptive-bar__actions">
        <button
          v-if="authStore.canWrite"
          class="btn btn-secondary btn-sm"
          @click="openEditarModal"
        >
          ✏️ Editar Datos
        </button>

        <button
          v-if="authStore.canWrite"
          class="btn btn-secondary btn-sm"
          @click="openCrearAccesoModal"
          title="Generar credenciales para el Portal del Empleado (Self-Service)"
        >
          🔑 Acceso Portal Self-Service
        </button>

        <button
          v-if="authStore.canIssueConstancias"
          class="btn btn-primary btn-sm"
          @click="irAConstancia"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Emitir Constancia Oficial
        </button>

        <button class="btn btn-secondary btn-sm" @click="imprimirFicha">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect width="12" height="8" x="6" y="14"></rect>
          </svg>
          Imprimir Ficha Resumen
        </button>
      </div>
    </div>

    <!-- Tarjeta Principal de Identidad 360° -->
    <div class="header-card card">
      <div class="header-main">
        <img
          :src="colaborador.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'"
          class="avatar-lg"
          alt="Foto Colaborador"
        />

        <div class="header-info">
          <div class="badges-row">
            <span class="badge badge-info">
              Renglón {{ colaborador.contrato_actual?.renglon_codigo || '011' }} &bull; {{ colaborador.contrato_actual?.renglon_nombre }}
            </span>
            <span class="badge" :class="'badge-' + (colaborador.semaforo_expediente?.color || 'verde')">
              <span class="indicator-dot" :class="colaborador.semaforo_expediente?.color || 'verde'"></span>
              {{ colaborador.semaforo_expediente?.badge || 'Expediente Completo' }}
            </span>
          </div>

          <h1 class="colab-fullname">
            {{ colaborador.primer_nombre }} {{ colaborador.segundo_nombre || '' }} {{ colaborador.primer_apellido }} {{ colaborador.segundo_apellido || '' }}
          </h1>

          <p class="colab-puesto">
            <strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong> &mdash; {{ colaborador.contrato_actual?.unidad_admin }}
          </p>

          <div class="quick-meta-grid">
            <div class="meta-item">
              <span class="meta-label">CUI / DPI:</span>
              <span class="meta-val font-mono">{{ colaborador.cui_dpi }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">NIT (SAT):</span>
              <span class="meta-val">{{ colaborador.nit || 'No registrado' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">No. IGSS:</span>
              <span class="meta-val">{{ colaborador.igss_afiliacion || 'N/A (Sin afiliación)' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Compensación:</span>
              <span class="meta-val highlight">
                Q {{ Number(colaborador.contrato_actual?.salario_honorarios || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}
                <small>({{ ['011','022','021'].includes(colaborador.contrato_actual?.renglon_codigo) ? 'Salario' : 'Honorarios' }})</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pestañas del Dossier 360° -->
    <div class="tabs-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        Resumen General
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'laboral' }"
        @click="activeTab = 'laboral'"
      >
        Puestos y Contratos
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'expediente' }"
        @click="activeTab = 'expediente'"
      >
        Expediente Digital ({{ colaborador.documentos?.length || 0 }} docs)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'personal' }"
        @click="activeTab = 'personal'"
      >
        Datos Personales
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'academico' }"
        @click="activeTab = 'academico'"
      >
        Formación y Colegiado ({{ (colaborador?.estudios || []).length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'clinica' }"
        @click="seleccionarTabClinica"
      >
        Historial Clínico / Reposos ({{ consultasColaborador.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'constancias' }"
        @click="seleccionarTabConstancias"
      >
        Constancias QR ({{ colabStore.constanciasColaborador.length }})
      </button>
    </div>

    <!-- Contenido de las Pestañas -->
    <div class="tab-content">
      <!-- PESTAÑA 1: RESUMEN GENERAL -->
      <div v-if="activeTab === 'general'" class="grid-2">
        <div class="card card-body">
          <h3 class="section-title">Información de Nombramiento Vigente</h3>
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Puesto Funcional (Operativo):</span>
              <span class="detail-value"><strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Puesto Nominal (ONSEC):</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.puesto_nominal }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Unidad / Dirección:</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.unidad_admin }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">No. Acuerdo / Contrato:</span>
              <span class="detail-value font-mono">{{ colaborador.contrato_actual?.numero_acuerdo_contrato || 'Pendiente' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Partida Presupuestaria:</span>
              <span class="detail-value font-mono">{{ colaborador.contrato_actual?.partida_presupuestaria }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha de Inicio / Posesión:</span>
              <span class="detail-value">{{ formatDate(colaborador.contrato_actual?.fecha_inicio) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha Vencimiento Contrato:</span>
              <span class="detail-value">{{ formatDate(colaborador.contrato_actual?.fecha_fin, { fallback: 'Indefinido (Permanente)' }) }}</span>
            </div>
          </div>
        </div>

        <div class="card card-body">
          <h3 class="section-title">Semáforo de Cumplimiento Documental</h3>
          <div style="margin-bottom: 1rem;">
            <span class="badge" :class="'badge-' + (colaborador.semaforo_expediente?.color || 'verde')">
              {{ colaborador.semaforo_expediente?.badge }}
            </span>
          </div>

          <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.6;">
            El expediente digital consolida la documentación obligatoria y legal requerida por la Contraloría General de Cuentas (CGC) y ONSEC según el renglón presupuestario <strong>{{ colaborador.contrato_actual?.renglon_codigo }}</strong>.
          </p>

          <div style="margin-top: 1.25rem;">
            <button class="btn btn-secondary btn-sm" @click="activeTab = 'expediente'">
              Ver Repositorio de Documentos →
            </button>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 2: PUESTOS Y CONTRATOS (DUALIDAD BR-01) -->
      <div v-if="activeTab === 'laboral'" class="card card-body">
        <h3 class="section-title">Contrataciones y Movimientos Institucionales</h3>
        <p style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          Implementación de la regla <strong>BR-01</strong>: Distinción entre Puesto Nominal oficial y Puesto Funcional operativo.
        </p>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Renglón</th>
                <th>Puesto Funcional</th>
                <th>Puesto Nominal</th>
                <th>Acuerdo / Contrato</th>
                <th>Vigencia</th>
                <th>Monto Mensual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge badge-info">{{ colaborador.contrato_actual?.renglon_codigo }}</span></td>
                <td><strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong></td>
                <td>{{ colaborador.contrato_actual?.puesto_nominal }}</td>
                <td><span class="font-mono">{{ colaborador.contrato_actual?.numero_acuerdo_contrato }}</span></td>
                <td>{{ formatDateRange(colaborador.contrato_actual?.fecha_inicio, colaborador.contrato_actual?.fecha_fin, 'Vigente') }}</td>
                <td><strong>Q {{ Number(colaborador.contrato_actual?.salario_honorarios || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}</strong></td>
                <td><span class="badge badge-verde">ACTIVO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PESTAÑA 3: EXPEDIENTE DIGITAL -->
      <div v-if="activeTab === 'expediente'" class="card card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 class="section-title">Expediente Digital Único</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              Documentación digitalizada y semáforos de caducidad legal (CGC, Antecedentes, Colegiado)
            </p>
          </div>

          <button v-if="authStore.canWrite" class="btn btn-primary btn-sm" @click="showSubirDocModal = true">
            + Adjuntar Documento
          </button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tipo de Documento</th>
                <th>No. Documento</th>
                <th>Emisión</th>
                <th>Vencimiento</th>
                <th>Semáforo Legal</th>
                <th>Archivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in colaborador.documentos" :key="d.id">
                <td>
                  <strong>{{ d.tipo_nombre }}</strong>
                  <span v-if="d.tipo_codigo === 'DOC_FINIQ_CGC'" class="badge badge-amarillo" style="margin-left: 0.5rem; font-size: 0.6875rem;">
                    Regla 6 meses CGC
                  </span>
                </td>
                <td><span class="font-mono">{{ d.numero_documento || 'S/N' }}</span></td>
                <td>{{ formatDate(d.fecha_emision, { fallback: 'N/A' }) }}</td>
                <td>{{ formatDate(d.fecha_vencimiento, { fallback: 'No expira' }) }}</td>
                <td>
                  <span class="badge" :class="'badge-' + (d.vigencia_color || 'verde')">
                    <span class="indicator-dot" :class="d.vigencia_color || 'verde'"></span>
                    {{ d.vigencia_label || d.estado_vigencia }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" @click="verArchivo(d)">
                    📄 {{ d.nombre_archivo }}
                  </button>
                </td>
              </tr>

              <tr v-if="!colaborador.documentos || colaborador.documentos.length === 0">
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  Aún no se han adjuntado documentos digitalizados a este expediente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PESTAÑA 4: DATOS PERSONALES -->
      <div v-if="activeTab === 'personal'" class="card card-body">
        <h3 class="section-title">Datos Personales y de Contacto</h3>
        <div class="grid-2" style="margin-top: 1rem;">
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Nombres:</span>
              <span class="detail-value">{{ colaborador.primer_nombre }} {{ colaborador.segundo_nombre || '' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Apellidos:</span>
              <span class="detail-value">{{ colaborador.primer_apellido }} {{ colaborador.segundo_apellido || '' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha de Nacimiento:</span>
              <span class="detail-value">{{ formatHumanDate(colaborador.fecha_nacimiento) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Género:</span>
              <span class="detail-value">{{ colaborador.genero }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Estado Civil:</span>
              <span class="detail-value">{{ colaborador.estado_civil }}</span>
            </div>
          </div>

          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Dirección de Residencia:</span>
              <span class="detail-value">{{ colaborador.direccion_residencia || 'Guatemala' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Teléfono Celular:</span>
              <span class="detail-value">{{ colaborador.telefono_personal || 'No registrado' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Correo Institucional:</span>
              <span class="detail-value">{{ colaborador.correo_institucional }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Correo Personal:</span>
              <span class="detail-value">{{ colaborador.correo_personal || 'No registrado' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 5: FORMACIÓN Y COLEGIACIÓN (ESTILO LINKEDIN) -->
      <div v-if="activeTab === 'academico'" class="academico-linkedin-container">
        <!-- Banner de Síntesis Profesional -->
        <div class="card card-body linkedin-header-card mb-4">
          <div class="linkedin-header-content">
            <div class="linkedin-header-info">
              <h3 class="section-title mb-1">Perfil Académico & Colegiación Profesional</h3>
              <p class="text-muted text-sm">
                Registro de trayectoria académica, grados universitarios y habilitación legal para el ejercicio profesional (Decreto 72-2001 - Ley de Colegiación Profesional Obligatoria).
              </p>
            </div>
            <div class="linkedin-header-badges">
              <span class="badge badge-info font-medium">
                🎓 {{ educationList.length }} {{ educationList.length === 1 ? 'Grado Académico' : 'Grados Académicos' }}
              </span>
              <span class="badge" :class="colegiadoList.length ? 'badge-verde' : 'badge-neutral'">
                ⚖️ {{ colegiadoList.length ? 'Colegiado Habilitado' : 'Sin Colegiatura' }}
              </span>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 1: EDUCACIÓN (LINKEDIN STYLE) -->
        <div class="card card-body linkedin-section mb-4">
          <div class="linkedin-section-header">
            <div class="d-flex align-center gap-2">
              <div class="section-icon-badge bg-primary-soft">
                🎓
              </div>
              <div>
                <h3 class="section-title mb-0">Educación y Trayectoria Universitaria</h3>
                <span class="text-muted text-xs">Licenciaturas, Maestrías, Doctorados y Carreras Técnicas</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm d-flex align-center gap-1" @click="abrirModalEducacion()">
              <span>+ Añadir Formación</span>
            </button>
          </div>

          <!-- Listado de Formación Académica -->
          <div v-if="educationList.length > 0" class="linkedin-list">
            <div v-for="(est, i) in educationList" :key="est.id || i" class="linkedin-item">
              <div class="linkedin-item-avatar">
                <span class="school-avatar-icon">🏛️</span>
              </div>
              <div class="linkedin-item-body">
                <div class="linkedin-item-title-row">
                  <h4 class="linkedin-institution">{{ est.institucion || 'Institución Universitaria' }}</h4>
                  <div class="linkedin-actions">
                    <button class="btn-icon" title="Editar formación" @click="editarEstudio(est)">
                      ✏️
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Eliminar formación" @click="eliminarEstudioRegistro(est)">
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="linkedin-degree">
                  <strong>{{ est.titulo_obtenido }}</strong>
                  <span v-if="est.nivel_academico" class="badge badge-neutral text-xs ml-2">{{ est.nivel_academico }}</span>
                </div>
                <div v-if="est.campo_estudio" class="linkedin-field text-muted text-sm mt-1">
                  Disciplina: {{ est.campo_estudio }}
                </div>
                <div class="linkedin-period text-muted text-xs mt-1">
                  📅 {{ formatPeriodoEstudios(est) }}
                </div>
                <div v-if="est.notas" class="linkedin-notes mt-2">
                  <p class="text-sm">"{{ est.notas }}"</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State Educación -->
          <div v-else class="linkedin-empty-state">
            <div class="empty-icon">🎓</div>
            <h4 class="empty-title">Aún no hay formación académica registrada</h4>
            <p class="empty-desc text-muted text-sm">
              Registra los títulos de licenciatura, maestrías o especializaciones universitarias del colaborador.
            </p>
            <button class="btn btn-outline btn-sm mt-3" @click="abrirModalEducacion()">
              + Registrar primer título académico
            </button>
          </div>
        </div>

        <!-- SECCIÓN 2: COLEGIACIÓN PROFESIONAL Y LICENCIAS (LINKEDIN STYLE) -->
        <div class="card card-body linkedin-section">
          <div class="linkedin-section-header">
            <div class="d-flex align-center gap-2">
              <div class="section-icon-badge bg-gold-soft">
                ⚖️
              </div>
              <div>
                <h3 class="section-title mb-0">Colegiación Profesional y Acreditaciones Oficiales</h3>
                <span class="text-muted text-xs">Colegios Profesionales de Guatemala (Ley Dto. 72-2001)</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm d-flex align-center gap-1" @click="abrirModalColegiado()">
              <span>+ Registrar Colegiatura</span>
            </button>
          </div>

          <!-- Listado de Colegiaturas -->
          <div v-if="colegiadoList.length > 0" class="linkedin-list">
            <div v-for="(col, i) in colegiadoList" :key="col.id || i" class="linkedin-item">
              <div class="linkedin-item-avatar colegiado-avatar">
                <span class="school-avatar-icon">⚖️</span>
              </div>
              <div class="linkedin-item-body">
                <div class="linkedin-item-title-row">
                  <h4 class="linkedin-institution">{{ col.colegio_profesional || 'Colegio Profesional Oficial' }}</h4>
                  <div class="linkedin-actions">
                    <button class="btn-icon" title="Editar colegiatura" @click="editarEstudio(col)">
                      ✏️
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Eliminar colegiatura" @click="eliminarEstudioRegistro(col)">
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="linkedin-degree d-flex align-center gap-2 flex-wrap">
                  <span class="font-bold text-primary font-mono">No. Colegiado: {{ col.numero_colegiado }}</span>
                  <span class="badge" :class="col.estado_colegiado === 'ACTIVO' ? 'badge-verde' : 'badge-rojo'">
                    {{ col.estado_colegiado === 'ACTIVO' ? 'Colegiado Activo ✓' : (col.estado_colegiado || 'ACTIVO') }}
                  </span>
                </div>
                <div v-if="col.titulo_obtenido" class="linkedin-field text-muted text-sm mt-1">
                  Acreditación: <strong>{{ col.titulo_obtenido }}</strong>
                </div>
                <div class="linkedin-period text-muted text-xs mt-1">
                  <span v-if="col.vigencia_colegiado">
                    🗓️ Vigencia de Constancia: <strong>{{ formatDate(col.vigencia_colegiado) }}</strong>
                  </span>
                  <span v-if="col.fecha_graduacion">
                    &bull; Colegiado desde: {{ formatDate(col.fecha_graduacion) }}
                  </span>
                </div>
                <div v-if="col.notas" class="linkedin-notes mt-2">
                  <p class="text-sm">"{{ col.notas }}"</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State Colegiación -->
          <div v-else class="linkedin-empty-state">
            <div class="empty-icon">⚖️</div>
            <h4 class="empty-title">Sin constancia de colegiado activo</h4>
            <p class="empty-desc text-muted text-sm">
              Para puestos profesionales en renglones 011, 021, 022, 029 y 189, ingresa el número oficial de colegiado activo para validar el perfil.
            </p>
            <button class="btn btn-outline btn-sm mt-3" @click="abrirModalColegiado()">
              + Registrar número de colegiado
            </button>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 6: HISTORIAL CLÍNICO Y REPOSOS (SALUD OCUPACIONAL SSO) -->
      <div v-if="activeTab === 'clinica'" class="card card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 class="section-title" style="margin-bottom: 0.25rem;">Historial de Consultas Médicas & Reposos Prescritos</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              🔒 Registro confidencial resguardado conforme a la Ley de Acceso a la Información Pública y normativa AG 229-2014 / SSO.
            </p>
          </div>
          <router-link to="/occupational-health" class="btn btn-secondary btn-sm">
            🩺 Ir a Clínica Médica / SSO ↗
          </router-link>
        </div>

        <div v-if="loadingClinica" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Cargando expediente médico...
        </div>

        <div v-else-if="consultasColaborador.length === 0" style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-subtle); border-radius: var(--radius-md);">
          🩺 No se registran atenciones médicas o licencias de reposo emitidas para este colaborador.
        </div>

        <div v-else class="table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha Atención</th>
                <th>Atendido por</th>
                <th>Motivo Consulta</th>
                <th>Diagnóstico Clínico</th>
                <th>Reposo Autorizado</th>
                <th>Consulta Ext. IGSS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in consultasColaborador" :key="c.id">
                <td><strong class="font-mono">{{ formatDate(c.fecha_consulta) }}</strong></td>
                <td>{{ c.doctora_nombre || 'Dra. Claudia Ramos' }}</td>
                <td>{{ c.motivo_consulta }}</td>
                <td><strong>{{ c.diagnostico }}</strong></td>
                <td>
                  <span v-if="c.genera_reposo" class="badge badge-rojo">
                    🛑 {{ c.dias_reposo }} Día(s) de Reposo
                  </span>
                  <span v-else class="badge badge-secondary">Sin Reposo</span>
                </td>
                <td>
                  <span v-if="c.remite_igss" class="badge badge-warning">
                    🏥 Remitido al IGSS
                  </span>
                  <span v-else style="color: var(--text-muted); font-size: 0.8125rem;">No aplica</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PESTAÑA 7: CONSTANCIAS EMITIDAS (HATEOAS BIDIRECCIONAL) -->
      <div v-if="activeTab === 'constancias'" class="card card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 class="section-title">Constancias Laborales Oficiales</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              Documentos generados con firma digital institucional y código QR de validación pública
            </p>
          </div>

          <button
            v-if="authStore.canIssueConstancias"
            class="btn btn-primary btn-sm"
            @click="irAConstancia"
          >
            + Emitir Nueva Constancia
          </button>
        </div>

        <div v-if="colabStore.loadingConstancias" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Cargando historial de constancias emitidas...
        </div>

        <div v-else-if="colabStore.constanciasColaborador.length === 0" style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-subtle); border-radius: var(--radius-md);">
          📄 No se han emitido constancias laborales para este colaborador aún.
        </div>

        <div v-else class="table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Correlativo</th>
                <th>Tipo</th>
                <th>Dirigido a</th>
                <th>Fecha Emisión</th>
                <th>Hash de Seguridad</th>
                <th style="text-align: right;">Verificación Pública</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in colabStore.constanciasColaborador" :key="c.id">
                <td><strong class="font-mono">{{ c.correlativo }}</strong></td>
                <td>
                  <span class="badge" :class="c.tipo_constancia === 'LABORAL' ? 'badge-info' : 'badge-warning'">
                    {{ c.tipo_constancia === 'LABORAL' ? 'Laboral (011/022)' : 'Servicios (029)' }}
                  </span>
                </td>
                <td>{{ c.dirigido_a || 'A QUIEN INTERESE' }}</td>
                <td>{{ formatDate(c.fecha_emision) }}</td>
                <td><span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">{{ c.hash_verificacion?.substring(0, 16) }}...</span></td>
                <td style="text-align: right;">
                  <a
                    :href="'/core-humanis/certificates/verifications/' + c.hash_verificacion"
                    target="_blank"
                    class="btn btn-secondary btn-sm"
                    title="Verificar en portal público QR"
                  >
                    Verificar QR ↗
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Subir Documento -->
    <SubirDocumentoModal
      v-if="showSubirDocModal"
      :colaborador-id="colaborador.id"
      :colaborador-nombre="colaborador.primer_nombre + ' ' + colaborador.primer_apellido"
      @close="showSubirDocModal = false"
      @uploaded="handleDocUploaded"
    />

    <!-- Modal Editar Datos del Colaborador -->
    <div v-if="showEditarModal" class="modal-overlay">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>✏️ Editar Datos del Colaborador</h3>
          <button class="modal-close-btn" @click="showEditarModal = false">×</button>
        </div>
        <form @submit.prevent="guardarEdicionColaborador" class="modal-body">
          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Primer Nombre *</label>
              <input type="text" v-model="editForm.primer_nombre" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Segundo Nombre</label>
              <input type="text" v-model="editForm.segundo_nombre" class="form-control" />
            </div>
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Primer Apellido *</label>
              <input type="text" v-model="editForm.primer_apellido" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Segundo Apellido</label>
              <input type="text" v-model="editForm.segundo_apellido" class="form-control" />
            </div>
          </div>

          <div class="grid-3 mb-3">
            <div class="form-group">
              <label class="form-label">Fecha de Nacimiento</label>
              <input type="date" v-model="editForm.fecha_nacimiento" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Género</label>
              <select v-model="editForm.genero" class="form-control">
                <option value="">Seleccione género...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Estado Civil</label>
              <select v-model="editForm.estado_civil" class="form-control">
                <option value="">Seleccione estado civil...</option>
                <option value="SOLTERO/A">Soltero/a</option>
                <option value="CASADO/A">Casado/a</option>
              </select>
            </div>
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">NIT (SAT)</label>
              <input type="text" v-model="editForm.nit" class="form-control" placeholder="Ej. 1234567-8" />
            </div>
            <div class="form-group">
              <label class="form-label">No. Afiliación IGSS</label>
              <input type="text" v-model="editForm.igss_afiliacion" class="form-control" placeholder="Ej. 10000001" />
            </div>
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Teléfono Celular</label>
              <input type="text" v-model="editForm.telefono_personal" class="form-control" placeholder="Ej. 55551234" />
            </div>
            <div class="form-group">
              <label class="form-label">Correo Personal</label>
              <input type="email" v-model="editForm.correo_personal" class="form-control" placeholder="colaborador@ejemplo.com" />
            </div>
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Correo Institucional</label>
              <input type="email" v-model="editForm.correo_institucional" class="form-control" placeholder="usuario@scspr.gob.gt" />
            </div>
            <div class="form-group">
              <label class="form-label">Dirección de Residencia</label>
              <input type="text" v-model="editForm.direccion_residencia" class="form-control" placeholder="Ciudad de Guatemala" />
            </div>
          </div>

          <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" @click="showEditarModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="savingEdit">
              {{ savingEdit ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Habilitación de Acceso Portal Self-Service -->
    <div v-if="showAccesoModal" class="modal-overlay">
      <div class="modal-card card" style="max-width: 520px;">
        <div class="modal-header">
          <h3>🔑 Acceso al Portal del Empleado (Self-Service)</h3>
          <button class="modal-close-btn" @click="showAccesoModal = false">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
            El colaborador se autenticará en el portal central utilizando su <strong>CUI / DPI</strong> o <strong>Correo Institucional</strong> amarrado automáticamente a este expediente sin modificar la base global.
          </p>

          <div style="background: var(--bg-subtle, #f8fafc); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); margin-bottom: 1rem;">
            <div style="margin-bottom: 0.5rem;">
              <span class="text-muted text-xs">Identificador de Usuario (CUI):</span>
              <div class="font-mono font-bold">{{ colaborador.cui_dpi }}</div>
            </div>
            <div style="margin-bottom: 0.5rem;">
              <span class="text-muted text-xs">Correo Institucional Registrado:</span>
              <div class="font-bold">{{ colaborador.correo_institucional || 'No registrado (Usar personal)' }}</div>
            </div>
            <div>
              <span class="text-muted text-xs">Rol Asignado:</span>
              <div><span class="badge badge-info">COLABORADOR (Self-Service)</span></div>
            </div>
          </div>

          <div style="font-size: 0.8125rem; color: var(--color-primary); background: #e0f2fe; padding: 0.75rem; border-radius: 6px;">
            💡 <strong>Sincronización Automática:</strong> Al iniciar sesión con su CUI en <code>/login</code>, la API mapea sus datos laborales, solicitudes de vacaciones y emisión de constancias QR de forma segura.
          </div>

          <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" @click="showAccesoModal = false">Cerrar</button>
            <button type="button" class="btn btn-primary" @click="copiarDatosAcceso">
              📋 Copiar Datos de Acceso
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Añadir/Editar Formación Académica (Estilo LinkedIn) -->
    <div v-if="showModalEducacion" class="modal-overlay">
      <div class="modal-card card" style="max-width: 620px;">
        <div class="modal-header">
          <h3>🎓 {{ formEducacion.id ? 'Editar Formación Académica' : 'Añadir Formación Académica' }}</h3>
          <button class="modal-close-btn" @click="showModalEducacion = false">×</button>
        </div>
        <form @submit.prevent="guardarEducacion" class="modal-body">
          <div class="form-group mb-3">
            <label class="form-label">Institución Educativa / Universidad *</label>
            <input
              type="text"
              v-model="formEducacion.institucion"
              list="universidades-gt"
              class="form-control"
              placeholder="Ej. Universidad de San Carlos de Guatemala (USAC)"
              required
            />
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Nivel Académico *</label>
              <select v-model="formEducacion.nivel_academico" class="form-control" required>
                <option value="DOCTORADO">Doctorado (PhD)</option>
                <option value="MAESTRIA">Maestría / Posgrado</option>
                <option value="LICENCIATURA">Licenciatura / Ingeniería</option>
                <option value="TECNICO">Técnico Universitario</option>
                <option value="DIVERSIFICADO">Educación Media / Diversificado</option>
                <option value="CERTIFICACION">Certificación Profesional</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Disciplina / Campo de Estudio</label>
              <input
                type="text"
                v-model="formEducacion.campo_estudio"
                class="form-control"
                placeholder="Ej. Ciencias Jurídicas / Informática"
              />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Título Obtenido / Carrera *</label>
            <input
              type="text"
              v-model="formEducacion.titulo_obtenido"
              class="form-control"
              placeholder="Ej. Licenciatura en Ciencias Jurídicas y Sociales, Abogado y Notario"
              required
            />
          </div>

          <div class="grid-2 mb-2">
            <div class="form-group">
              <label class="form-label">Fecha o Año de Inicio</label>
              <input type="date" v-model="formEducacion.fecha_inicio" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Graduación / Finalización</label>
              <input
                type="date"
                v-model="formEducacion.fecha_graduacion"
                class="form-control"
                :disabled="formEducacion.en_curso"
              />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" v-model="formEducacion.en_curso" />
              <span class="text-sm">Actualmente cursando / En proceso de graduación</span>
            </label>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Tesis, Distinción o Mención Honorífica (Opcional)</label>
            <textarea
              v-model="formEducacion.notas"
              class="form-control"
              rows="2"
              placeholder="Ej. Graduado con distinción Cum Laude. Tesis sobre Modernización del Estado."
            ></textarea>
          </div>

          <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" @click="showModalEducacion = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="savingStudy">
              {{ savingStudy ? 'Guardando...' : (formEducacion.id ? 'Actualizar Formación' : 'Guardar Formación') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Registrar/Editar Colegiación Profesional (Estilo LinkedIn) -->
    <div v-if="showModalColegiado" class="modal-overlay">
      <div class="modal-card card" style="max-width: 620px;">
        <div class="modal-header">
          <h3>⚖️ {{ formColegiado.id ? 'Editar Colegiación Profesional' : 'Registrar Colegiación Profesional' }}</h3>
          <button class="modal-close-btn" @click="showModalColegiado = false">×</button>
        </div>
        <form @submit.prevent="guardarColegiado" class="modal-body">
          <div class="form-group mb-3">
            <label class="form-label">Colegio Profesional Oficial *</label>
            <input
              type="text"
              v-model="formColegiado.colegio_profesional"
              list="colegios-gt"
              class="form-control"
              placeholder="Seleccione o escriba el colegio..."
              required
            />
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Número de Colegiado *</label>
              <input
                type="text"
                v-model="formColegiado.numero_colegiado"
                class="form-control font-mono"
                placeholder="Ej. 24892"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Estado de Colegiación *</label>
              <select v-model="formColegiado.estado_colegiado" class="form-control" required>
                <option value="ACTIVO">Activo (Solvente)</option>
                <option value="INACTIVO">Inactivo / Vencido</option>
                <option value="EN_TRAMITE">En Trámite de Inscripción</option>
              </select>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Profesión / Especialidad Acreditada</label>
            <input
              type="text"
              v-model="formColegiado.titulo_obtenido"
              class="form-control"
              placeholder="Ej. Abogado y Notario, Ingeniero de Sistemas, Auditor..."
            />
          </div>

          <div class="grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Fecha de Inscripción / Graduación</label>
              <input type="date" v-model="formColegiado.fecha_graduacion" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Vigencia Constancia Colegiado Activo</label>
              <input type="date" v-model="formColegiado.vigencia_colegiado" class="form-control" />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Observaciones de Solvencia (Opcional)</label>
            <textarea
              v-model="formColegiado.notas"
              class="form-control"
              rows="2"
              placeholder="Ej. Constancia de colegiado activo emitida para el ciclo 2026."
            ></textarea>
          </div>

          <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" @click="showModalColegiado = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="savingStudy">
              {{ savingStudy ? 'Guardando...' : (formColegiado.id ? 'Actualizar Colegiatura' : 'Guardar Colegiatura') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Datalists para autocompletado inteligente (LinkedIn UX) -->
    <datalist id="universidades-gt">
      <option value="Universidad de San Carlos de Guatemala (USAC)" />
      <option value="Universidad Rafael Landívar (URL)" />
      <option value="Universidad del Valle de Guatemala (UVG)" />
      <option value="Universidad Mariano Gálvez de Guatemala (UMG)" />
      <option value="Universidad Galileo" />
      <option value="Universidad del Istmo (UNIS)" />
      <option value="Universidad Panamericana (UPANA)" />
      <option value="Universidad San Pablo de Guatemala (USPG)" />
      <option value="Universidad Mesoamericana" />
      <option value="Universidad Da Vinci de Guatemala" />
      <option value="Escuela Nacional Central de Agricultura (ENCA)" />
      <option value="Instituto Nacional de Administración Pública (INAP)" />
      <option value="Centro de Estudios Superiores de la Defensa (CESDEN)" />
      <option value="Universidad Internacional / Extranjero" />
    </datalist>

    <datalist id="colegios-gt">
      <option value="Colegio de Abogados y Notarios de Guatemala (CANG)" />
      <option value="Colegio de Ingenieros de Guatemala (CIG)" />
      <option value="Colegio de Médicos y Cirujanos de Guatemala (COLMED)" />
      <option value="Colegio de Contadores Públicos y Auditores de Guatemala (CPA)" />
      <option value="Colegio de Economistas, Contadores Públicos y Auditores y Administradores de Empresas (CCE)" />
      <option value="Colegio de Humanidades de Guatemala" />
      <option value="Colegio de Arquitectos de Guatemala (CAG)" />
      <option value="Colegio de Farmacéuticos y Químicos de Guatemala (COFAQUI)" />
      <option value="Colegio de Psicólogos de Guatemala" />
      <option value="Colegio de Ingenieros Químicos de Guatemala" />
      <option value="Colegio de Médicos Veterinarios y Zootecnistas de Guatemala" />
      <option value="Otro Colegio Profesional" />
    </datalist>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import apiClient from "../api/client";
import SubirDocumentoModal from "../components/upload-document.modal.vue";
import { useToast } from "../composables/useToast";
import { formatDate, formatHumanDate, formatDateRange } from "../utils/date";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const colaborador = ref(null);
const activeTab = ref("general");
const showSubirDocModal = ref(false);
const showEditarModal = ref(false);
const showAccesoModal = ref(false);
const savingEdit = ref(false);

const openCrearAccesoModal = () => {
  showAccesoModal.value = true;
};

const copiarDatosAcceso = () => {
  if (!colaborador.value) return;
  const info = `DATOS DE ACCESO PORTAL EMPLEADO SCSPR:\n` +
    `CUI / Usuario: ${colaborador.value.cui_dpi}\n` +
    `Correo Institucional: ${colaborador.value.correo_institucional || 'No indicado'}\n` +
    `Rol: COLABORADOR (Self-Service)\n` +
    `Enlace de Ingreso: ${window.location.origin}/login`;
  navigator.clipboard.writeText(info);
  toast.success("Datos de acceso copiados al portapapeles");
};
const editForm = ref({
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  fecha_nacimiento: "",
  genero: "",
  estado_civil: "",
  nit: "",
  igss_afiliacion: "",
  telefono_personal: "",
  correo_personal: "",
  correo_institucional: "",
  direccion_residencia: "",
});

const openEditarModal = () => {
  if (!colaborador.value) return;
  const c = colaborador.value;
  editForm.value = {
    primer_nombre: c.primer_nombre || "",
    segundo_nombre: c.segundo_nombre || "",
    primer_apellido: c.primer_apellido || "",
    segundo_apellido: c.segundo_apellido || "",
    fecha_nacimiento: c.fecha_nacimiento ? String(c.fecha_nacimiento).split("T")[0] : "",
    genero: c.genero || "",
    estado_civil: c.estado_civil || "",
    nit: c.nit || "",
    igss_afiliacion: c.igss_afiliacion || "",
    telefono_personal: c.telefono_personal || "",
    correo_personal: c.correo_personal || "",
    correo_institucional: c.correo_institucional || "",
    direccion_residencia: c.direccion_residencia || "",
  };
  showEditarModal.value = true;
};

const guardarEdicionColaborador = async () => {
  if (!colaborador.value?.id) return;
  savingEdit.value = true;
  try {
    await colabStore.actualizarColaborador(colaborador.value.id, editForm.value);
    toast.success("Expediente del colaborador actualizado exitosamente.");
    showEditarModal.value = false;
    await loadColaborador();
  } catch (err) {
    toast.error(err.message || "Error al actualizar los datos del colaborador");
  } finally {
    savingEdit.value = false;
  }
};
const consultasColaborador = ref([]);
const loadingClinica = ref(false);

const loadColaborador = async () => {
  colaborador.value = await colabStore.fetchColaboradorById(route.params.id);
  if (colaborador.value?.id) {
    colabStore.fetchConstanciasColaborador(colaborador.value.id);
    fetchConsultasClinicas();
  }
};

const fetchConsultasClinicas = async () => {
  if (!colaborador.value?.id) return;
  loadingClinica.value = true;
  try {
    const res = await apiClient.get(`/occupational-health/consultations?persona_id=${colaborador.value.id}`);
    if (res.data.success) {
      consultasColaborador.value = res.data.data || [];
    }
  } catch (err) {
    console.error("Error al obtener consultas clínicas del colaborador:", err);
  } finally {
    loadingClinica.value = false;
  }
};

const seleccionarTabClinica = () => {
  activeTab.value = "clinica";
  fetchConsultasClinicas();
};

const seleccionarTabConstancias = () => {
  activeTab.value = "constancias";
  if (colaborador.value?.id) {
    colabStore.fetchConstanciasColaborador(colaborador.value.id);
  }
};

onMounted(() => {
  loadColaborador();
});

const handleDocUploaded = () => {
  loadColaborador();
  colabStore.fetchAlertas();
};

const irAConstancia = () => {
  router.push({ path: "/certificates", query: { persona_id: colaborador.value?.id } });
};

const imprimirFicha = () => {
  window.print();
};

const verArchivo = (doc) => {
  toast.info(`Previsualizando "${doc.nombre_archivo}" (No. ${doc.numero_documento || 'S/N'}). Estado: ${doc.estado_vigencia}.`);
};

// ===========================================================================
// LÓGICA DE FORMACIÓN Y COLEGIACIÓN (EXPERIENCIA LINKEDIN)
// ===========================================================================

const educationList = computed(() => {
  if (!colaborador.value?.estudios) return [];
  return colaborador.value.estudios.filter(
    (e) => e.institucion || (e.titulo_obtenido && !e.numero_colegiado)
  );
});

const colegiadoList = computed(() => {
  if (!colaborador.value?.estudios) return [];
  return colaborador.value.estudios.filter(
    (e) => e.numero_colegiado || e.colegio_profesional
  );
});

const showModalEducacion = ref(false);
const showModalColegiado = ref(false);
const savingStudy = ref(false);

const formEducacion = ref({
  id: null,
  institucion: "",
  nivel_academico: "LICENCIATURA",
  titulo_obtenido: "",
  campo_estudio: "",
  fecha_inicio: "",
  fecha_graduacion: "",
  en_curso: false,
  notas: "",
});

const formColegiado = ref({
  id: null,
  colegio_profesional: "Colegio de Abogados y Notarios de Guatemala (CANG)",
  numero_colegiado: "",
  titulo_obtenido: "",
  estado_colegiado: "ACTIVO",
  fecha_graduacion: "",
  vigencia_colegiado: "",
  notas: "",
});

const formatPeriodoEstudios = (est) => {
  if (est.fecha_inicio && est.en_curso) {
    return `${formatDate(est.fecha_inicio)} – Actualidad (En curso)`;
  }
  if (est.fecha_inicio && est.fecha_graduacion) {
    return `${formatDate(est.fecha_inicio)} – ${formatDate(est.fecha_graduacion)}`;
  }
  if (est.fecha_graduacion) {
    return `Graduación: ${formatDate(est.fecha_graduacion)}`;
  }
  if (est.en_curso) {
    return "Actualmente en curso / En trámite de graduación";
  }
  return "Período no registrado";
};

const abrirModalEducacion = (est = null) => {
  if (est) {
    formEducacion.value = {
      id: est.id,
      institucion: est.institucion || "",
      nivel_academico: est.nivel_academico || "LICENCIATURA",
      titulo_obtenido: est.titulo_obtenido || "",
      campo_estudio: est.campo_estudio || "",
      fecha_inicio: est.fecha_inicio ? String(est.fecha_inicio).split("T")[0] : "",
      fecha_graduacion: est.fecha_graduacion ? String(est.fecha_graduacion).split("T")[0] : "",
      en_curso: !!est.en_curso,
      notas: est.notas || "",
    };
  } else {
    formEducacion.value = {
      id: null,
      institucion: "",
      nivel_academico: "LICENCIATURA",
      titulo_obtenido: "",
      campo_estudio: "",
      fecha_inicio: "",
      fecha_graduacion: "",
      en_curso: false,
      notas: "",
    };
  }
  showModalEducacion.value = true;
};

const abrirModalColegiado = (col = null) => {
  if (col) {
    formColegiado.value = {
      id: col.id,
      colegio_profesional: col.colegio_profesional || "Colegio de Abogados y Notarios de Guatemala (CANG)",
      numero_colegiado: col.numero_colegiado || "",
      titulo_obtenido: col.titulo_obtenido || "",
      estado_colegiado: col.estado_colegiado || "ACTIVO",
      fecha_graduacion: col.fecha_graduacion ? String(col.fecha_graduacion).split("T")[0] : "",
      vigencia_colegiado: col.vigencia_colegiado ? String(col.vigencia_colegiado).split("T")[0] : "",
      notas: col.notas || "",
    };
  } else {
    formColegiado.value = {
      id: null,
      colegio_profesional: "Colegio de Abogados y Notarios de Guatemala (CANG)",
      numero_colegiado: "",
      titulo_obtenido: "",
      estado_colegiado: "ACTIVO",
      fecha_graduacion: "",
      vigencia_colegiado: "",
      notas: "",
    };
  }
  showModalColegiado.value = true;
};

const editarEstudio = (est) => {
  if (est.numero_colegiado || est.nivel_academico === "COLEGIACION_PROFESIONAL") {
    abrirModalColegiado(est);
  } else {
    abrirModalEducacion(est);
  }
};

const guardarEducacion = async () => {
  if (!colaborador.value?.id) return;
  if (!formEducacion.value.titulo_obtenido) {
    toast.error("El título obtenido o carrera es obligatorio");
    return;
  }
  savingStudy.value = true;
  try {
    const payload = {
      institucion: formEducacion.value.institucion,
      nivel_academico: formEducacion.value.nivel_academico,
      titulo_obtenido: formEducacion.value.titulo_obtenido,
      campo_estudio: formEducacion.value.campo_estudio,
      fecha_inicio: formEducacion.value.fecha_inicio || null,
      fecha_graduacion: formEducacion.value.en_curso ? null : (formEducacion.value.fecha_graduacion || null),
      en_curso: formEducacion.value.en_curso,
      notas: formEducacion.value.notas || null,
    };
    if (formEducacion.value.id) {
      await colabStore.actualizarEstudio(colaborador.value.id, formEducacion.value.id, payload);
      toast.success("Formación académica actualizada correctamente");
    } else {
      await colabStore.crearEstudio(colaborador.value.id, payload);
      toast.success("Formación académica registrada exitosamente");
    }
    showModalEducacion.value = false;
    await loadColaborador();
  } catch (err) {
    toast.error(err.message || "Error al guardar formación académica");
  } finally {
    savingStudy.value = false;
  }
};

const guardarColegiado = async () => {
  if (!colaborador.value?.id) return;
  if (!formColegiado.value.numero_colegiado) {
    toast.error("El número de colegiado es obligatorio");
    return;
  }
  savingStudy.value = true;
  try {
    const payload = {
      colegio_profesional: formColegiado.value.colegio_profesional,
      numero_colegiado: formColegiado.value.numero_colegiado,
      titulo_obtenido: formColegiado.value.titulo_obtenido || `Colegiado Activo (${formColegiado.value.colegio_profesional})`,
      nivel_academico: "COLEGIACION_PROFESIONAL",
      estado_colegiado: formColegiado.value.estado_colegiado,
      fecha_graduacion: formColegiado.value.fecha_graduacion || null,
      vigencia_colegiado: formColegiado.value.vigencia_colegiado || null,
      notas: formColegiado.value.notas || null,
    };
    if (formColegiado.value.id) {
      await colabStore.actualizarEstudio(colaborador.value.id, formColegiado.value.id, payload);
      toast.success("Colegiatura profesional actualizada correctamente");
    } else {
      await colabStore.crearEstudio(colaborador.value.id, payload);
      toast.success("Colegiatura profesional registrada exitosamente");
    }
    showModalColegiado.value = false;
    await loadColaborador();
  } catch (err) {
    toast.error(err.message || "Error al guardar colegiatura");
  } finally {
    savingStudy.value = false;
  }
};

const eliminarEstudioRegistro = async (est) => {
  if (!colaborador.value?.id || !est?.id) return;
  const nombre = est.titulo_obtenido || est.colegio_profesional || "este registro";
  if (!confirm(`¿Está seguro de eliminar el registro "${nombre}"?`)) {
    return;
  }
  try {
    await colabStore.eliminarEstudio(colaborador.value.id, est.id);
    toast.success("Registro académico eliminado exitosamente");
    await loadColaborador();
  } catch (err) {
    toast.error(err.message || "Error al eliminar registro");
  }
};
</script>

<style scoped>
.dossier-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-actions {
  display: flex;
  gap: 0.5rem;
}

.header-card {
  padding: 1.5rem;
}

.header-main {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.avatar-lg {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.header-info {
  flex: 1;
}

.badges-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.colab-fullname {
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.2;
}

.colab-puesto {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-top: 0.25rem;
}

.quick-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-light);
}

.meta-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
}

.meta-val.highlight {
  color: var(--color-primary-700);
}

.section-title {
  font-size: 1.125rem;
  color: var(--color-primary-900);
  margin-bottom: 1rem;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.875rem;
}

.detail-name {
  color: var(--text-muted);
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 768px) {
  .header-main { flex-direction: column; text-align: center; }
  .badges-row { justify-content: center; }
  .quick-meta-grid { justify-content: center; }
  .detail-row { flex-direction: column; gap: 0.25rem; }
}

/* ==========================================================================
   EXPERIENCIA LINKEDIN: FORMACIÓN Y COLEGIACIÓN
   ========================================================================== */

.academico-linkedin-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.linkedin-header-card {
  background: linear-gradient(135deg, rgba(11, 37, 69, 0.03), rgba(212, 175, 55, 0.05));
  border: 1px solid var(--border-color, #e2e8f0);
}

.linkedin-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.linkedin-header-info {
  flex: 1;
  min-width: 280px;
}

.linkedin-header-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.linkedin-section {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
}

.linkedin-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.875rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.section-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.bg-primary-soft {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.bg-gold-soft {
  background: #fefce8;
  color: #b45309;
  border: 1px solid #fef08a;
}

.linkedin-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.linkedin-item {
  display: flex;
  gap: 1rem;
  padding: 1.125rem;
  border: 1px solid var(--border-light, #f1f5f9);
  background: var(--bg-subtle, #f8fafc);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.linkedin-item:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.linkedin-item-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  border: 1px solid #7dd3fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.colegiado-avatar {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fcd34d;
}

.linkedin-item-body {
  flex: 1;
  min-width: 0;
}

.linkedin-item-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.linkedin-institution {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary-900, #0f172a);
  margin: 0;
  line-height: 1.3;
}

.linkedin-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.btn-icon {
  background: transparent;
  border: 1px solid transparent;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s ease;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.btn-icon-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.linkedin-degree {
  font-size: 0.9375rem;
  color: var(--text-main, #1e293b);
  margin-top: 0.25rem;
}

.linkedin-field {
  color: var(--text-muted, #64748b);
}

.linkedin-period {
  font-size: 0.8125rem;
  color: var(--text-muted, #64748b);
  font-weight: 500;
}

.linkedin-notes {
  background: #ffffff;
  border-left: 3px solid var(--color-primary, #0B2545);
  padding: 0.5rem 0.75rem;
  border-radius: 0 4px 4px 0;
  color: #334155;
  font-style: italic;
  border-top: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}

.linkedin-empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: var(--bg-subtle, #f8fafc);
  border: 1px dashed var(--border-color, #cbd5e1);
  border-radius: 8px;
}

.empty-icon {
  font-size: 2.75rem;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-primary-900, #0f172a);
  margin-bottom: 0.35rem;
}

.empty-desc {
  max-width: 440px;
  margin: 0 auto;
}
</style>
