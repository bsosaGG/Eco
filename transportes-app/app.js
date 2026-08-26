const API_URL = '/api/transportes';
const BASE_PATH = '.';
let solicitudIdActual = null;
let intervalRefresco = null;
let solicitudesAdminGlobal = [];
let solicitudesUsuarioGlobal = [];

// Catálogo oficial de la flota vehicular formateado con "TIPO (PLACA)"
const CATALOGO_VEHICULOS = {
    "O 480 BBS": "YARIS (O 480 BBS)",
    "O 481 BBS": "PICK UP (O 481 BBS)",
    "O 482 BBS": "PICK UP (O 482 BBS)",
    "O 483 BBS": "MICROBUS (O 483 BBS)",
    "O 485 BBS": "PICK UP (O 485 BBS)",
    "O 093 BBS": "PICK UP (O 093 BBS)",
    "O 094 BBS": "PICK UP (O 094 BBS)",
    "O 484 BBS": "PICK UP (O 484 BBS)",
    "O 206 BCF": "CAMIONETA PRADO (O 206 BCF)",
    "O 205 BCF": "CAMIONETA PRADO (O 205 BCF)",
    "O 972 BBJ": "MICROBUS (O 972 BBJ)",
    "P 012 CBW": "GRAN VITARA (P 012 CBW)",
    "O 857 BBS": "CAMION (O 857 BBS)",
    "O 466 BBV": "MICROBUS (O 466 BBV)",
    "O 455 BBV": "CAMION (O 455 BBV)",
    "M 042 CQS": "MOTOCICLETA (M 042 CQS)",
    "M 043 CQS": "MOTOCICLETA (M 043 CQS)",
    "M 044 CQS": "MOTOCICLETA (M 044 CQS)",
    "M 045 CQS": "MOTOCICLETA (M 045 CQS)",
    "M 130 FMY": "MOTOCICLETA (M 130 FMY)",
    "M 129 FMY": "MOTOCICLETA (M 129 FMY)",
    "M 131 FMY": "MOTOCICLETA (M 131 FMY)",
    "M 132 FMY": "MOTOCICLETA (M 132 FMY)",
    "M 133 FMY": "MOTOCICLETA (M 133 FMY)",
    "C 948 BZW": "MICROBUS (C 948 BZW)"
};

// Configuración de Notificación Flotante (Toast)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();

    window.addEventListener('popstate', () => {
        verificarSesion();
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', manejarLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', manejarRegistro);

    const solicitudForm = document.getElementById('solicitud-form');
    if (solicitudForm) solicitudForm.addEventListener('submit', enviarSolicitud);

    const formAsignar = document.getElementById('form-asignar-unidad');
    if (formAsignar) {
        formAsignar.addEventListener('submit', guardarAsignacionModal);
    }
});

function navegarA(subruta) {
    const nuevaRuta = `${BASE_PATH}${subruta}`;
    if (window.location.pathname !== nuevaRuta && window.location.pathname !== subruta) {
        history.pushState(null, '', nuevaRuta);
    }
}

function mostrarTab(tipo) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const btnLogin = document.getElementById('btn-tab-login');
    const btnRegister = document.getElementById('btn-tab-register');
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.classList.add('hidden');

    if (tipo === 'login') {
        navegarA('/login');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        btnLogin.className = "w-1/2 pb-2 font-bold text-blue-600 border-b-2 border-blue-600 text-center";
        btnRegister.className = "w-1/2 pb-2 font-semibold text-gray-500 text-center";
    } else {
        navegarA('/register');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        btnRegister.className = "w-1/2 pb-2 font-bold text-emerald-600 border-b-2 border-emerald-600 text-center";
        btnLogin.className = "w-1/2 pb-2 font-semibold text-gray-500 text-center";
    }
}

// 1. REGISTRO DE USUARIOS CON AUTO-LOGIN
async function manejarRegistro(event) {
    event.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const apellido = document.getElementById('reg-apellido').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al registrar usuario');

        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));

            Toast.fire({
                icon: 'success',
                title: '¡Cuenta creada e inicio de sesión exitoso!'
            });

            document.getElementById('register-form').reset();
            verificarSesion();
        } else {
            mostrarTab('login');
        }

    } catch (error) {
        Toast.fire({
            icon: 'error',
            title: error.message || 'Error al crear usuario'
        });
    }
}

// 2. AUTENTICACIÓN (LOGIN)
async function manejarLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        verificarSesion();
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// VERIFICACIÓN DE SESIÓN
function verificarSesion() {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    const loginSection = document.getElementById('login-section');
    const userPanel = document.getElementById('user-panel');
    const adminPanel = document.getElementById('admin-panel');
    const userInfo = document.getElementById('user-info');

    if (!token || !userRaw) {
        if (loginSection) loginSection.classList.remove('hidden');
        if (userPanel) userPanel.classList.add('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
        if (userInfo) userInfo.classList.add('hidden');

        if (window.location.pathname.includes('register')) {
            mostrarTab('register');
        } else {
            mostrarTab('login');
        }
        return;
    }

    const user = JSON.parse(userRaw);

    if (loginSection) loginSection.classList.add('hidden');
    if (userInfo) userInfo.classList.remove('hidden');
    
    const welcomeText = document.getElementById('welcome-text');
    if (welcomeText) welcomeText.textContent = `Bienvenido: ${user.name || user.email}`;

    if (intervalRefresco) clearInterval(intervalRefresco);

    const esAdmin = user.permissions?.includes('transportes:admin');

    if (esAdmin) {
        if (userPanel) userPanel.classList.add('hidden');
        if (adminPanel) adminPanel.classList.remove('hidden');
        cargarSolicitudesAdmin();
        intervalRefresco = setInterval(cargarSolicitudesAdmin, 3000);
    } else {
        if (adminPanel) adminPanel.classList.add('hidden');
        if (userPanel) userPanel.classList.remove('hidden');
        cargarMisSolicitudes();
        intervalRefresco = setInterval(cargarMisSolicitudes, 3000);
    }
}

function cerrarSesion() {
    if (intervalRefresco) clearInterval(intervalRefresco);
    localStorage.clear();
    navegarA('/');
    window.location.reload();
}

// 3. ENVÍO DE SOLICITUD PÚBLICA
async function enviarSolicitud(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const solicitante = document.getElementById('nombre_solicitante').value;
    const telefono = document.getElementById('telefono').value.trim();
    const dependencia = document.getElementById('dependencia').value;
    const direccion = document.getElementById('direccion').value;
    const destino = document.getElementById('destino').value;
    const motivo = document.getElementById('motivo').value;
    const fecha_salida = document.getElementById('fecha_salida').value;
    const pasajerosVal = document.getElementById('pasajeros').value.trim();
    const tipo_vehiculo = document.getElementById('tipo_vehiculo').value || null;

    if (!/^\d+$/.test(telefono)) {
        Toast.fire({
            icon: 'warning',
            title: 'El número de teléfono debe contener solo números.'
        });
        return;
    }

    if (!/^\d+$/.test(pasajerosVal) || parseInt(pasajerosVal) < 1) {
        Toast.fire({
            icon: 'warning',
            title: 'Ingrese una cantidad válida de pasajeros.'
        });
        return;
    }

    try {
        const response = await fetch(`${API_URL}/solicitudes/publica`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                usuario_id: user ? user.id : null,
                solicitante, 
                telefono, 
                dependencia, 
                direccion, 
                destino, 
                motivo, 
                fecha_salida, 
                pasajeros: parseInt(pasajerosVal),
                tipo_vehiculo,
                recaptcha_token: 'token_mock_local' 
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al crear la solicitud');

        Toast.fire({
            icon: 'success',
            title: '¡Solicitud enviada correctamente!'
        });

        document.getElementById('solicitud-form').reset();
        cargarMisSolicitudes();
    } catch (error) {
        Toast.fire({
            icon: 'error',
            title: error.message || 'Error al enviar solicitud'
        });
    }
}

// 4. CARGAR SOLICITUDES DEL USUARIO
async function cargarMisSolicitudes() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/solicitudes/area`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const solicitudes = await response.json();

        const tbody = document.getElementById('tabla-mis-solicitudes');
        if (!tbody) return;

        if (response.ok && Array.isArray(solicitudes)) {
            solicitudesUsuarioGlobal = solicitudes;
            let htmlFilas = '';

            solicitudes.forEach(s => {
                let estadoBadge = '<span class="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold inline-block">🟡 PENDIENTE</span>';
                
                if (s.estado === 'Asignado') {
                    estadoBadge = '<span class="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold inline-block">🟢 ASIGNADO</span>';
                } else if (s.estado === 'RECHAZADO') {
                    estadoBadge = '<span class="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold inline-block">🔴 RECHAZADO</span>';
                }

                htmlFilas += `
                    <tr class="border-b hover:bg-slate-50 transition-colors">
                        <td class="p-3 text-slate-700 break-words">${s.direccion || 'No especificada'}</td>
                        <td class="p-3 font-medium text-slate-900 break-words">${s.destino}</td>
                        <td class="p-3 break-words">${s.motivo}</td>
                        <td class="p-3">${estadoBadge}</td>
                        <td class="p-3 text-center">
                            <button onclick="verDetalleSolicitud(${s.id})" class="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium transition">
                                Ver
                            </button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = htmlFilas;
        }
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

// 5. CARGAR SOLICITUDES EN PANEL ADMIN
async function cargarSolicitudesAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const solicitudes = await response.json();

        const tbody = document.getElementById('tabla-admin-solicitudes');
        if (!tbody) return;

        if (response.ok && Array.isArray(solicitudes)) {
            solicitudesAdminGlobal = solicitudes;
            let htmlFilas = '';

            solicitudes.forEach(s => {
                let estadoBadge = '<span class="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold inline-block"> PENDIENTE</span>';
                
                if (s.estado === 'Asignado') {
                    estadoBadge = '<span class="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold inline-block"> ASIGNADO</span>';
                } else if (s.estado === 'RECHAZADO') {
                    estadoBadge = '<span class="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold inline-block"> RECHAZADO</span>';
                }

                let botonesAccion = `
                    <div class="flex space-x-1">
                        <button onclick="verDetalleSolicitud(${s.id})" class="bg-slate-600 hover:bg-slate-700 text-white px-2 py-1.5 rounded text-xs font-medium transition">Ver</button>
                `;

                if (s.estado !== 'Asignado' && s.estado !== 'RECHAZADO') {
                    botonesAccion += `
                        <button onclick="asignarVehiculo(${s.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-xs font-medium transition">Asignar Unidad</button>
                        <button onclick="rechazarSolicitud(${s.id})" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1.5 rounded text-xs font-medium transition">Rechazar</button>
                    `;
                }

                botonesAccion += `</div>`;

                htmlFilas += `
                    <tr class="border-b hover:bg-slate-50 transition-colors">
                        <td class="p-3 font-semibold text-slate-800 break-words">${s.solicitante}</td>
                        <td class="p-3 break-words">${s.telefono || 'N/A'}</td>
                        <td class="p-3 break-words">${s.dependencia}</td>
                        <td class="p-3 text-slate-700 break-words">${s.direccion || 'No especificada'}</td>
                        <td class="p-3 break-words">${s.destino}</td>
                        <td class="p-3">${estadoBadge}</td>
                        <td class="p-3">${botonesAccion}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = htmlFilas;
        }
    } catch (error) {
        console.error('Error al cargar admin:', error);
    }
}

// 6. ACCIÓN DE RECHAZAR CON MOTIVO
async function rechazarSolicitud(id) {
    const { value: justificacion } = await Swal.fire({
        title: 'Rechazar Solicitud',
        input: 'textarea',
        inputLabel: 'Indique el motivo o la razón de rechazo:',
        inputPlaceholder: 'Ej. No hay unidades disponibles para la fecha especificada...',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Rechazar Solicitud',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return '¡Debe ingresar una justificación para rechazar!';
            }
        }
    });

    if (justificacion) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/solicitudes/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: 'RECHAZADO', justificacion })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al rechazar');

            Toast.fire({
                icon: 'success',
                title: 'Solicitud rechazada correctamente'
            });

            cargarSolicitudesAdmin();
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: error.message || 'Error al procesar el rechazo'
            });
        }
    }
}

function asignarVehiculo(id) {
    solicitudIdActual = id;
    
    document.getElementById('modal-conductor').value = '';
    document.getElementById('modal-marca').value = '';
    
    document.getElementById('modal-asignar').classList.remove('hidden');
}

function cerrarModalAsignar() {
    document.getElementById('modal-asignar').classList.add('hidden');
    solicitudIdActual = null;
}

// 7. GUARDAR ASIGNACIÓN LOGÍSTICA (UNIFICADO)
async function guardarAsignacionModal(event) {
    event.preventDefault();
    if (!solicitudIdActual) return;

    const conductor = document.getElementById('modal-conductor').value.trim();
    const vehiculoNombre = document.getElementById('modal-marca').value.trim();

    // Extraer la placa que está encerrada entre paréntesis para la API
    let placa = '';
    const matchPlaca = vehiculoNombre.match(/\(([^)]+)\)/);
    if (matchPlaca) {
        placa = matchPlaca[1];
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/admin/solicitudes/${solicitudIdActual}/asignar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ conductor, vehiculo: vehiculoNombre, placa })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al asignar');

        cerrarModalAsignar();

        Toast.fire({
            icon: 'success',
            title: '¡Conductor y vehículo asignados con éxito!'
        });

        cargarSolicitudesAdmin();
    } catch (error) {
        Toast.fire({
            icon: 'error',
            title: error.message || 'Error al asignar unidad'
        });
    }
}

// 8. LIMPIAR FORMULARIO DE SOLICITUD
function cancelarSolicitudForm() {
    const form = document.getElementById('solicitud-form');
    if (form) {
        form.reset();
        Toast.fire({
            icon: 'info',
            title: 'Formulario de solicitud limpiado'
        });
    }
}

// MODAL DE DETALLE (VER ASIGNACIÓN UNIFICADA)
function verDetalleSolicitud(id) {
    const solicitud = solicitudesAdminGlobal.find(s => s.id === id) || solicitudesUsuarioGlobal.find(s => s.id === id);
    if (!solicitud) return;

    document.getElementById('det-solicitante').textContent = solicitud.solicitante || 'N/A';
    document.getElementById('det-telefono').textContent = solicitud.telefono || 'N/A';
    document.getElementById('det-dependencia').textContent = solicitud.dependencia || 'N/A';
    document.getElementById('det-direccion').textContent = solicitud.direccion || 'No especificada';
    document.getElementById('det-destino').textContent = solicitud.destino || 'N/A';
    document.getElementById('det-pasajeros').textContent = solicitud.pasajeros || '1';
    
    const detTipoVehiculo = document.getElementById('det-tipo-vehiculo');
    if (detTipoVehiculo) {
        detTipoVehiculo.textContent = solicitud.tipo_vehiculo || 
                                     solicitud.vehiculo_requerido || 
                                     solicitud.tipo_vehiculo_requerido || 
                                     solicitud.tipoVehiculo || 
                                     'No especificado';
    }

    document.getElementById('det-motivo').textContent = solicitud.motivo || 'No especificado';
    
    const fecha = solicitud.fecha_salida ? new Date(solicitud.fecha_salida).toLocaleString('es-GT') : 'No especificada';
    document.getElementById('det-fecha').textContent = fecha;

    const esRechazado = solicitud.estado === 'RECHAZADO';
    const contenedorRechazo = document.getElementById('contenedor-det-rechazo');
    const contenedorAsignacion = document.getElementById('contenedor-det-asignacion');

    if (esRechazado) {
        document.getElementById('det-justificacion').textContent = solicitud.justificacion || 'No se especificó la razón.';
        if (contenedorRechazo) contenedorRechazo.classList.remove('hidden');
        if (contenedorAsignacion) contenedorAsignacion.classList.add('hidden');
    } else {
        if (contenedorRechazo) contenedorRechazo.classList.add('hidden');
        if (contenedorAsignacion) contenedorAsignacion.classList.remove('hidden');

        document.getElementById('det-conductor').textContent = solicitud.conductor || 'Por asignar';
        document.getElementById('det-vehiculo').textContent = solicitud.vehiculo || 'Por asignar';
    }

    document.getElementById('modal-ver-detalle').classList.remove('hidden');
}

function cerrarModalVer() {
    document.getElementById('modal-ver-detalle').classList.add('hidden');
}