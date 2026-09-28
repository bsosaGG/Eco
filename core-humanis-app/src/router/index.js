import { createRouter, createWebHistory } from "vue-router";
import CollaboratorsView from "../views/collaborators.view.vue";
import CollaboratorDetailView from "../views/collaborator-detail.view.vue";
import CertificatesView from "../views/certificates.view.vue";
import AlertsView from "../views/alerts.view.vue";
import AuditLogsView from "../views/audit-logs.view.vue";
import CertificateVerificationView from "../views/certificate-verification.view.vue";
import VacationsView from "../views/vacations.view.vue";
import LeavesView from "../views/leaves.view.vue";
import PortalView from "../views/portal.view.vue";
import AttendanceView from "../views/attendance.view.vue";
import PayrollsView from "../views/payrolls.view.vue";
import PayrollDetailView from "../views/payroll-detail.view.vue";
import PersonnelActionsView from "../views/personnel-actions.view.vue";
import DisciplinaryView from "../views/disciplinary.view.vue";
import RecruitmentsView from "../views/recruitments.view.vue";
import EvaluationsView from "../views/evaluations.view.vue";
import ExecutiveDashboardView from "../views/executive-dashboard.view.vue";
import TrainingsView from "../views/trainings.view.vue";
import OccupationalHealthView from "../views/occupational-health.view.vue";
import ClimateView from "../views/climate.view.vue";
import HiringView from "../views/hiring.view.vue";
import TemplatesView from "../views/templates.view.vue";
import ComplaintsView from "../views/complaints.view.vue";
import LoginView from "../views/login.view.vue";
import { useAuthStore } from "../stores/auth.store";

const routes = [
  // Ruta de inicio de sesión y simulación de perfiles
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  // Redirección inteligente según el rol del usuario
  {
    path: "/",
    redirect: () => {
      const authStore = useAuthStore();
      if (authStore.isColaborador) {
        return "/portal";
      }
      if (authStore.isAuditor) {
        return "/audit-logs";
      }
      return "/collaborators";
    },
  },

  // ---------------------------------------------------------------------------
  // RUTAS CANÓNICAS EN INGLÉS Y PLURAL (OLA 1 & OLA 2)
  // ---------------------------------------------------------------------------
  {
    path: "/collaborators",
    name: "collaborators",
    component: CollaboratorsView,
  },
  {
    path: "/collaborators/:id",
    name: "collaborator-detail",
    component: CollaboratorDetailView,
  },
  {
    path: "/certificates",
    name: "certificates",
    component: CertificatesView,
  },
  {
    path: "/alerts",
    name: "alerts",
    component: AlertsView,
  },
  {
    path: "/vacations",
    name: "vacations",
    component: VacationsView,
  },
  {
    path: "/leaves",
    name: "leaves",
    component: LeavesView,
  },
  {
    path: "/attendance",
    name: "attendance",
    component: AttendanceView,
  },
  {
    path: "/portal",
    name: "portal",
    component: PortalView,
  },
  {
    path: "/payrolls",
    name: "payrolls",
    component: PayrollsView,
  },
  {
    path: "/payrolls/:id",
    name: "payroll-detail",
    component: PayrollDetailView,
  },
  {
    path: "/personnel-actions",
    name: "personnel-actions",
    component: PersonnelActionsView,
  },
  {
    path: "/disciplinary",
    name: "disciplinary",
    component: DisciplinaryView,
  },
  {
    path: "/recruitments",
    name: "recruitments",
    component: RecruitmentsView,
  },
  {
    path: "/evaluations",
    name: "evaluations",
    component: EvaluationsView,
  },
  {
    path: "/executive-dashboard",
    name: "executive-dashboard",
    component: ExecutiveDashboardView,
  },
  {
    path: "/trainings",
    name: "trainings",
    component: TrainingsView,
  },
  {
    path: "/occupational-health",
    name: "occupational-health",
    component: OccupationalHealthView,
  },
  {
    path: "/climate",
    name: "climate",
    component: ClimateView,
  },
  {
    path: "/hiring",
    name: "hiring",
    component: HiringView,
  },
  {
    path: "/templates",
    name: "templates",
    component: TemplatesView,
  },
  {
    path: "/complaints",
    name: "complaints",
    component: ComplaintsView,
  },
  {
    path: "/audit-logs",
    name: "audit-logs",
    component: AuditLogsView,
  },
  {
    path: "/certificates/verifications/:hash",
    name: "certificate-verification",
    component: CertificateVerificationView,
  },

  // ---------------------------------------------------------------------------
  // ALIAS Y REDIRECCIONES DE RETROCOMPATIBILIDAD
  // ---------------------------------------------------------------------------
  {
    path: "/directorio",
    redirect: "/collaborators",
  },
  {
    path: "/colaborador/:id",
    redirect: (to) => `/collaborators/${to.params.id}`,
  },
  {
    path: "/constancias",
    redirect: "/certificates",
  },
  {
    path: "/alertas",
    redirect: "/alerts",
  },
  {
    path: "/vacaciones",
    redirect: "/vacations",
  },
  {
    path: "/licencias",
    redirect: "/leaves",
  },
  {
    path: "/auditoria",
    redirect: "/audit-logs",
  },
  {
    path: "/reclutamiento",
    redirect: "/recruitments",
  },
  {
    path: "/evaluaciones",
    redirect: "/evaluations",
  },
  {
    path: "/dashboard-ejecutivo",
    redirect: "/executive-dashboard",
  },
  {
    path: "/capacitaciones",
    redirect: "/trainings",
  },
  {
    path: "/sso",
    redirect: "/occupational-health",
  },
  {
    path: "/clima-laboral",
    redirect: "/climate",
  },
  {
    path: "/contratacion",
    redirect: "/hiring",
  },
  {
    path: "/plantillas",
    redirect: "/templates",
  },
  {
    path: "/validar/:hash",
    redirect: (to) => `/certificates/verifications/${to.params.hash}`,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
