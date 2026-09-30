# Módulo de Clínica Médica Institucional & Salud Ocupacional (SSO)

Documentación del Módulo de Atención Médica, Registro Clínico de la Dra. Asignada, Libro Oficial de Accidentes y Comité Bipartito conforme a los Acuerdos Gubernativos 229-2014 y 33-2016 del Ministerio de Trabajo y Previsión Social (MINTRAB).

---

## 1. Visión General del Módulo

El Módulo de **Clínica Médica & SSO** es el componente de Salud Ocupacional de **Core-Humanis** diseñado para la Secretaría de Comunicación Social de la Presidencia (**SCSPR**). Permite la gestión integral de la atención primaria de salud del servidor público y contratista, la emisión de reposos médicos institucionales, remisiones al IGSS, el control del Libro Oficial de Accidentes de Trabajo y la acreditación del Comité Bipartito de SSO.

---

## 2. Pestañas y Funcionalidades del Sistema (`/occupational-health`)

### 🩺 2.1. Registro de Consultas Médicas (Dra. Institucional)
- **Formulario de Atención Clínica**: Formulario reactivo simplificado para registro en menos de 1 minuto durante la atención del colaborador.
- **Signos Vitales**: Control de Presión Arterial (`mmHg`), Temperatura (`°C`), Pulso (`bpm`) y Peso (`kg/lbs`).
- **Diagnóstico y Prescripción**: Captura de motivo de consulta (síntomas), diagnóstico clínico y tratamiento/medicamentos recomendados.
- **Acciones Administrativas Integradas**:
  - **Reposo / Incapacidad Institucional**: Genera la alerta de días de reposo autorizados con impacto directo en el módulo de Asistencia/Licencias (`/leaves`).
  - **Remisión Externa IGSS**: Marcaje para seguimiento de incapacidad oficial emitida por el Instituto Guatemalteco de Seguridad Social.

### 📗 2.2. Libro Oficial de Accidentes e Incidentes (AG 229-2014)
- **Asiento de Eventos**: Registro circunstancial de accidentes con baja, sin baja, incidentes peligrosos y sospechas de enfermedades ocupacionales.
- **Cálculo de Indicadores Internacionales**:
  - **Tasa de Frecuencia (IF)**: $(\text{Accidentes con baja} \times 1,000,000) / \text{Horas Hombre Trabadas}$
  - **Tasa de Gravedad (IG)**: $(\text{Días perdidos} \times 1,000) / \text{Horas Hombre Trabadas}$

### 🛡️ 2.3. Comité Bipartito SSO (MINTRAB)
- **Acreditación de Miembros**: Control de representantes patronales y de los trabajadores acreditados ante el Ministerio de Trabajo.

---

## 3. Modelo de Datos y Esquema Relacional

### Tabla: `sso_consultas_medicas`
```sql
CREATE TABLE IF NOT EXISTS sso_consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  doctora_nombre VARCHAR(150) DEFAULT 'Dra. Claudia Ramos - SCSPR',
  fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  motivo_consulta TEXT NOT NULL,
  diagnostico TEXT NOT NULL,
  signos_vitales JSONB,
  tratamiento_indicado TEXT,
  genera_reposo BOOLEAN DEFAULT false,
  dias_reposo INT DEFAULT 0,
  remite_igss BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Endpoints API REST

| Método | Endpoint | Descripción | Permisos |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/core-humanis/occupational-health/consultations` | Lista de consultas médicas registradas | `verifyToken` |
| `POST` | `/api/v1/core-humanis/occupational-health/consultations` | Registrar nueva consulta médica de la Dra. | `core-humanis:write` |
| `GET` | `/api/v1/core-humanis/occupational-health/incidents` | Lista asientos del Libro Oficial de Accidentes | `verifyToken` |
| `POST` | `/api/v1/core-humanis/occupational-health/incidents` | Asentar evento en el Libro de Accidentes | `core-humanis:write` |
| `GET` | `/api/v1/core-humanis/occupational-health/committee` | Consulta miembros y periodo del Comité SSO | `verifyToken` |

---

## 5. Estado de Desarrollo del Módulo

- **Estado Actual**: 🟢 **Completado (MVP Operativo v2.2.0)**
- **Fecha de Despliegue**: Septiembre 2026
- **Archivos Clave**:
  - Backend Controller: [`api/src/controllers/occupational-health.controller.js`](../../api/src/controllers/occupational-health.controller.js)
  - Pinia Store: [`core-humanis-app/src/stores/occupational-health.store.js`](../src/stores/occupational-health.store.js)
  - Vista Principal Vue 3: [`core-humanis-app/src/views/occupational-health.view.vue`](../src/views/occupational-health.view.vue)
  - Vista Ficha Colaborador: [`core-humanis-app/src/views/collaborator-detail.view.vue`](../src/views/collaborator-detail.view.vue)

---

## 6. Privacidad de Datos Médicos y Confidencialidad Médico-Paciente

> [!IMPORTANT]
> **Marco Legal de Protección de Datos Sensibles**:
> Los datos clínicos recopilados en este módulo están clasificados como **información confidencial y datos sensibles** conforme a la Ley de Acceso a la Información Pública (Decreto 57-2008 de Guatemala, Art. 9 y 22) y el Código de Ética Médica.

1. **Visibilidad Restringida en el Perfil del Colaborador (`/collaborators/:id`)**:
   - En la pestaña **"Historial Clínico / Reposos"** del perfil del colaborador, únicamente se presentan los datos mínimos indispensables requeridos para la gestión administrativa de RRHH: **fecha de atención, médico tratante, motivo general, diagnóstico general, días de reposo autorizados y remisión al IGSS**.
2. **Resguardo del Expediente Detallado (Clínica Interna)**:
   - Los detalles clínicos exhaustivos (signos vitales en tiempo real, tratamientos farmacológicos específicos y notas confidenciales de la Dra.) permanecen bajo custodia exclusiva del módulo médico (`/occupational-health`).
3. **Control de Acceso por Roles (RBAC)**:
   - La creación y modificación de expedientes clínicos está restringida exclusivamente a usuarios con el rol médico acreditado (`core-humanis:write`), evitando la manipulación por parte de personal ajeno a la unidad médica.

